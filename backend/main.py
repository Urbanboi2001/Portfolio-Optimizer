from fastapi import FastAPI, UploadFile, File
from fastapi.middleware.cors import CORSMiddleware
import pandas as pd
import numpy as np
from scipy.optimize import minimize
import io
import os
import json
from pydantic import BaseModel
from typing import List, Dict, Any

app = FastAPI()

DATA_DIR = os.path.join(os.path.dirname(__file__), "data", "saved_analyses")
os.makedirs(DATA_DIR, exist_ok=True)


app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

RISK_FREE_RATE = 0.06
TRADING_DAYS = 252

def calculate_metrics(nav_series):
    # nav_series is a pandas Series of NAVs, sorted by Date
    returns = nav_series.pct_change().dropna()
    
    if len(nav_series) < 2:
        return None
    
    # CAGR
    start_val = nav_series.iloc[0]
    end_val = nav_series.iloc[-1]
    years = len(nav_series) / TRADING_DAYS
    cagr = (end_val / start_val) ** (1 / years) - 1 if years > 0 else 0
    
    # Annualized Volatility
    ann_vol = returns.std() * np.sqrt(TRADING_DAYS)
    
    # Sharpe Ratio
    sharpe = (cagr - RISK_FREE_RATE) / ann_vol if ann_vol > 0 else 0
    
    # Sortino Ratio
    downside_returns = returns[returns < 0]
    downside_dev = downside_returns.std() * np.sqrt(TRADING_DAYS)
    sortino = (cagr - RISK_FREE_RATE) / downside_dev if downside_dev > 0 else 0
    
    # Max Drawdown
    cumulative = nav_series / nav_series.iloc[0]
    running_max = cumulative.cummax()
    drawdown = (cumulative - running_max) / running_max
    max_dd = drawdown.min()
    
    return {
        "cagr": cagr,
        "volatility": ann_vol,
        "sharpe": sharpe,
        "sortino": sortino,
        "max_drawdown": max_dd
    }

@app.post("/api/analyze")
async def analyze_funds(files: list[UploadFile] = File(...)):
    fund_data = {}
    
    for file in files:
        contents = await file.read()
        
        # Read fund name from row 4 (index 3)
        df_header = pd.read_excel(io.BytesIO(contents), nrows=5, header=None)
        fund_name = str(df_header.iloc[3, 0]).strip()
        
        # Read actual data from row 5 onwards (header at index 4)
        df = pd.read_excel(io.BytesIO(contents), header=4)
        
        # Keep Date and Net Asset Value
        df = df[['Date', 'Net Asset Value']].dropna()
        df['Date'] = pd.to_datetime(df['Date'])
        df = df.sort_values('Date')
        df['Net Asset Value'] = pd.to_numeric(df['Net Asset Value'], errors='coerce').dropna()
        
        df = df.set_index('Date')
        fund_data[fund_name] = df['Net Asset Value']
    
    # Combine into a single DataFrame
    combined_df = pd.DataFrame(fund_data)
    combined_df = combined_df.dropna() # Keep only overlapping dates for fair comparison
    
    if combined_df.empty:
        return {"error": "No overlapping data found for the selected funds."}
    
    # Calculate Metrics for each fund
    metrics = []
    for col in combined_df.columns:
        m = calculate_metrics(combined_df[col])
        if m:
            m['name'] = col
            metrics.append(m)
            
    # Calculate Efficient Frontier
    returns = combined_df.pct_change().dropna()
    mean_returns = returns.mean() * TRADING_DAYS
    cov_matrix = returns.cov() * TRADING_DAYS
    
    num_assets = len(combined_df.columns)
    
    # Generate random portfolios to plot efficient frontier background (optional, or just optimization)
    # Let's use optimization to find the true frontier
    target_returns = np.linspace(mean_returns.min(), mean_returns.max(), 50)
    frontier_x = []
    frontier_y = []
    
    def portfolio_volatility(weights, cov_matrix):
        return np.sqrt(np.dot(weights.T, np.dot(cov_matrix, weights)))
    
    for target in target_returns:
        constraints = (
            {'type': 'eq', 'fun': lambda x: np.sum(x) - 1},
            {'type': 'eq', 'fun': lambda x: np.sum(x * mean_returns) - target}
        )
        bounds = tuple((0, 1) for _ in range(num_assets))
        initial_guess = num_assets * [1. / num_assets,]
        
        result = minimize(portfolio_volatility, initial_guess, args=(cov_matrix,), method='SLSQP', bounds=bounds, constraints=constraints)
        if result.success:
            frontier_x.append(result.fun)
            frontier_y.append(target)
            
    # Chart data for NAV over time (normalized to 100)
    normalized_df = (combined_df / combined_df.iloc[0]) * 100
    chart_data = []
    for date, row in normalized_df.iterrows():
        entry = {"date": date.strftime("%Y-%m-%d")}
        for col in normalized_df.columns:
            entry[col] = row[col]
        chart_data.append(entry)
        
    return {
        "metrics": metrics,
        "chart_data": chart_data,
        "efficient_frontier": {
            "volatility": frontier_x,
            "return": frontier_y
        },
        "correlation_matrix": returns.corr().fillna(0).to_dict()
    }

