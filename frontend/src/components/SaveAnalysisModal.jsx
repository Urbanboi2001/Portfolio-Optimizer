import React, { useState } from 'react';

const SaveAnalysisModal = ({ isOpen, onClose, onSave, isSaving }) => {
  const [name, setName] = useState('');

  if (!isOpen) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    if (name.trim()) {
      onSave(name.trim());
    }
  };

  return (
    <div style={{
      position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
      backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex',
      justifyContent: 'center', alignItems: 'center', zIndex: 1000
    }}>
      <div className="glass-panel" style={{ width: '400px', maxWidth: '90%' }}>
        <h2 style={{ marginBottom: '1rem' }}>Save Analysis</h2>
        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: '1.5rem' }}>
            <label style={{ display: 'block', marginBottom: '0.5rem', color: 'var(--text-secondary)' }}>
              Analysis Name
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. My Tech Portfolio"
              style={{
                width: '100%', padding: '0.75rem', borderRadius: '4px',
                border: '1px solid var(--border)', backgroundColor: 'var(--bg-card)',
                color: 'var(--text-primary)'
              }}
              autoFocus
              disabled={isSaving}
            />
          </div>
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem' }}>
            <button 
              type="button" 
              className="upload-button" 
              style={{ marginTop: 0, backgroundColor: 'transparent', border: '1px solid var(--border)' }}
              onClick={onClose}
              disabled={isSaving}
            >
              Cancel
            </button>
            <button 
              type="submit" 
              className="upload-button" 
              style={{ marginTop: 0 }}
              disabled={!name.trim() || isSaving}
            >
              {isSaving ? 'Saving...' : 'Save'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default SaveAnalysisModal;
