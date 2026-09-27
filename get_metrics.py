import pandas as pd
from backend.main import calculate_metrics
import glob
import os

print('| Fund Name | CAGR | Volatility | Sharpe Ratio | Sortino Ratio | Max Drawdown |')
print('|---|---|---|---|---|---|')

for file in glob.glob('*.xlsx'):
    try:
        df_header = pd.read_excel(file, nrows=5, header=None)
        fund_name = str(df_header.iloc[3, 0]).strip()
        df = pd.read_excel(file, header=4)
        df = df[['Date', 'Net Asset Value']].dropna()
        df['Date'] = pd.to_datetime(df['Date'], dayfirst=True)
        df = df.sort_values('Date')
        df['Net Asset Value'] = pd.to_numeric(df['Net Asset Value'], errors='coerce').dropna()
        df = df.set_index('Date')
        metrics = calculate_metrics(df['Net Asset Value'])
        if metrics:
            cagr = metrics['cagr'] * 100
            vol = metrics['volatility'] * 100
            sharpe = metrics['sharpe']
            sortino = metrics['sortino']
            dd = metrics['max_drawdown'] * 100
            print(f"| {fund_name} | {cagr:.2f}% | {vol:.2f}% | {sharpe:.2f} | {sortino:.2f} | {dd:.2f}% |")
    except Exception as e:
        print(f"Error processing {file}: {e}")