class OptimizeRequest(BaseModel):
    chart_data: List[Dict[str, Any]]
    investments: Dict[str, float]
    years_invested: int
    min_return: float
    max_risk: float
    max_drawdown: float
    min_sharpe: float

@app.post("/api/optimize")
async def optimize_portfolio(request: OptimizeRequest):
    df = pd.DataFrame(request.chart_data)
    if 'date' in df.columns:
        df['date'] = pd.to_datetime(df['date'])
        df = df.set_index('date')
        
    if df.empty or len(df.columns) == 0:
        return {"error": "No data provided."}
        
    returns = df.pct_change().dropna()
    if returns.empty:
        return {"error": "Not enough overlapping data points to calculate returns."}
    mean_returns = returns.mean() * TRADING_DAYS
    cov_matrix = returns.cov() * TRADING_DAYS
    
    num_assets = len(df.columns)
    
    def portfolio_return(weights):
        return float(np.dot(mean_returns.values, weights))
        
    def portfolio_volatility(weights):
        var = np.dot(weights.T, np.dot(cov_matrix.values, weights))
        return np.sqrt(max(0, float(var)))
        
    corr_matrix_vals = returns.corr().fillna(0).values
    
    def neg_sharpe_ratio(weights):
        p_ret = portfolio_return(weights)
        p_vol = portfolio_volatility(weights)
        sharpe = (p_ret - RISK_FREE_RATE) / p_vol if p_vol > 0 else 0
        
        penalty = 0
        for i in range(num_assets):
            for j in range(i+1, num_assets):
                if corr_matrix_vals[i, j] > 0.60:
                    penalty += weights[i] * weights[j] * (corr_matrix_vals[i, j] - 0.60)
                    
        return -sharpe + (penalty * 5.0)
        
    def portfolio_max_drawdown(weights):
        port_returns = np.dot(returns.values, weights)
        cumulative = np.cumprod(1 + port_returns)
        running_max = np.maximum.accumulate(cumulative)
        drawdown = np.where(running_max > 0, (cumulative - running_max) / running_max, 0.0)
        return float(abs(np.min(drawdown))) if drawdown.size > 0 else 0.0
        
    # Standard constraints
    constraints = [
        {'type': 'eq', 'fun': lambda x: np.sum(x) - 1}, # Weights must sum to 1
        {'type': 'ineq', 'fun': lambda x: 0.25 - np.sum(x**2)} # Min funds HHI constraint
    ]
    
    # User-defined constraints
    if request.min_return > -1.0: # Ignore if slider is at lowest
        constraints.append({'type': 'ineq', 'fun': lambda x: portfolio_return(x) - request.min_return})
    if request.max_risk < 1.0: # Ignore if slider is at highest
        constraints.append({'type': 'ineq', 'fun': lambda x: request.max_risk - portfolio_volatility(x)})
    if request.min_sharpe > -5.0:
        constraints.append({'type': 'ineq', 'fun': lambda x: -neg_sharpe_ratio(x) - request.min_sharpe})
    if request.max_drawdown < 1.0:
        constraints.append({'type': 'ineq', 'fun': lambda x: request.max_drawdown - portfolio_max_drawdown(x)})
        
    bounds = tuple((0, 0.30) for _ in range(num_assets))
    initial_guess = num_assets * [1. / num_assets,]
    
    result = minimize(neg_sharpe_ratio, initial_guess, method='SLSQP', bounds=bounds, constraints=constraints)
    
    warning_msg = None
    if not result.success:
        # Fallback to unconstrained optimization (only sum of weights = 1)
        fallback_constraints = [
            {'type': 'eq', 'fun': lambda x: np.sum(x) - 1},
            {'type': 'ineq', 'fun': lambda x: 0.25 - np.sum(x**2)}
        ]
        result = minimize(neg_sharpe_ratio, initial_guess, method='SLSQP', bounds=bounds, constraints=fallback_constraints)
        if not result.success:
            return {"error": "Could not find a portfolio matching those strict constraints, and the unconstrained fallback also failed."}
        warning_msg = "Strict constraints could not be met. Showing the unconstrained Maximum Sharpe portfolio instead."
        
    optimal_weights = result.x
    
    total_investment = sum(request.investments.values()) if request.investments else 0
    p_cagr = portfolio_return(optimal_weights)
    p_vol = portfolio_volatility(optimal_weights)
    p_sharpe = (p_cagr - RISK_FREE_RATE) / p_vol if p_vol > 0 else 0
    p_drawdown = portfolio_max_drawdown(optimal_weights)
    
    future_value = total_investment * ((1 + p_cagr) ** request.years_invested)
    
    weights_dict = {col: float(weight) for col, weight in zip(df.columns, optimal_weights)}
    
    # Safely convert metrics to float to prevent JSON serialization errors
    import math
    def safe_float(v):
        try:
            val = float(v)
            if math.isnan(val) or math.isinf(val):
                return 0.0
            return val
        except:
            return 0.0

    metrics = {
        "cagr": safe_float(p_cagr),
        "volatility": safe_float(p_vol),
        "sharpe": safe_float(p_sharpe),
        "max_drawdown": safe_float(p_drawdown),
        "future_value": safe_float(future_value)
    }
    
    high_correlation_flags = []
    corr_df = returns.corr().fillna(0)
    for i in range(num_assets):
        for j in range(i+1, num_assets):
            if corr_df.iloc[i, j] > 0.80:
                fund1 = df.columns[i]
                fund2 = df.columns[j]
                high_correlation_flags.append(f"High correlation ({corr_df.iloc[i, j]:.2f}) between {fund1} and {fund2}")

    return {
        "weights": weights_dict,
        "metrics": metrics,
        "warning": warning_msg,
        "high_correlation_flags": high_correlation_flags
    }

