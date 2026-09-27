import asyncio
from backend.main import optimize_portfolio, OptimizeRequest

async def main():
    request = OptimizeRequest(
        chart_data=[
            {"date": "2023-01-01", "FundA": 100.0, "FundB": 100.0}
        ],
        investments={"FundA": 10000, "FundB": 10000},
        years_invested=10,
        min_return=-1.0,
        max_risk=1.0,
        max_drawdown=1.0,
        min_sharpe=-5.0
    )
    
    try:
        res = await optimize_portfolio(request)
        print("RESULT (1 row):", res)
    except Exception as e:
        print("EXCEPTION:", type(e), e)

asyncio.run(main())
