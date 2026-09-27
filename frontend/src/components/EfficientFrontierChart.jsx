import React from 'react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  ScatterChart,
  Scatter
} from 'recharts';

const EfficientFrontierChart = ({ chartData, efficientFrontier, metrics }) => {
  if (!chartData || chartData.length === 0) return null;

  // Formatting efficient frontier data
  const frontierData = [];
  if (efficientFrontier && efficientFrontier.volatility) {
    for (let i = 0; i < efficientFrontier.volatility.length; i++) {
      frontierData.push({
        x: efficientFrontier.volatility[i] * 100,
        y: efficientFrontier.return[i] * 100
      });
    }
  }

  // Formatting individual funds for scatter plot
  const fundsData = metrics ? metrics.map(m => ({
    name: m.name,
    x: m.volatility * 100,
    y: m.cagr * 100
  })) : [];

  // Get dynamic colors
  const colors = [
    '#3b82f6', '#8b5cf6', '#10b981', '#f59e0b', '#ef4444', 
    '#06b6d4', '#84cc16', '#f97316', '#ec4899', '#14b8a6', 
    '#6366f1', '#d946ef', '#eab308', '#f43f5e', '#22c55e', 
    '#0ea5e9', '#a855f7'
  ];
  const fundNames = Object.keys(chartData[0]).filter(key => key !== 'date');

  return (
    <div className="charts-container">
      <div className="glass-panel animate-fade-in" style={{ animationDelay: '0.2s' }}>
        <h2>NAV Growth (Normalized to 100)</h2>
        <div className="chart-wrapper">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,0,0,0.1)" />
              <XAxis 
                dataKey="date" 
                stroke="#94a3b8" 
                tick={{fill: '#94a3b8'}}
                minTickGap={50}
                label={{ value: 'Date', position: 'insideBottomRight', offset: -10, fill: '#94a3b8' }}
              />
              <YAxis 
                stroke="#94a3b8" 
                tick={{fill: '#94a3b8'}}
                domain={['auto', 'auto']} 
                label={{ value: 'NAV (Normalized)', angle: -90, position: 'insideLeft', style: {textAnchor: 'middle'}, fill: '#94a3b8' }}
              />
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: 'rgba(15, 23, 42, 0.9)', 
                  border: '1px solid rgba(0,0,0,0.1)',
                  borderRadius: '0.5rem',
                  color: '#f8fafc'
                }} 
              />
              <Legend wrapperStyle={{ paddingTop: '1rem' }} />
              {fundNames.map((name, idx) => (
                <Line
                  key={name}
                  type="monotone"
                  dataKey={name}
                  stroke={colors[idx % colors.length]}
                  strokeWidth={2}
                  dot={false}
                  activeDot={{ r: 8 }}
                />
              ))}
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {frontierData.length > 0 && (
        <div className="glass-panel animate-fade-in" style={{ animationDelay: '0.3s' }}>
          <h2>Efficient Frontier (Risk vs Return)</h2>
          <div className="chart-wrapper">
            <ResponsiveContainer width="100%" height="100%">
              <ScatterChart margin={{ top: 20, right: 20, bottom: 20, left: 20 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,0,0,0.1)" />
                <XAxis 
                  type="number" 
                  dataKey="x" 
                  name="Volatility (Risk)" 
                  unit="%" 
                  stroke="#94a3b8" 
                  tick={{fill: '#94a3b8'}}
                  label={{ value: 'Volatility (Risk)', position: 'insideBottomRight', offset: -10, fill: '#94a3b8' }}
                />
                <YAxis 
                  type="number" 
                  dataKey="y" 
                  name="Return" 
                  unit="%" 
                  stroke="#94a3b8" 
                  tick={{fill: '#94a3b8'}}
                  label={{ value: 'Return', angle: -90, position: 'insideLeft', style: {textAnchor: 'middle'}, fill: '#94a3b8' }}
                />
                <Tooltip 
                  cursor={{ strokeDasharray: '3 3' }}
                  contentStyle={{ 
                    backgroundColor: 'rgba(15, 23, 42, 0.9)', 
                    border: '1px solid rgba(0,0,0,0.1)',
                    borderRadius: '0.5rem',
                    color: '#f8fafc'
                  }}
                  formatter={(value, name) => [`${value.toFixed(2)}%`, name]}
                />
                <Legend wrapperStyle={{ paddingTop: '1rem' }} />
                
                <Scatter name="Efficient Frontier" data={frontierData} fill="#8b5cf6" line shape="circle" legendType="line" />
                
                {fundsData.map((fund, idx) => (
                  <Scatter 
                    key={fund.name} 
                    name={fund.name} 
                    data={[fund]} 
                    fill={colors[idx % colors.length]} 
                    shape="star"
                    legendType="star"
                  />
                ))}
              </ScatterChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}
    </div>
  );
};

export default EfficientFrontierChart;