@app.post("/api/presets")
async def get_preset_portfolios(request: OptimizeRequest):
    df = pd.DataFrame(request.chart_data)
    if 'date' in df.columns:
        df['date'] = pd.to_datetime(df['date'])
        df = df.set_index('date')
        
    if df.empty or len(df.columns) == 0:
        return {"error": "No data provided."}
        
    returns = df.pct_change().dropna()
    if returns.empty:
        return {"error": "Not enough overlapping data points to calculate returns."}
    
    mean_returns = returns.mean() * TRADING_DAYS
    cov_matrix = returns.cov() * TRADING_DAYS
    num_assets = len(df.columns)
    
    def portfolio_return(weights):
        return float(np.dot(mean_returns.values, weights))
        
    def portfolio_volatility(weights):
        var = np.dot(weights.T, np.dot(cov_matrix.values, weights))
        return np.sqrt(max(0, float(var)))
        
    def neg_sharpe_ratio(weights):
        p_ret = portfolio_return(weights)
        p_vol = portfolio_volatility(weights)
        return -(p_ret - RISK_FREE_RATE) / p_vol if p_vol > 0 else 0
        
    def portfolio_max_drawdown(weights):
        port_returns = np.dot(returns.values, weights)
        cumulative = np.cumprod(1 + port_returns)
        running_max = np.maximum.accumulate(cumulative)
        drawdown = np.where(running_max > 0, (cumulative - running_max) / running_max, 0.0)
        return float(abs(np.min(drawdown))) if drawdown.size > 0 else 0.0

    bounds = tuple((0, 0.30) for _ in range(num_assets))
    initial_guess = num_assets * [1. / num_assets,]
    constraints = [
        {'type': 'eq', 'fun': lambda x: np.sum(x) - 1},
        {'type': 'ineq', 'fun': lambda x: 0.25 - np.sum(x**2)}
    ]
    
    import math
    def safe_float(v):
        try:
            val = float(v)
            if math.isnan(val) or math.isinf(val): return 0.0
            return val
        except: return 0.0

    total_investment = sum(request.investments.values()) if request.investments else 0

    def get_metrics_dict(weights):
        p_cagr = portfolio_return(weights)
        p_vol = portfolio_volatility(weights)
        p_sharpe = (p_cagr - RISK_FREE_RATE) / p_vol if p_vol > 0 else 0
        p_drawdown = portfolio_max_drawdown(weights)
        future_value = total_investment * ((1 + p_cagr) ** request.years_invested)
        return {
            "weights": {col: safe_float(w) for col, w in zip(df.columns, weights)},
            "metrics": {
                "cagr": safe_float(p_cagr),
                "volatility": safe_float(p_vol),
                "sharpe": safe_float(p_sharpe),
                "max_drawdown": safe_float(p_drawdown),
                "future_value": safe_float(future_value)
            }
        }

    presets = {}

    # 1. Lowest Risk (Minimize Volatility)
    res_min_risk = minimize(portfolio_volatility, initial_guess, method='SLSQP', bounds=bounds, constraints=constraints)
    if res_min_risk.success:
        presets["lowest_risk"] = get_metrics_dict(res_min_risk.x)

    # 2. Highest Return (Maximize Return -> Minimize -Return)
    res_max_return = minimize(lambda x: -portfolio_return(x), initial_guess, method='SLSQP', bounds=bounds, constraints=constraints)
    if res_max_return.success:
        presets["highest_return"] = get_metrics_dict(res_max_return.x)

    # 3. Highest Sharpe Ratio (Minimize -Sharpe)
    res_max_sharpe = minimize(neg_sharpe_ratio, initial_guess, method='SLSQP', bounds=bounds, constraints=constraints)
    if res_max_sharpe.success:
        presets["highest_sharpe"] = get_metrics_dict(res_max_sharpe.x)

    # 4. Lowest Drawdown (Minimize Max Drawdown)
    res_min_dd = minimize(portfolio_max_drawdown, initial_guess, method='SLSQP', bounds=bounds, constraints=constraints)
    if res_min_dd.success:
        presets["lowest_drawdown"] = get_metrics_dict(res_min_dd.x)

    return {"presets": presets}

