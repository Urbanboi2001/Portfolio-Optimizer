import asyncio
from backend.main import optimize_portfolio, OptimizeRequest
import numpy as np
import pandas as pd

async def main():
    np.random.seed(42)
    # create realistic daily returns for 2 funds over 3 years
    returns_A = np.random.normal(0.0002, 0.015, 750)
    returns_B = np.random.normal(0.0003, 0.020, 750)
    
    dates = pd.date_range("2020-01-01", periods=750, freq="B")
    
    price_A = 100 * np.cumprod(1 + returns_A)
    price_B = 100 * np.cumprod(1 + returns_B)
    
    chart_data = []
    for i in range(750):
        chart_data.append({
            "date": dates[i].strftime("%Y-%m-%d"),
            "FundA": float(price_A[i]),
            "FundB": float(price_B[i])
        })
        
    request = OptimizeRequest(
        chart_data=chart_data,
        investments={"FundA": 10000, "FundB": 10000},
        years_invested=10,
        min_return=-1.0,
        max_risk=1.0,
        max_drawdown=1.0,
        min_sharpe=2.0  # Impossible sharpe!
    )
    
    res = await optimize_portfolio(request)
    print("RESULT (strict sharpe 2.0):", res)

asyncio.run(main())
