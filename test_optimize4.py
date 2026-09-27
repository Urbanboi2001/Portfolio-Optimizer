import asyncio
from backend.main import optimize_portfolio, OptimizeRequest
import numpy as np

async def main():
    # generate random prices
    np.random.seed(42)
    returns_A = np.random.normal(0.0005, 0.01, 1000)
    returns_B = np.random.normal(0.0002, 0.015, 1000)
    
    price_A = 100 * np.cumprod(1 + returns_A)
    price_B = 100 * np.cumprod(1 + returns_B)
    
    chart_data = []
    for i in range(1000):
        chart_data.append({
            "date": f"2023-01-01T{i:04d}",
            "FundA": float(price_A[i]),
            "FundB": float(price_B[i])
        })
        
    request = OptimizeRequest(
        chart_data=chart_data,
        investments={"FundA": 10000, "FundB": 10000},
        years_invested=10,
        min_return=0.01,
        max_risk=0.50,
        max_drawdown=0.50,
        min_sharpe=0.0
    )
    try:
        res = await optimize_portfolio(request)
        print("RESULT (random data):", res)
    except Exception as e:
        print("ERROR (random data):", type(e), e)
        import traceback
        traceback.print_exc()

asyncio.run(main())