@app.post("/api/evaluate")
async def evaluate_portfolio(request: OptimizeRequest):
    df = pd.DataFrame(request.chart_data)
    if 'date' in df.columns:
        df['date'] = pd.to_datetime(df['date'])
        df = df.set_index('date')
        
    if df.empty or len(df.columns) == 0:
        return {"error": "No data provided."}
        
    returns = df.pct_change().dropna()
    if returns.empty:
        return {"error": "Not enough overlapping data points to calculate returns."}
        
    mean_returns = returns.mean() * TRADING_DAYS
    cov_matrix = returns.cov() * TRADING_DAYS
    
    total_investment = sum(request.investments.values()) if request.investments else 0
    if total_investment <= 0:
        return {"error": "Total investment must be greater than zero."}
        
    weights_list = []
    weights_dict = {}
    for col in df.columns:
        weight = request.investments.get(col, 0) / total_investment
        weights_list.append(weight)
        weights_dict[col] = weight
        
    weights_arr = np.array(weights_list)
    
    def portfolio_return(weights):
        return float(np.dot(mean_returns.values, weights))
        
    def portfolio_volatility(weights):
        var = np.dot(weights.T, np.dot(cov_matrix.values, weights))
        return np.sqrt(max(0, float(var)))
        
    def portfolio_max_drawdown(weights):
        port_returns = np.dot(returns.values, weights)
        cumulative = np.cumprod(1 + port_returns)
        running_max = np.maximum.accumulate(cumulative)
        drawdown = np.where(running_max > 0, (cumulative - running_max) / running_max, 0.0)
        return float(abs(np.min(drawdown))) if drawdown.size > 0 else 0.0

    p_cagr = portfolio_return(weights_arr)
    p_vol = portfolio_volatility(weights_arr)
    p_sharpe = (p_cagr - RISK_FREE_RATE) / p_vol if p_vol > 0 else 0
    p_drawdown = portfolio_max_drawdown(weights_arr)
    future_value = total_investment * ((1 + p_cagr) ** request.years_invested)
    
    import math
    def safe_float(v):
        try:
            val = float(v)
            if math.isnan(val) or math.isinf(val): return 0.0
            return val
        except: return 0.0

    return {
        "weights": weights_dict,
        "metrics": {
            "cagr": safe_float(p_cagr),
            "volatility": safe_float(p_vol),
            "sharpe": safe_float(p_sharpe),
            "max_drawdown": safe_float(p_drawdown),
            "future_value": safe_float(future_value)
        }
    }

