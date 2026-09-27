from fastapi.testclient import TestClient
from backend.main import app
import traceback
import math

def main():
    payload = {
        "chart_data": [
            {"date": "2023-01-01", "FundA": 100.0, "FundB": 100.0}
        ],
        "investments": {"FundA": 10000, "FundB": 10000},
        "years_invested": 10,
        "min_return": -1.0,
        "max_risk": 1.0,
        "max_drawdown": 1.0,
        "min_sharpe": -5.0
    }
    
    client = TestClient(app)
    try:
        response = client.post("/api/optimize", json=payload)
        print("STATUS:", response.status_code)
        print("BODY:", response.text)
    except Exception as e:
        print("EXCEPTION:", type(e), e)

main()
