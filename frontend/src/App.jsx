import React, { useState } from 'react';
import axios from 'axios';
import UploadArea from './components/UploadArea';
import MetricsCard from './components/MetricsCard';
import EfficientFrontierChart from './components/EfficientFrontierChart';
import html2pdf from 'html2pdf.js';
import Optimizer from './components/Optimizer';
import SaveAnalysisModal from './components/SaveAnalysisModal';
import CorrelationMatrix from './components/CorrelationMatrix';

function App() {
  const [isUploading, setIsUploading] = useState(false);
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);
  const [isSaveModalOpen, setIsSaveModalOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);
  const [investments, setInvestments] = useState(null);

  const handleLoadAnalysis = (loadedData) => {
    setData(loadedData);
    if (loadedData.saved_investments) {
      setInvestments(loadedData.saved_investments);
    } else {
      setInvestments(null);
    }
  };

  const handleDownloadPDF = () => {
    const element = document.getElementById('analysis-content');
    if (element) {
      setIsDownloading(true);
      const opt = {
        margin: 0.5,
        filename: 'portfolio-analysis.pdf',
        image: { type: 'jpeg', quality: 1.0 },
        html2canvas: { 
          scale: 2, 
          useCORS: true, 
          logging: false,
          backgroundColor: '#f8fafc',
          windowWidth: element.scrollWidth
        },
        jsPDF: { unit: 'in', format: 'a3', orientation: 'landscape' },
        pagebreak: { mode: 'avoid-all' }
      };
      html2pdf().set(opt).from(element).save().then(() => {
        setIsDownloading(false);
      }).catch(err => {
        console.error("PDF generation error:", err);
        setIsDownloading(false);
      });
    }
  };

  const handleSaveAnalysis = async (name) => {
    setIsSaving(true);
    try {
      const response = await axios.post('http://localhost:8001/api/save_analysis', {
        name,
        data: {
          ...data,
          saved_investments: investments
        }
      });
      if (response.data.error) {
        alert(response.data.error);
      } else {
        alert(response.data.message);
        setIsSaveModalOpen(false);
      }
    } catch (err) {
      console.error(err);
      alert('Failed to save analysis');
    } finally {
      setIsSaving(false);
    }
  };

  const handleUpload = async (files) => {
    setIsUploading(true);
    setError(null);
    setData(null);
    setInvestments(null);

    const formData = new FormData();
    files.forEach(file => {
      formData.append('files', file);
    });

    try {
      const response = await axios.post('http://localhost:8001/api/analyze', formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });
      
      if (response.data.error) {
        setError(response.data.error);
      } else {
        setData(response.data);
      }
    } catch (err) {
      console.error(err);
      setError('An error occurred while analyzing the files. Please ensure the backend is running on port 8000 and the files are valid.');
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <>
      <header className="animate-fade-in">
        <h1>Antigravity Wealth</h1>
        <p className="subtitle">Premium Mutual Fund Portfolio Tracker & Optimizer</p>
      </header>
      
      <main>
        {!data && (
          <UploadArea 
            onUpload={handleUpload} 
            isUploading={isUploading} 
            onLoadAnalysis={handleLoadAnalysis} 
          />
        )}
        
        {isUploading && (
          <div className="loader-container">
            <div className="spinner"></div>
            <p style={{ color: 'var(--text-secondary)' }}>Analyzing your portfolio and running MPT optimizations...</p>
          </div>
        )}

        {error && (
          <div className="glass-panel" style={{ borderColor: 'var(--negative)', marginTop: '2rem' }}>
            <h3 style={{ color: 'var(--negative)' }}>Error</h3>
            <p>{error}</p>
            <button 
              className="upload-button" 
              style={{ marginTop: '1rem' }}
              onClick={() => setError(null)}
            >
              Try Again
            </button>
          </div>
        )}

        {data && !isUploading && (
          <>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
              <h2>Analysis Results</h2>
              <div style={{ display: 'flex', gap: '1rem' }}>
                <button 
                  className="upload-button" 
                  style={{ marginTop: 0, backgroundColor: 'transparent', border: '1px solid var(--primary)', color: 'var(--primary)' }} 
                  onClick={handleDownloadPDF}
                  disabled={isDownloading}
                >
                  {isDownloading ? 'Generating...' : 'Download PDF'}
                </button>
                <button 
                  className="upload-button" 
                  style={{ marginTop: 0, backgroundColor: 'transparent', border: '1px solid var(--primary)', color: 'var(--primary)' }} 
                  onClick={() => setIsSaveModalOpen(true)}
                >
                  Save Analysis
                </button>
                <button className="upload-button" style={{ marginTop: 0 }} onClick={() => {
                  setData(null);
                  setInvestments(null);
                }}>
                  New Analysis
                </button>
              </div>
            </div>
            
            <div id="analysis-content" style={{ padding: '1rem', background: 'var(--bg-default)', borderRadius: '12px' }}>
              <MetricsCard metrics={data.metrics} />
              <EfficientFrontierChart 
                chartData={data.chart_data} 
                efficientFrontier={data.efficient_frontier}
                metrics={data.metrics}
              />
              <CorrelationMatrix correlationMatrix={data.correlation_matrix} />
              <Optimizer 
                chartData={data.chart_data} 
                metrics={data.metrics} 
                savedInvestments={investments}
                onInvestmentsChange={setInvestments}
              />
            </div>
          </>
        )}
      </main>
      <SaveAnalysisModal 
        isOpen={isSaveModalOpen} 
        onClose={() => setIsSaveModalOpen(false)} 
        onSave={handleSaveAnalysis} 
        isSaving={isSaving} 
      />
    </>
  );
}

export default App;