class SaveAnalysisRequest(BaseModel):
    name: str
    data: Dict[str, Any]

@app.post("/api/save_analysis")
async def save_analysis(request: SaveAnalysisRequest):
    # sanitize filename
    safe_name = "".join([c for c in request.name if c.isalpha() or c.isdigit() or c in ' -_']).rstrip()
    if not safe_name:
        return {"error": "Invalid name provided."}
    
    file_path = os.path.join(DATA_DIR, f"{safe_name}.json")
    try:
        with open(file_path, "w") as f:
            json.dump(request.data, f)
        return {"status": "success", "message": f"Analysis '{safe_name}' saved successfully."}
    except Exception as e:
        return {"error": str(e)}

@app.get("/api/saved_analyses")
async def get_saved_analyses():
    try:
        files = []
        if os.path.exists(DATA_DIR):
            for filename in os.listdir(DATA_DIR):
                if filename.endswith(".json"):
                    files.append(filename[:-5])
        return {"analyses": sorted(files)}
    except Exception as e:
        return {"error": str(e)}

@app.get("/api/load_analysis/{name}")
async def load_analysis(name: str):
    safe_name = "".join([c for c in name if c.isalpha() or c.isdigit() or c in ' -_']).rstrip()
    file_path = os.path.join(DATA_DIR, f"{safe_name}.json")
    if not os.path.exists(file_path):
        return {"error": "Analysis not found."}
        
    try:
        with open(file_path, "r") as f:
            data = json.load(f)
            
        if "correlation_matrix" not in data and "chart_data" in data:
            import pandas as pd
            df = pd.DataFrame(data["chart_data"])
            if "date" in df.columns:
                df["date"] = pd.to_datetime(df["date"])
                df = df.set_index("date")
            returns = df.pct_change().dropna()
            data["correlation_matrix"] = returns.corr().fillna(0).to_dict()
            
        return data
    except Exception as e:
        return {"error": str(e)}
