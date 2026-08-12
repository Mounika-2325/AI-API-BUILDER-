import React, { useState } from 'react';
import { Play, Send, Clock, CheckCircle2, AlertCircle, RefreshCw } from 'lucide-react';

export default function APITester({ simulationId, endpoints, tables }) {
  const [selectedEndpoint, setSelectedEndpoint] = useState(endpoints?.[0] || null);
  const [requestBodyJson, setRequestBodyJson] = useState(
    selectedEndpoint?.requestBody ? JSON.stringify(selectedEndpoint.requestBody, null, 2) : ''
  );
  const [pathParamId, setPathParamId] = useState('1');
  const [isLoading, setIsLoading] = useState(false);
  const [testResult, setTestResult] = useState(null);

  const handleSelectEndpoint = (ep) => {
    setSelectedEndpoint(ep);
    setRequestBodyJson(ep.requestBody ? JSON.stringify(ep.requestBody, null, 2) : '');
    setTestResult(null);
  };

  const handleSendRequest = async () => {
    if (!selectedEndpoint) return;
    setIsLoading(true);
    setTestResult(null);

    let parsedBody = null;
    if (['POST', 'PUT'].includes(selectedEndpoint.method) && requestBodyJson) {
      try {
        parsedBody = JSON.parse(requestBodyJson);
      } catch (err) {
        setIsLoading(false);
        setTestResult({
          status: 400,
          statusText: 'Bad Request (Client JSON Syntax Error)',
          timeMs: 2,
          headers: { 'content-type': 'application/json' },
          body: { success: false, error: 'Invalid JSON payload format in request editor.' }
        });
        return;
      }
    }

    // Construct request path
    let activePath = selectedEndpoint.path;
    if (activePath.includes(':id')) {
      activePath = activePath.replace(':id', pathParamId || '1');
    }

    try {
      const res = await fetch('/api/simulate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          simulationId,
          endpointId: selectedEndpoint.id,
          method: selectedEndpoint.method,
          path: activePath,
          requestBody: parsedBody
        })
      });

      const data = await res.json();
      setTestResult(data);
    } catch (err) {
      setTestResult({
        status: 500,
        statusText: 'Internal Server Error',
        timeMs: 5,
        headers: { 'content-type': 'application/json' },
        body: { success: false, error: err.message || 'Failed to connect to simulation server' }
      });
    } finally {
      setIsLoading(false);
    }
  };

  if (!endpoints || endpoints.length === 0) return null;

  return (
    <div style={{ padding: '1.5rem' }}>
      <div style={{ marginBottom: '1.5rem' }}>
        <h2 style={{ fontSize: '1.25rem', fontWeight: '700', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <Play style={{ color: '#10b981' }} size={22} /> Interactive REST API Sandbox
        </h2>
        <p style={{ color: '#9ca3af', fontSize: '0.875rem' }}>
          Test live CRUD operations against simulated database state with instant HTTP response inspection.
        </p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '320px 1fr', gap: '1.5rem', alignItems: 'start' }}>
        {/* Endpoint Selector List */}
        <div className="glass-panel" style={{ overflow: 'hidden' }}>
          <div style={{ padding: '0.75rem 1rem', background: 'rgba(255,255,255,0.04)', borderBottom: '1px solid var(--border-color)', fontWeight: '700', fontSize: '0.85rem', color: '#9ca3af' }}>
            AVAILABLE REST ENDPOINTS ({endpoints.length})
          </div>
          <div style={{ maxHeight: '600px', overflowY: 'auto' }}>
            {endpoints.map(ep => {
              const isSelected = selectedEndpoint?.id === ep.id;
              let badgeClass = 'badge-get';
              if (ep.method === 'POST') badgeClass = 'badge-post';
              if (ep.method === 'PUT') badgeClass = 'badge-put';
              if (ep.method === 'DELETE') badgeClass = 'badge-delete';

              return (
                <button
                  key={ep.id}
                  onClick={() => handleSelectEndpoint(ep)}
                  style={{
                    width: '100%',
                    textAlign: 'left',
                    padding: '0.75rem 1rem',
                    background: isSelected ? 'rgba(99, 102, 241, 0.12)' : 'transparent',
                    border: 'none',
                    borderLeft: isSelected ? '3px solid #6366f1' : '3px solid transparent',
                    borderBottom: '1px solid rgba(255,255,255,0.03)',
                    cursor: 'pointer',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '0.25rem',
                    transition: 'all 0.15s ease'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <span className={badgeClass} style={{ fontSize: '0.65rem', fontWeight: '800', padding: '0.1rem 0.4rem', borderRadius: '4px', fontFamily: 'var(--font-mono)' }}>
                      {ep.method}
                    </span>
                    <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.8rem', color: isSelected ? '#ffffff' : '#d1d5db', wordBreak: 'break-all' }}>
                      {ep.path}
                    </span>
                  </div>
                  <span style={{ fontSize: '0.75rem', color: '#9ca3af', textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap' }}>
                    {ep.summary}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* API Execution Console */}
        {selectedEndpoint && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            {/* Request Header bar */}
            <div className="glass-panel" style={{ padding: '1rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
                <span className={`badge-${selectedEndpoint.method.toLowerCase()}`} style={{ fontSize: '0.85rem', fontWeight: '800', padding: '0.35rem 0.75rem', borderRadius: '6px', fontFamily: 'var(--font-mono)' }}>
                  {selectedEndpoint.method}
                </span>

                <div style={{ flex: 1, display: 'flex', alignItems: 'center', background: 'rgba(0,0,0,0.4)', borderRadius: '6px', padding: '0.4rem 0.75rem', border: '1px solid var(--border-color)', fontFamily: 'var(--font-mono)', fontSize: '0.9rem' }}>
                  <span style={{ color: '#9ca3af' }}>http://localhost:5000</span>
                  {selectedEndpoint.path.includes(':id') ? (
                    <>
                      <span>{selectedEndpoint.path.replace(':id', '')}</span>
                      <input
                        type="text"
                        value={pathParamId}
                        onChange={(e) => setPathParamId(e.target.value)}
                        style={{
                          background: 'rgba(99, 102, 241, 0.25)',
                          border: '1px solid #6366f1',
                          color: '#fff',
                          width: '45px',
                          textAlign: 'center',
                          borderRadius: '4px',
                          fontFamily: 'var(--font-mono)',
                          fontSize: '0.85rem',
                          fontWeight: '700',
                          padding: '0.1rem'
                        }}
                      />
                    </>
                  ) : (
                    <span>{selectedEndpoint.path}</span>
                  )}
                </div>

                <button
                  onClick={handleSendRequest}
                  disabled={isLoading}
                  className="btn-primary"
                  style={{ background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)', boxShadow: '0 4px 14px rgba(16, 185, 129, 0.35)' }}
                >
                  {isLoading ? <RefreshCw size={16} className="animate-spin" /> : <Send size={16} />}
                  Send Request
                </button>
              </div>

              {/* Request Payload Editor for POST/PUT */}
              {['POST', 'PUT'].includes(selectedEndpoint.method) && (
                <div style={{ marginTop: '1rem' }}>
                  <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: '600', color: '#9ca3af', marginBottom: '0.35rem' }}>
                    REQUEST BODY (JSON)
                  </label>
                  <textarea
                    value={requestBodyJson}
                    onChange={(e) => setRequestBodyJson(e.target.value)}
                    rows={6}
                    style={{
                      width: '100%',
                      background: 'rgba(0, 0, 0, 0.4)',
                      border: '1px solid var(--border-color)',
                      borderRadius: '8px',
                      color: '#a5b4fc',
                      fontFamily: 'var(--font-mono)',
                      fontSize: '0.85rem',
                      padding: '0.75rem',
                      outline: 'none',
                      resize: 'vertical'
                    }}
                  />
                </div>
              )}
            </div>

            {/* Response Console Output */}
            {testResult && (
              <div className="glass-panel" style={{ padding: '1rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.75rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.5rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                    <span 
                      style={{ 
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '0.35rem',
                        fontSize: '0.85rem', 
                        fontWeight: '700', 
                        padding: '0.2rem 0.6rem', 
                        borderRadius: '4px',
                        background: testResult.status < 300 ? 'rgba(16, 185, 129, 0.2)' : 'rgba(239, 68, 68, 0.2)',
                        color: testResult.status < 300 ? '#34d399' : '#f87171',
                        border: testResult.status < 300 ? '1px solid rgba(16, 185, 129, 0.4)' : '1px solid rgba(239, 68, 68, 0.4)'
                      }}
                    >
                      {testResult.status < 300 ? <CheckCircle2 size={15} /> : <AlertCircle size={15} />}
                      {testResult.status} {testResult.statusText}
                    </span>
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.25rem', fontSize: '0.75rem', color: '#9ca3af' }}>
                      <Clock size={14} /> {testResult.timeMs || 8} ms
                    </span>
                  </div>
                </div>

                {/* Headers preview */}
                <div style={{ fontSize: '0.75rem', color: '#6b7280', marginBottom: '0.5rem', fontFamily: 'var(--font-mono)' }}>
                  Response Headers: {JSON.stringify(testResult.headers)}
                </div>

                {/* Response Body JSON output */}
                <div style={{ background: '#070a12', borderRadius: '8px', padding: '1rem', border: '1px solid rgba(255,255,255,0.05)', maxHeight: '350px', overflowY: 'auto' }}>
                  <pre style={{ margin: 0, fontSize: '0.85rem', color: '#38bdf8', whiteSpace: 'pre-wrap' }}>
                    {JSON.stringify(testResult.body, null, 2)}
                  </pre>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
