from fastapi.testclient import TestClient
from backend.main import app
import traceback

def main():
    payload = {
        "chart_data": [
            {"date": "2023-01-01", "FundA": 100.0},
            {"date": "2023-01-02", "FundA": 101.0},
            {"date": "2023-01-03", "FundA": 102.0}
        ],
        "investments": {"FundA": 10000},
        "years_invested": 10,
        "min_return": 0.00,
        "max_risk": 0.50,
        "max_drawdown": 0.50,
        "min_sharpe": 0.0
    }
    
    client = TestClient(app)
    try:
        response = client.post("/api/optimize", json=payload)
        print("STATUS:", response.status_code)
        print("BODY:", response.text)
    except Exception as e:
        print("EXCEPTION:", type(e), e)
        traceback.print_exc()

main()
