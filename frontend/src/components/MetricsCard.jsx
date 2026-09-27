import React from 'react';

const formatPercent = (value) => {
  if (value === null || value === undefined) return '-';
  return (value * 100).toFixed(2) + '%';
};

const formatNumber = (value) => {
  if (value === null || value === undefined) return '-';
  return value.toFixed(2);
};

const MetricsCard = ({ metrics }) => {
  if (!metrics || metrics.length === 0) return null;

  return (
    <div className="glass-panel animate-fade-in" style={{ animationDelay: '0.1s' }}>
      <h2>Performance Metrics</h2>
      <div className="metrics-table-container">
        <table className="metrics-table">
          <thead>
            <tr>
              <th>Fund Name</th>
              <th>CAGR</th>
              <th>Volatility (Ann.)</th>
              <th>Sharpe Ratio</th>
              <th>Sortino Ratio</th>
              <th>Max Drawdown</th>
            </tr>
          </thead>
          <tbody>
            {metrics.map((fund, idx) => (
              <tr key={idx}>
                <td>{fund.name}</td>
                <td className={fund.cagr >= 0 ? 'positive' : 'negative'}>
                  {formatPercent(fund.cagr)}
                </td>
                <td>{formatPercent(fund.volatility)}</td>
                <td className={fund.sharpe >= 1 ? 'positive' : ''}>
                  {formatNumber(fund.sharpe)}
                </td>
                <td className={fund.sortino >= 1 ? 'positive' : ''}>
                  {formatNumber(fund.sortino)}
                </td>
                <td className="negative">
                  {formatPercent(fund.max_drawdown)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default MetricsCard;
