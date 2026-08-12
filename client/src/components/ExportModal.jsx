import React, { useState } from 'react';
import { Download, X, FileCode, FileText, Archive, Check } from 'lucide-react';
import confetti from 'canvas-confetti';
import { API_BASE_URL } from '../config';

export default function ExportModal({ isOpen, onClose, architecture }) {
  const [isZipping, setIsZipping] = useState(false);
  const [copiedType, setCopiedType] = useState(null);

  if (!isOpen || !architecture) return null;

  const triggerConfetti = () => {
    confetti({
      particleCount: 80,
      spread: 70,
      origin: { y: 0.6 }
    });
  };

  const handleDownloadFile = (content, filename, type) => {
    const blob = new Blob([content], { type });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    triggerConfetti();
  };

  const handleExportZip = async () => {
    setIsZipping(true);
    try {
      const res = await fetch(`${API_BASE_URL}/api/export-project`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ architecture })
      });

      if (!res.ok) throw new Error("ZIP export failed");

      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${architecture.systemName.toLowerCase().replace(/\s+/g, '-')}-express-backend.zip`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      triggerConfetti();
    } catch (err) {
      alert(`Export error: ${err.message}`);
    } finally {
      setIsZipping(false);
    }
  };

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(0, 0, 0, 0.75)', backdropFilter: 'blur(6px)' }}>
      <div className="glass-panel" style={{ width: '100%', maxWidth: '560px', padding: '1.5rem', border: '1px solid var(--border-glow)' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.25rem' }}>
          <h3 style={{ fontSize: '1.15rem', fontWeight: '700', display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#f3f4f6' }}>
            <Download style={{ color: '#06b6d4' }} size={22} /> Export Architecture Artifacts
          </h3>
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: '#9ca3af', cursor: 'pointer' }}>
            <X size={20} />
          </button>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginBottom: '1.5rem' }}>
          {/* Download Express ZIP */}
          <div className="glass-panel" style={{ padding: '1rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: 'rgba(99, 102, 241, 0.08)' }}>
            <div>
              <div style={{ fontWeight: '700', fontSize: '0.95rem', color: '#ffffff', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                <Archive size={18} style={{ color: '#a5b4fc' }} /> Complete Express Backend ZIP
              </div>
              <div style={{ fontSize: '0.78rem', color: '#9ca3af', marginTop: '0.2rem' }}>
                Runnable Node.js/Express server with route handlers, pg pool connection, & DB setup.
              </div>
            </div>
            <button onClick={handleExportZip} disabled={isZipping} className="btn-primary" style={{ padding: '0.5rem 1rem', fontSize: '0.85rem' }}>
              {isZipping ? 'Zipping...' : 'Download ZIP'}
            </button>
          </div>

          {/* Download SQL */}
          <div className="glass-panel" style={{ padding: '1rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div>
              <div style={{ fontWeight: '700', fontSize: '0.95rem', color: '#ffffff', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                <FileCode size={18} style={{ color: '#38bdf8' }} /> PostgreSQL DDL Script (.sql)
              </div>
              <div style={{ fontSize: '0.78rem', color: '#9ca3af', marginTop: '0.2rem' }}>
                CREATE TABLE statements, primary/foreign keys, indexes, and seed INSERT data.
              </div>
            </div>
            <button
              onClick={() => handleDownloadFile(architecture.sql, `${architecture.systemName.toLowerCase().replace(/\s+/g, '_')}_schema.sql`, 'text/plain')}
              className="btn-secondary"
              style={{ fontSize: '0.85rem' }}
            >
              Export SQL
            </button>
          </div>

          {/* Download OpenAPI Spec */}
          <div className="glass-panel" style={{ padding: '1rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div>
              <div style={{ fontWeight: '700', fontSize: '0.95rem', color: '#ffffff', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                <FileText size={18} style={{ color: '#34d399' }} /> OpenAPI 3.0 Documentation (.yaml)
              </div>
              <div style={{ fontSize: '0.78rem', color: '#9ca3af', marginTop: '0.2rem' }}>
                Swagger/OpenAPI specification ready for Swagger UI or Postman import.
              </div>
            </div>
            <button
              onClick={() => handleDownloadFile(architecture.openApiYaml, 'openapi.yaml', 'text/yaml')}
              className="btn-secondary"
              style={{ fontSize: '0.85rem' }}
            >
              Export YAML
            </button>
          </div>
        </div>

        <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
          <button onClick={onClose} className="btn-secondary">
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
