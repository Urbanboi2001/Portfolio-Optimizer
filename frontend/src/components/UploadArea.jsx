import React, { useCallback, useState, useEffect } from 'react';
import { UploadCloud, FileSpreadsheet, X, FolderOpen, ChevronRight } from 'lucide-react';
import axios from 'axios';

const UploadArea = ({ onUpload, isUploading, onLoadAnalysis }) => {
  const [dragActive, setDragActive] = useState(false);
  const [files, setFiles] = useState([]);
  const [savedAnalyses, setSavedAnalyses] = useState([]);
  const [isLoadingSaved, setIsLoadingSaved] = useState(false);

  useEffect(() => {
    const fetchSavedAnalyses = async () => {
      try {
        const res = await axios.get('http://localhost:8001/api/saved_analyses');
        if (res.data.analyses) {
          setSavedAnalyses(res.data.analyses);
        }
      } catch (err) {
        console.error("Failed to fetch saved analyses", err);
      }
    };
    fetchSavedAnalyses();
  }, []);

  const handleLoadSaved = async (name, e) => {
    e.stopPropagation();
    setIsLoadingSaved(true);
    try {
      const res = await axios.get(`http://localhost:8001/api/load_analysis/${name}`);
      if (res.data.error) {
        alert(res.data.error);
      } else {
        onLoadAnalysis(res.data);
      }
    } catch (err) {
      alert("Failed to load analysis");
    } finally {
      setIsLoadingSaved(false);
    }
  };

  const handleDrag = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  }, []);

  const handleDrop = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const droppedFiles = Array.from(e.dataTransfer.files).filter(
        f => f.name.endsWith('.xlsx') || f.name.endsWith('.xls')
      );
      setFiles(prev => [...prev, ...droppedFiles]);
    }
  }, []);

  const handleChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      const selectedFiles = Array.from(e.target.files).filter(
        f => f.name.endsWith('.xlsx') || f.name.endsWith('.xls')
      );
      setFiles(prev => [...prev, ...selectedFiles]);
    }
  };

  const handleRemove = (index, e) => {
    e.stopPropagation();
    setFiles(prev => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = (e) => {
    e.stopPropagation();
    if (files.length > 0) {
      onUpload(files);
    }
  };

  return (
    <div className="glass-panel animate-fade-in">
      <h2>Upload NAV History</h2>
      <p style={{ color: 'var(--text-secondary)', marginBottom: '1.5rem' }}>
        Attach multiple mutual fund Excel files (.xlsx) to compare them.
      </p>
      
      <div 
        className={`upload-container ${dragActive ? "drag-active" : ""}`}
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
        onClick={() => document.getElementById('file-upload').click()}
      >
        <input 
          id="file-upload" 
          type="file" 
          multiple 
          accept=".xlsx, .xls" 
          onChange={handleChange} 
          style={{ display: 'none' }} 
        />
        <UploadCloud className="upload-icon" />
        <p>Drag and drop Excel files here, or click to browse</p>
        
        {files.length > 0 && (
          <div className="file-list">
            {files.map((file, idx) => (
              <div key={idx} className="file-chip">
                <FileSpreadsheet size={16} />
                <span>{file.name}</span>
                <X 
                  size={16} 
                  style={{ cursor: 'pointer', marginLeft: '0.25rem' }} 
                  onClick={(e) => handleRemove(idx, e)}
                />
              </div>
            ))}
          </div>
        )}
        
        {files.length > 0 && (
          <button 
            className="upload-button" 
            onClick={handleSubmit}
            disabled={isUploading || isLoadingSaved}
          >
            {isUploading ? 'Analyzing...' : 'Analyze Funds'}
          </button>
        )}
      </div>

      {savedAnalyses.length > 0 && (
        <div style={{ marginTop: '2rem' }}>
          <h3>Saved Analyses</h3>
          <div style={{ display: 'grid', gap: '0.5rem', marginTop: '1rem' }}>
            {savedAnalyses.map((name) => (
              <div 
                key={name}
                onClick={(e) => handleLoadSaved(name, e)}
                style={{
                  display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                  padding: '1rem', backgroundColor: 'var(--bg-card)', 
                  border: '1px solid var(--border)', borderRadius: '8px',
                  cursor: 'pointer', transition: 'all 0.2s ease'
                }}
                className="hover-card"
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <FolderOpen size={18} color="var(--primary)" />
                  <span style={{ fontWeight: 500 }}>{name}</span>
                </div>
                <ChevronRight size={18} color="var(--text-secondary)" />
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default UploadArea;
