import React, { useState } from 'react';
import { Key, X, Check } from 'lucide-react';

export default function ApiKeyModal({ isOpen, onClose, apiKey, onSaveApiKey }) {
  const [keyInput, setKeyInput] = useState(apiKey || '');

  if (!isOpen) return null;

  const handleSave = () => {
    onSaveApiKey(keyInput.trim());
    onClose();
  };

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(0, 0, 0, 0.75)', backdropFilter: 'blur(6px)' }}>
      <div className="glass-panel" style={{ width: '100%', maxWidth: '480px', padding: '1.5rem', border: '1px solid var(--border-glow)' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
          <h3 style={{ fontSize: '1.1rem', fontWeight: '700', display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#f3f4f6' }}>
            <Key style={{ color: '#6366f1' }} size={20} /> Configure Gemini AI API Key
          </h3>
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: '#9ca3af', cursor: 'pointer' }}>
            <X size={20} />
          </button>
        </div>

        <p style={{ fontSize: '0.85rem', color: '#9ca3af', marginBottom: '1rem', lineHeight: '1.4' }}>
          (Optional) Provide your Google Gemini API key to enable direct Gemini model queries. If left blank, the built-in dynamic schema engine will automatically handle all generation requests offline.
        </p>

        <input
          type="password"
          value={keyInput}
          onChange={(e) => setKeyInput(e.target.value)}
          placeholder="AIzaSy..."
          style={{
            width: '100%',
            background: 'rgba(0, 0, 0, 0.4)',
            border: '1px solid var(--border-color)',
            borderRadius: '8px',
            color: '#fff',
            padding: '0.75rem',
            fontFamily: 'var(--font-mono)',
            fontSize: '0.9rem',
            marginBottom: '1.5rem',
            outline: 'none'
          }}
        />

        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem' }}>
          <button onClick={onClose} className="btn-secondary">
            Cancel
          </button>
          <button onClick={handleSave} className="btn-primary">
            <Check size={16} /> Save Key
          </button>
        </div>
      </div>
    </div>
  );
}
