import React from 'react';

const CorrelationMatrix = ({ correlationMatrix }) => {
  if (!correlationMatrix || Object.keys(correlationMatrix).length === 0) {
    return null;
  }

  const funds = Object.keys(correlationMatrix);

  // Helper to determine cell background color based on correlation value
  // 1 is dark green, 0 is white, -1 is dark red
  const getCellColor = (value) => {
    if (value === null || value === undefined) return 'transparent';
    
    // Convert to number and clamp between -1 and 1
    const num = Math.max(-1, Math.min(1, Number(value)));
    
    if (num > 0) {
      // Green
      const alpha = num * 0.8;
      return `rgba(16, 185, 129, ${alpha})`;
    } else {
      // Red
      const alpha = Math.abs(num) * 0.8;
      return `rgba(239, 68, 68, ${alpha})`;
    }
  };

  const getTextColor = (value) => {
    const num = Math.max(-1, Math.min(1, Number(value)));
    // Use white text for strong correlations (darker backgrounds)
    return Math.abs(num) > 0.5 ? '#ffffff' : 'var(--text-primary)';
  };

  return (
    <div className="glass-panel" style={{ marginTop: '2rem', overflowX: 'auto' }}>
      <div style={{ marginBottom: '1.5rem' }}>
        <h2 style={{ marginBottom: '0.5rem' }}>Correlation Matrix</h2>
        <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem' }}>
          This heatmap shows how closely the mutual funds move together. 
          A correlation near <strong>1.0</strong> means they move in the same direction, 
          near <strong>0</strong> means they are independent, and near <strong>-1.0</strong> means they move in opposite directions.
        </p>
      </div>

      <div className="correlation-wrapper">
        <table className="correlation-table">
          <thead>
            <tr>
              <th className="correlation-header corner"></th>
              {funds.map(fund => (
                <th key={fund} className="correlation-header" title={fund}>
                  {fund.length > 20 ? fund.substring(0, 17) + '...' : fund}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {funds.map((rowFund, i) => (
              <tr key={rowFund}>
                <th className="correlation-row-header" title={rowFund}>
                  {rowFund.length > 30 ? rowFund.substring(0, 27) + '...' : rowFund}
                </th>
                {funds.map((colFund, j) => {
                  const value = correlationMatrix[rowFund][colFund];
                  const isDiagonal = i === j;
                  
                  return (
                    <td 
                      key={colFund} 
                      className="correlation-cell"
                      style={{ 
                        backgroundColor: getCellColor(value),
                        color: getTextColor(value),
                        fontWeight: isDiagonal ? 'bold' : 'normal'
                      }}
                      title={`${rowFund} vs ${colFund}: ${value?.toFixed(3)}`}
                    >
                      {value?.toFixed(2)}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default CorrelationMatrix;
