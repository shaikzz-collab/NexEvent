import React, { useRef, useState } from 'react';
import { X, Cloud, ShieldAlert, Download, Upload, Check, Copy, HelpCircle, Server, RefreshCw } from 'lucide-react';
import { isRealFirebase, isMemoryFallbackActive } from '../dbService';

export default function DbStatusModal({ isOpen, onClose }) {
  const fileInputRef = useRef(null);
  const [copiedText, setCopiedText] = useState('');
  const [importStatus, setImportStatus] = useState({ type: '', message: '' });

  if (!isOpen) return null;

  // Handle local database export (Backup)
  const handleExport = () => {
    try {
      const dataStr = localStorage.getItem('nexevent_sandbox_db');
      if (!dataStr) {
        alert("⚠️ No local sandbox data to export.");
        return;
      }
      
      const blob = new Blob([dataStr], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `nexevent_sandbox_backup_${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch (err) {
      alert(`❌ Export failed: ${err.message}`);
    }
  };

  // Handle local database import (Restore)
  const handleImport = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const parsed = JSON.parse(event.target.result);
        
        // Simple schema validation to verify it's a valid NexEvent DB
        if (!parsed.version || !parsed.users || !parsed.events) {
          setImportStatus({
            type: 'error',
            message: '❌ Invalid backup file format. Must contain version, users, and events.'
          });
          return;
        }

        localStorage.setItem('nexevent_sandbox_db', JSON.stringify(parsed));
        setImportStatus({
          type: 'success',
          message: '🟢 Database restored successfully! Reloading portal...'
        });
        
        setTimeout(() => {
          window.location.reload();
        }, 1500);
      } catch (err) {
        setImportStatus({
          type: 'error',
          message: `❌ Failed to parse backup file: ${err.message}`
        });
      }
    };
    reader.readAsText(file);
  };

  const copyToClipboard = (text, key) => {
    navigator.clipboard.writeText(text);
    setCopiedText(key);
    setTimeout(() => setCopiedText(''), 2000);
  };

  const envTemplate = `VITE_FIREBASE_API_KEY=your_api_key_here
VITE_FIREBASE_AUTH_DOMAIN=your_project_id.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your_project_id
VITE_FIREBASE_STORAGE_BUCKET=your_project_id.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=your_messaging_sender_id
VITE_FIREBASE_APP_ID=your_app_id_here`;

  return (
    <div className="dev-console-overlay" style={{
      position: 'fixed',
      top: '50%',
      left: '50%',
      transform: 'translate(-50%, -50%)',
      width: '580px',
      maxHeight: '90vh',
      display: 'flex',
      flexDirection: 'column',
      background: 'rgba(10, 11, 16, 0.95)',
      border: '1px solid rgba(255, 255, 255, 0.1)',
      borderRadius: '16px',
      boxShadow: '0 24px 64px rgba(0, 0, 0, 0.8)',
      zIndex: 10000,
      backdropFilter: 'blur(20px)',
      fontFamily: 'Outfit, sans-serif'
    }}>
      {/* Header */}
      <div style={{
        padding: '1.25rem 1.5rem',
        borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        background: 'rgba(255, 255, 255, 0.01)'
      }}>
        <h3 style={{
          fontSize: '1.2rem',
          display: 'flex',
          alignItems: 'center',
          gap: '0.6rem',
          color: '#ffffff'
        }}>
          <Server size={18} style={{ color: isRealFirebase() ? '#4ade80' : '#facc15' }} />
          Database Connectivity HUD
        </h3>
        <button onClick={onClose} style={{
          background: 'transparent',
          border: 'none',
          color: 'var(--text-muted)',
          cursor: 'pointer',
          padding: '0.25rem'
        }}>
          <X size={20} />
        </button>
      </div>

      {/* Body Content */}
      <div style={{
        padding: '1.5rem',
        overflowY: 'auto',
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
        gap: '1.5rem'
      }}>
        {/* Status Box */}
        <div className="glass-panel" style={{
          padding: '1.25rem',
          borderRadius: '12px',
          border: isRealFirebase() ? '1px solid rgba(34, 197, 94, 0.2)' : '1px solid rgba(234, 179, 8, 0.2)',
          background: isRealFirebase() ? 'rgba(34, 197, 94, 0.02)' : 'rgba(234, 179, 8, 0.02)',
          display: 'flex',
          flexDirection: 'column',
          gap: '0.75rem'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <span style={{
              width: '10px',
              height: '10px',
              borderRadius: '50%',
              background: isRealFirebase() ? '#4ade80' : '#facc15',
              boxShadow: isRealFirebase() ? '0 0 10px #4ade80' : '0 0 10px #facc15'
            }} className="pulse-active" />
            <h4 style={{ fontSize: '1.1rem', fontWeight: '700' }}>
              Current Status: {isRealFirebase() ? 'Cloud Active (Firebase Firestore)' : 'Local Sandbox Mode'}
            </h4>
          </div>
          
          <p style={{ fontSize: '0.88rem', color: 'var(--text-muted)', lineHeight: '1.5' }}>
            {isRealFirebase() 
              ? 'Excellent! Your web app is actively synced with a global permanent Google Cloud Firestore Database. All users across all browsers and devices share the exact same persistent events database.'
              : 'Attention: You are currently running in Local Sandbox Fallback Mode. All events, volunteer passport accomplishments, registrations, and sponsorships reside solely inside your browser\'s local storage.'
            }
          </p>

          {isMemoryFallbackActive() && (
            <div style={{
              marginTop: '0.5rem',
              padding: '0.6rem 0.8rem',
              borderRadius: '6px',
              background: 'rgba(239, 68, 68, 0.1)',
              border: '1px solid rgba(239, 68, 68, 0.3)',
              fontSize: '0.8rem',
              color: '#f87171'
            }}>
              ⚠️ System alert: LocalStorage quota exceeded due to other websites! Running in volatile Memory Mode. Changes will be reset immediately if you reload the page.
            </div>
          )}
        </div>

        {/* Why data got deleted section */}
        {!isRealFirebase() && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            <h4 style={{ fontSize: '0.95rem', color: '#ffffff', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
              <ShieldAlert size={16} style={{ color: '#ec4899' }} />
              Why did my previous data disappear?
            </h4>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', lineHeight: '1.5' }}>
              When database credentials are not supplied, NexEvent automatically falls back to your browser's disk memory (<code style={{ color: 'var(--accent-cyan)' }}>localStorage</code>).
              Because of this, <strong>your data will clear automatically</strong> if you open the site in a different browser, incognito mode, on another computer, or if you clear your browser cookies/history.
            </p>
          </div>
        )}

        {/* Backup and Restore Utilities */}
        <div style={{
          borderTop: '1px solid rgba(255, 255, 255, 0.08)',
          paddingTop: '1.25rem',
          display: 'flex',
          flexDirection: 'column',
          gap: '0.75rem'
        }}>
          <h4 style={{ fontSize: '0.95rem', color: '#ffffff' }}>Local Sandbox Backup & Restore</h4>
          <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '0.25rem' }}>
            Keep copies of your mock database local setups or import a previously downloaded backup.
          </p>

          <div style={{ display: 'flex', gap: '1rem' }}>
            <button className="btn btn-secondary" onClick={handleExport} style={{ flex: 1, fontSize: '0.85rem', gap: '0.4rem', padding: '0.5rem' }}>
              <Download size={15} /> Export Backup (.json)
            </button>
            
            <button className="btn btn-secondary" onClick={() => fileInputRef.current.click()} style={{ flex: 1, fontSize: '0.85rem', gap: '0.4rem', padding: '0.5rem' }}>
              <Upload size={15} /> Import / Restore DB
            </button>
            <input 
              type="file" 
              ref={fileInputRef} 
              onChange={handleImport} 
              accept=".json" 
              style={{ display: 'none' }} 
            />
          </div>

          {importStatus.message && (
            <div style={{
              padding: '0.6rem 0.8rem',
              borderRadius: '6px',
              fontSize: '0.8rem',
              textAlign: 'center',
              background: importStatus.type === 'error' ? 'rgba(239, 68, 68, 0.1)' : 'rgba(34, 197, 94, 0.1)',
              border: importStatus.type === 'error' ? '1px solid rgba(239, 68, 68, 0.2)' : '1px solid rgba(34, 197, 94, 0.2)',
              color: importStatus.type === 'error' ? '#f87171' : '#4ade80'
            }}>
              {importStatus.message}
            </div>
          )}
        </div>

        {/* How to activate Cloud DB (Firebase/MongoDB analogue) */}
        <div style={{
          borderTop: '1px solid rgba(255, 255, 255, 0.08)',
          paddingTop: '1.25rem',
          display: 'flex',
          flexDirection: 'column',
          gap: '0.75rem'
        }}>
          <h4 style={{ fontSize: '0.95rem', color: '#ffffff', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
            <Cloud size={16} style={{ color: 'var(--accent-cyan)' }} />
            Activate Persistent Global Cloud sync
          </h4>
          <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)', lineHeight: '1.5' }}>
            Our dual-engine database coordinator is pre-wired for Google Cloud Firestore. Add your Web SDK config keys to activate permanent cloud storage:
          </p>

          {/* GitHub Secret Setup Instructions */}
          <div style={{
            background: 'rgba(255, 255, 255, 0.02)',
            border: '1px solid rgba(255, 255, 255, 0.05)',
            borderRadius: '10px',
            padding: '1rem',
            display: 'flex',
            flexDirection: 'column',
            gap: '0.75rem'
          }}>
            <h5 style={{ fontSize: '0.85rem', color: '#ffffff', fontWeight: '600' }}>For GitHub Pages Deployments (Recommended):</h5>
            <ol style={{ fontSize: '0.8rem', color: 'var(--text-muted)', paddingLeft: '1.25rem', lineHeight: '1.6' }}>
              <li>Create a free project at the <a href="https://console.firebase.google.com" target="_blank" rel="noreferrer" style={{ textDecoration: 'underline' }}>Firebase Console</a>.</li>
              <li>Enable Firestore Database and configure read/write rules.</li>
              <li>Go to your GitHub Repository Settings → <strong>Secrets and variables</strong> → <strong>Actions</strong>.</li>
              <li>Add the following 6 configuration variables as <strong>Repository Secrets</strong>:</li>
            </ol>

            <div style={{ position: 'relative', marginTop: '0.25rem' }}>
              <pre style={{
                background: '#040508',
                color: 'var(--accent-cyan)',
                padding: '0.75rem',
                borderRadius: '6px',
                fontSize: '0.75rem',
                overflowX: 'auto',
                lineHeight: '1.4',
                fontFamily: 'monospace'
              }}>{envTemplate}</pre>
              <button 
                onClick={() => copyToClipboard(envTemplate, 'env')}
                style={{
                  position: 'absolute',
                  top: '8px',
                  right: '8px',
                  background: 'rgba(255, 255, 255, 0.05)',
                  border: '1px solid rgba(255, 255, 255, 0.1)',
                  borderRadius: '4px',
                  padding: '0.3rem',
                  cursor: 'pointer',
                  color: 'var(--text-muted)'
                }}
                title="Copy configuration template"
              >
                {copiedText === 'env' ? <Check size={14} style={{ color: '#4ade80' }} /> : <Copy size={14} />}
              </button>
            </div>

            <p style={{ fontSize: '0.75rem', color: 'var(--text-dark)', fontStyle: 'italic', lineHeight: '1.4' }}>
              💡 Once configured, GitHub Actions will build and deploy NexEvent automatically with active live cloud synchronisation!
            </p>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div style={{
        padding: '1rem 1.5rem',
        borderTop: '1px solid rgba(255, 255, 255, 0.08)',
        background: 'rgba(0, 0, 0, 0.2)',
        display: 'flex',
        justifyContent: 'flex-end'
      }}>
        <button className="btn btn-primary" onClick={onClose} style={{ fontSize: '0.85rem', padding: '0.5rem 1rem' }}>
          Done & Close
        </button>
      </div>
    </div>
  );
}
