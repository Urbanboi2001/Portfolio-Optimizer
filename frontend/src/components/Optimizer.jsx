import React, { useState, useEffect } from 'react';
import axios from 'axios';

const formatPercent = (value) => {
  if (value === null || value === undefined) return '-';
  return (value * 100).toFixed(2) + '%';
};

const formatNumber = (value) => {
  if (value === null || value === undefined) return '-';
  return value.toFixed(2);
};

const formatCurrency = (value) => {
  if (value === null || value === undefined) return '-';
  return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(value);
};

const Optimizer = ({ chartData, metrics, savedInvestments, onInvestmentsChange }) => {
  const [fundNames, setFundNames] = useState([]);
  const [localInvestments, setLocalInvestments] = useState(savedInvestments || {});
  const [yearsInvested, setYearsInvested] = useState(10);

  useEffect(() => {
    if (savedInvestments) {
      setLocalInvestments(savedInvestments);
    }
  }, [savedInvestments]);
  
  const [minReturn, setMinReturn] = useState(0.00);
  const [maxRisk, setMaxRisk] = useState(0.50);
  const [maxDrawdown, setMaxDrawdown] = useState(0.50);
  const [minSharpe, setMinSharpe] = useState(0.0);
  
  const [isOptimizing, setIsOptimizing] = useState(false);
  const [results, setResults] = useState(null);
  const [error, setError] = useState(null);
  const [warning, setWarning] = useState(null);

  useEffect(() => {
    if (chartData && chartData.length > 0) {
      const names = Object.keys(chartData[0]).filter(key => key !== 'date');
      setFundNames(names);
      
      if (!savedInvestments) {
        const initialInvestments = {};
        names.forEach(name => {
          initialInvestments[name] = 10000; // default 10k each
        });
        if (onInvestmentsChange) onInvestmentsChange(initialInvestments);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [chartData]);

  const handleInvestmentChange = (name, value) => {
    setLocalInvestments(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleInvestmentBlur = (name) => {
    if (onInvestmentsChange) {
      onInvestmentsChange({
        ...(savedInvestments || {}),
        [name]: parseFloat(localInvestments[name]) || 0
      });
    }
  };

  const handleOptimize = async () => {
    setIsOptimizing(true);
    setError(null);
    setWarning(null);
    setResults(null);
    
    try {
      const response = await axios.post('http://localhost:8001/api/optimize', {
        chart_data: chartData,
        investments: localInvestments,
        years_invested: yearsInvested,
        min_return: minReturn,
        max_risk: maxRisk,
        max_drawdown: maxDrawdown,
        min_sharpe: minSharpe
      });
      
      if (response.data.error) {
        setError(response.data.error);
      } else {
        if (response.data.warning) {
          setWarning(response.data.warning);
        }
        setResults(response.data);
      }
    } catch (err) {
      setError("An error occurred during optimization.");
    } finally {
      setIsOptimizing(false);
    }
  };

  const handleApplyPreset = async (presetKey) => {
    setIsOptimizing(true);
    setError(null);
    setWarning(null);
    setResults(null);
    
    try {
      const response = await axios.post('http://localhost:8001/api/presets', {
        chart_data: chartData,
        investments: localInvestments,
        years_invested: yearsInvested,
        min_return: -1,
        max_risk: 1,
        max_drawdown: 1,
        min_sharpe: -5
      });
      
      if (response.data.error) {
        setError(response.data.error);
      } else if (response.data.presets && response.data.presets[presetKey]) {
        setResults({
          weights: response.data.presets[presetKey].weights,
          metrics: response.data.presets[presetKey].metrics
        });
      } else {
        setError("Preset not found.");
      }
    } catch (err) {
      setError("An error occurred while loading the preset.");
    } finally {
      setIsOptimizing(false);
    }
  };

  const handleEvaluate = async () => {
    setIsOptimizing(true);
    setError(null);
    setWarning(null);
    setResults(null);
    
    try {
      const response = await axios.post('http://localhost:8001/api/evaluate', {
        chart_data: chartData,
        investments: localInvestments,
        years_invested: yearsInvested,
        min_return: -1,
        max_risk: 1,
        max_drawdown: 1,
        min_sharpe: -5
      });
      
      if (response.data.error) {
        setError(response.data.error);
      } else {
        setResults({
          weights: response.data.weights,
          metrics: response.data.metrics
        });
      }
    } catch (err) {
      setError("An error occurred while evaluating the portfolio.");
    } finally {
      setIsOptimizing(false);
    }
  };

  if (!chartData || fundNames.length === 0) return null;

  return (
    <div className="glass-panel animate-fade-in" style={{ animationDelay: '0.4s', marginTop: '2rem' }}>
      <h2>Portfolio Optimizer</h2>
      
      <div className="optimizer-grid">
        {/* Left Column: Inputs */}
        <div className="optimizer-inputs">
          <h3>Quick Goals</h3>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem', marginBottom: '1.5rem', marginTop: '1rem' }}>
            <button 
              style={{ padding: '0.5rem', background: 'rgba(20, 184, 166, 0.1)', border: '1px solid rgba(20, 184, 166, 0.3)', color: 'var(--primary)', borderRadius: '4px', cursor: 'pointer', fontSize: '0.9rem', transition: 'all 0.2s' }}
              onClick={() => handleApplyPreset('lowest_risk')}
              disabled={isOptimizing}
            >
              Lowest Risk
            </button>
            <button 
              style={{ padding: '0.5rem', background: 'rgba(20, 184, 166, 0.1)', border: '1px solid rgba(20, 184, 166, 0.3)', color: 'var(--primary)', borderRadius: '4px', cursor: 'pointer', fontSize: '0.9rem', transition: 'all 0.2s' }}
              onClick={() => handleApplyPreset('highest_return')}
              disabled={isOptimizing}
            >
              Highest Return
            </button>
            <button 
              style={{ padding: '0.5rem', background: 'rgba(20, 184, 166, 0.1)', border: '1px solid rgba(20, 184, 166, 0.3)', color: 'var(--primary)', borderRadius: '4px', cursor: 'pointer', fontSize: '0.9rem', transition: 'all 0.2s' }}
              onClick={() => handleApplyPreset('highest_sharpe')}
              disabled={isOptimizing}
            >
              Max Sharpe Ratio
            </button>
            <button 
              style={{ padding: '0.5rem', background: 'rgba(20, 184, 166, 0.1)', border: '1px solid rgba(20, 184, 166, 0.3)', color: 'var(--primary)', borderRadius: '4px', cursor: 'pointer', fontSize: '0.9rem', transition: 'all 0.2s' }}
              onClick={() => handleApplyPreset('lowest_drawdown')}
              disabled={isOptimizing}
            >
              Lowest Drawdown
            </button>
          </div>

          <h3>Current Investments</h3>
          <div className="investment-inputs">
            {fundNames.map(name => (
              <div key={name} className="input-group">
                <label>{name}</label>
                <div className="currency-input-wrapper">
                  <span className="currency-symbol">₹</span>
                  <input 
                    type="number" 
                    value={localInvestments[name] !== undefined ? localInvestments[name] : ''} 
                    onChange={(e) => handleInvestmentChange(name, e.target.value)}
                    onBlur={() => handleInvestmentBlur(name)}
                    min="0"
                  />
                </div>
              </div>
            ))}
          </div>
          
          <button 
            style={{ marginTop: '1rem', padding: '0.6rem', background: 'transparent', border: '1px dashed var(--accent-primary)', color: 'var(--accent-primary)', borderRadius: '6px', cursor: 'pointer', fontSize: '0.95rem', width: '100%', fontWeight: '500', transition: 'all 0.2s' }}
            onClick={handleEvaluate}
            disabled={isOptimizing}
          >
            {isOptimizing ? 'Evaluating...' : 'Evaluate Current Portfolio'}
          </button>

          <h3 style={{ marginTop: '1.5rem' }}>Investment Horizon</h3>
          <div className="slider-group">
            <div className="slider-header">
              <label>Years Invested</label>
              <span>{yearsInvested} Years</span>
            </div>
            <input 
              type="range" 
              min="1" max="50" step="1" 
              value={yearsInvested} 
              onChange={(e) => setYearsInvested(parseInt(e.target.value) || 0)}
            />
          </div>

          <h3 style={{ marginTop: '1.5rem' }}>Optimization Constraints</h3>
          <div className="slider-group">
            <div className="slider-header">
              <label>Target Return (Min)</label>
              <span>{formatPercent(minReturn)}</span>
            </div>
            <input 
              type="range" 
              min="-0.2" max="0.5" step="0.01" 
              value={minReturn} 
              onChange={(e) => setMinReturn(parseFloat(e.target.value))} 
            />
          </div>

          <div className="slider-group">
            <div className="slider-header">
              <label>Max Volatility / Risk</label>
              <span>{formatPercent(maxRisk)}</span>
            </div>
            <input 
              type="range" 
              min="0.01" max="0.5" step="0.01" 
              value={maxRisk} 
              onChange={(e) => setMaxRisk(parseFloat(e.target.value))} 
            />
          </div>
          
          <div className="slider-group">
            <div className="slider-header">
              <label>Max Drawdown</label>
              <span>{formatPercent(maxDrawdown)}</span>
            </div>
            <input 
              type="range" 
              min="0.05" max="0.8" step="0.01" 
              value={maxDrawdown} 
              onChange={(e) => setMaxDrawdown(parseFloat(e.target.value))} 
            />
          </div>

          <div className="slider-group">
            <div className="slider-header">
              <label>Min Sharpe Ratio</label>
              <span>{formatNumber(minSharpe)}</span>
            </div>
            <input 
              type="range" 
              min="-1.0" max="3.0" step="0.1" 
              value={minSharpe} 
              onChange={(e) => setMinSharpe(parseFloat(e.target.value))} 
            />
          </div>

          <button 
            className="upload-button" 
            onClick={handleOptimize} 
            disabled={isOptimizing}
            style={{ width: '100%', marginTop: '1.5rem' }}
          >
            {isOptimizing ? 'Optimizing...' : 'Run Optimization'}
          </button>
          
          {error && <div style={{ color: 'var(--negative)', marginTop: '1rem', fontSize: '0.9rem' }}>{error}</div>}
        </div>

        {/* Right Column: Results */}
        <div className="optimizer-results">
          <h3>Optimization Results</h3>
          
          {!results && !isOptimizing && (
            <div className="empty-results">
              <p style={{ color: 'var(--text-secondary)' }}>Set your constraints and click Run Optimization to find the optimal weights for your portfolio.</p>
            </div>
          )}
          
          {isOptimizing && (
            <div className="loader-container" style={{ minHeight: '200px' }}>
              <div className="spinner"></div>
            </div>
          )}

          {warning && (
            <div className="glass-panel" style={{ borderColor: 'var(--warning)', marginBottom: '1.5rem', padding: '1rem' }}>
              <h4 style={{ color: 'var(--warning)', margin: '0 0 0.5rem 0' }}>Warning</h4>
              <p style={{ margin: 0, fontSize: '0.9rem' }}>{warning}</p>
            </div>
          )}

          {results && (
            <div className="results-content animate-fade-in">
              {results.high_correlation_flags && results.high_correlation_flags.length > 0 && (
                <div className="glass-panel" style={{ borderColor: '#f59e0b', marginBottom: '1.5rem', padding: '1rem', background: 'rgba(245, 158, 11, 0.05)' }}>
                  <h4 style={{ color: '#f59e0b', margin: '0 0 0.5rem 0', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path><line x1="12" y1="9" x2="12" y2="13"></line><line x1="12" y1="17" x2="12.01" y2="17"></line></svg>
                    High Correlation Warnings
                  </h4>
                  <ul style={{ margin: 0, paddingLeft: '1.5rem', fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
                    {results.high_correlation_flags.map((flag, idx) => (
                      <li key={idx}>{flag}</li>
                    ))}
                  </ul>
                </div>
              )}
              <div className="metrics-grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))' }}>
                <div className="metric-card" style={{ background: 'rgba(20, 184, 166, 0.1)', borderColor: 'rgba(20, 184, 166, 0.2)' }}>
                  <div className="metric-title">Expected Future Value</div>
                  <div className="metric-value positive" style={{ fontSize: '1.8rem', color: '#14b8a6' }}>
                    {formatCurrency(results.metrics.future_value)}
                  </div>
                  <div className="metric-label" style={{ marginTop: '0.5rem' }}>
                    After {yearsInvested} years
                  </div>
                </div>
              </div>
              
              <div className="results-split" style={{ display: 'flex', gap: '2rem', marginTop: '1.5rem', flexWrap: 'wrap' }}>
                <div style={{ flex: '1 1 200px' }}>
                  <h4 style={{ marginBottom: '1rem', color: 'var(--text-primary)' }}>Optimal Weights</h4>
                  <ul className="weights-list" style={{ listStyle: 'none', padding: 0, margin: 0 }}>
                    {Object.entries(results.weights).map(([fund, weight]) => (
                      <li key={fund} style={{ display: 'flex', justifyContent: 'space-between', padding: '0.5rem 0', borderBottom: '1px solid rgba(0,0,0,0.05)' }}>
                        <span style={{ color: 'var(--text-secondary)' }}>{fund}</span>
                        <span className="positive">{formatPercent(weight)}</span>
                      </li>
                    ))}
                  </ul>
                </div>
                
                <div style={{ flex: '1 1 200px' }}>
                  <h4 style={{ marginBottom: '1rem', color: 'var(--text-primary)' }}>Expected Metrics</h4>
                  <ul className="weights-list" style={{ listStyle: 'none', padding: 0, margin: 0 }}>
                    <li style={{ display: 'flex', justifyContent: 'space-between', padding: '0.5rem 0', borderBottom: '1px solid rgba(0,0,0,0.05)' }}>
                      <span style={{ color: 'var(--text-secondary)' }}>CAGR</span>
                      <span className="positive">{formatPercent(results.metrics.cagr)}</span>
                    </li>
                    <li style={{ display: 'flex', justifyContent: 'space-between', padding: '0.5rem 0', borderBottom: '1px solid rgba(0,0,0,0.05)' }}>
                      <span style={{ color: 'var(--text-secondary)' }}>Volatility</span>
                      <span>{formatPercent(results.metrics.volatility)}</span>
                    </li>
                    <li style={{ display: 'flex', justifyContent: 'space-between', padding: '0.5rem 0', borderBottom: '1px solid rgba(0,0,0,0.05)' }}>
                      <span style={{ color: 'var(--text-secondary)' }}>Max Drawdown</span>
                      <span className="negative">{formatPercent(results.metrics.max_drawdown)}</span>
                    </li>
                    <li style={{ display: 'flex', justifyContent: 'space-between', padding: '0.5rem 0', borderBottom: '1px solid rgba(0,0,0,0.05)' }}>
                      <span style={{ color: 'var(--text-secondary)' }}>Sharpe Ratio</span>
                      <span className="positive">{formatNumber(results.metrics.sharpe)}</span>
                    </li>
                  </ul>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Optimizer;
