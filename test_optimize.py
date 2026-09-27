import asyncio
from backend.main import optimize_portfolio, OptimizeRequest

async def main():
    request = OptimizeRequest(
        chart_data=[
            {"date": "2023-01-01", "FundA": 100.0, "FundB": 100.0},
            {"date": "2023-01-02", "FundA": 101.0, "FundB": 99.0},
            {"date": "2023-01-03", "FundA": 102.0, "FundB": 98.0},
            {"date": "2023-01-04", "FundA": 103.0, "FundB": 105.0},
            {"date": "2023-01-05", "FundA": 105.0, "FundB": 102.0},
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
        print("RESULT:", res)
    except Exception as e:
        print("ERROR:", e)
        import traceback
        traceback.print_exc()

asyncio.run(main())
