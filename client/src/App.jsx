import React, { useState, useEffect } from 'react';
import { 
  Sparkles, Database, Code, FileJson, BookOpen, Play, 
  Copy, Check, Download, Key, RefreshCw, Layers, Search, 
  SlidersHorizontal, CheckCircle2, AlertTriangle, ExternalLink, ArrowRight
} from 'lucide-react';
import ERDViewer from './components/ERDViewer';
import APITester from './components/APITester';
import ApiKeyModal from './components/ApiKeyModal';
import ExportModal from './components/ExportModal';

export default function App() {
  const [promptInput, setPromptInput] = useState('');
  const [apiKey, setApiKey] = useState(localStorage.getItem('gemini_api_key') || '');
  const [isApiKeyModalOpen, setIsApiKeyModalOpen] = useState(false);
  const [isExportModalOpen, setIsExportModalOpen] = useState(false);

  const [isLoading, setIsLoading] = useState(false);
  const [loadingStep, setLoadingStep] = useState(0);
  const [errorMsg, setErrorMsg] = useState(null);

  const [architecture, setArchitecture] = useState(null);
  const [simulationId, setSimulationId] = useState(null);
  const [activeTab, setActiveTab] = useState('erd'); // 'erd' | 'sql' | 'apis' | 'openapi' | 'jsonschema' | 'sandbox'

  const [copiedSection, setCopiedSection] = useState(null);
  const [apiFilterMethod, setApiFilterMethod] = useState('ALL');
  const [apiSearchTerm, setApiSearchTerm] = useState('');
  const [openApiFormat, setOpenApiFormat] = useState('yaml'); // 'yaml' | 'json'

  const quickPresets = [
    { label: 'Restaurant', text: 'Restaurant Management System' },
    { label: 'Hospital', text: 'Hospital Management System' },
    { label: 'Library', text: 'Library Management System' },
    { label: 'School', text: 'School Management System' },
    { label: 'E-commerce', text: 'E-commerce Product Store' },
    { label: 'Fitness Gym', text: 'Gym & Fitness Center' },
    { label: 'Hotel Booking', text: 'Hotel Reservation System' },
    { label: 'Crypto Wallet', text: 'Crypto Wallet & Exchange Tracker' }
  ];

  const loadingSteps = [
    "Analyzing system domain & extracting core entities...",
    "Designing normalized 3NF PostgreSQL database tables...",
    "Defining primary keys, foreign key constraints & indexes...",
    "Generating RESTful Express.js CRUD route handlers...",
    "Constructing OpenAPI 3.0 specifications & JSON Schemas...",
    "Initializing live in-memory API testing sandbox..."
  ];

  const handleSaveApiKey = (key) => {
    setApiKey(key);
    if (key) {
      localStorage.setItem('gemini_api_key', key);
    } else {
      localStorage.removeItem('gemini_api_key');
    }
  };

  const handleGenerate = async (targetPrompt = null) => {
    const query = (targetPrompt || promptInput).trim();
    if (!query) return;

    setIsLoading(true);
    setErrorMsg(null);
    setLoadingStep(0);

    // Animated loading step intervals
    const interval = setInterval(() => {
      setLoadingStep(prev => (prev < loadingSteps.length - 1 ? prev + 1 : prev));
    }, 450);

    try {
      const res = await fetch('/api/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: query,
          apiKey: apiKey || null
        })
      });

      const result = await res.json();
      clearInterval(interval);

      if (!res.ok || !result.success) {
        throw new Error(result.error || 'Failed to generate system architecture');
      }

      setArchitecture(result.data);
      setSimulationId(result.simulationId);
      setActiveTab('erd');
    } catch (err) {
      clearInterval(interval);
      setErrorMsg(err.message || 'An unexpected error occurred during generation');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCopyCode = (text, sectionId) => {
    navigator.clipboard.writeText(text);
    setCopiedSection(sectionId);
    setTimeout(() => setCopiedSection(null), 2000);
  };

  // Filtered APIs
  const filteredEndpoints = (architecture?.apiEndpoints || []).filter(ep => {
    const matchesMethod = apiFilterMethod === 'ALL' || ep.method === apiFilterMethod;
    const matchesSearch = !apiSearchTerm || 
      ep.path.toLowerCase().includes(apiSearchTerm.toLowerCase()) || 
      ep.summary.toLowerCase().includes(apiSearchTerm.toLowerCase()) ||
      ep.table.toLowerCase().includes(apiSearchTerm.toLowerCase());
    return matchesMethod && matchesSearch;
  });

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      {/* Top Navbar */}
      <header style={{ borderBottom: '1px solid var(--border-color)', background: 'rgba(9, 13, 22, 0.85)', backdropFilter: 'blur(12px)', sticky: 'top', top: 0, zIndex: 50 }}>
        <div style={{ maxWidth: '1400px', margin: '0 auto', padding: '0.85rem 1.5rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <div style={{ background: 'linear-gradient(135deg, #6366f1 0%, #a855f7 100%)', width: '38px', height: '38px', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 0 15px rgba(99, 102, 241, 0.5)' }}>
              <Sparkles size={20} style={{ color: '#fff' }} />
            </div>
            <div>
              <h1 style={{ fontSize: '1.2rem', fontWeight: '800', tracking: '-0.02em', background: 'linear-gradient(90deg, #ffffff 0%, #cbd5e1 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
                AI API Builder
              </h1>
              <p style={{ fontSize: '0.72rem', color: '#9ca3af' }}>
                Dynamic PostgreSQL Schema & REST API Synthesizer
              </p>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <button 
              onClick={() => setIsApiKeyModalOpen(true)}
              className="btn-secondary" 
              style={{ fontSize: '0.8rem', padding: '0.45rem 0.85rem' }}
            >
              <Key size={14} style={{ color: apiKey ? '#10b981' : '#9ca3af' }} />
              {apiKey ? 'API Key Set' : 'Add Gemini Key'}
            </button>

            {architecture && (
              <button 
                onClick={() => setIsExportModalOpen(true)}
                className="btn-primary" 
                style={{ fontSize: '0.8rem', padding: '0.45rem 0.85rem' }}
              >
                <Download size={14} /> Export Files
              </button>
            )}
          </div>
        </div>
      </header>

      {/* Hero & Prompt Input Section */}
      <section style={{ maxWidth: '1000px', margin: '2.5rem auto 1.5rem', padding: '0 1.5rem', textAlign: 'center', width: '100%' }}>
        <h2 style={{ fontSize: '2.25rem', fontWeight: '800', lineHeight: '1.2', marginBottom: '0.75rem', background: 'linear-gradient(135deg, #ffffff 0%, #a5b4fc 50%, #38bdf8 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
          Describe Any System. Get Schema & REST APIs Instantly.
        </h2>
        <p style={{ color: '#9ca3af', fontSize: '0.95rem', maxWidth: '650px', margin: '0 auto 1.5rem' }}>
          Enter any application or system name below. The AI will dynamically analyze domain entities and synthesize normalized PostgreSQL tables, CRUD endpoints, and OpenAPI docs.
        </p>

        {/* Input Bar */}
        <div className="glass-panel input-glow" style={{ padding: '0.4rem', display: 'flex', alignItems: 'center', gap: '0.5rem', boxShadow: '0 8px 32px rgba(0, 0, 0, 0.4)' }}>
          <input
            type="text"
            value={promptInput}
            onChange={(e) => setPromptInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && !isLoading && handleGenerate()}
            placeholder="e.g. Restaurant Management System, Hospital, School, Crypto Wallet..."
            style={{
              flex: 1,
              background: 'transparent',
              border: 'none',
              color: '#ffffff',
              fontSize: '1rem',
              padding: '0.75rem 1rem',
              outline: 'none',
              fontFamily: 'var(--font-sans)'
            }}
          />
          <button
            onClick={() => handleGenerate()}
            disabled={isLoading || !promptInput.trim()}
            className="btn-primary"
            style={{ padding: '0.75rem 1.5rem', fontSize: '0.95rem' }}
          >
            {isLoading ? <RefreshCw size={18} className="animate-spin" /> : <Sparkles size={18} />}
            Generate System
          </button>
        </div>

        {/* Quick Presets */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', flexWrap: 'wrap', marginTop: '1rem' }}>
          <span style={{ fontSize: '0.75rem', color: '#6b7280', fontWeight: '600', marginRight: '0.25rem' }}>
            TRY PRESETS:
          </span>
          {quickPresets.map(preset => (
            <button
              key={preset.label}
              onClick={() => {
                setPromptInput(preset.text);
                handleGenerate(preset.text);
              }}
              disabled={isLoading}
              style={{
                background: 'rgba(255, 255, 255, 0.04)',
                border: '1px solid var(--border-color)',
                color: '#d1d5db',
                fontSize: '0.75rem',
                padding: '0.25rem 0.65rem',
                borderRadius: '9999px',
                cursor: 'pointer',
                transition: 'all 0.15s ease'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = 'rgba(99, 102, 241, 0.15)';
                e.currentTarget.style.borderColor = '#6366f1';
                e.currentTarget.style.color = '#fff';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = 'rgba(255, 255, 255, 0.04)';
                e.currentTarget.style.borderColor = 'var(--border-color)';
                e.currentTarget.style.color = '#d1d5db';
              }}
            >
              {preset.label}
            </button>
          ))}
        </div>
      </section>

      {/* Loading Progress State */}
      {isLoading && (
        <div style={{ maxWidth: '600px', margin: '2rem auto', width: '100%', padding: '0 1.5rem' }}>
          <div className="glass-panel" style={{ padding: '1.5rem', textAlign: 'center' }}>
            <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '1rem' }}>
              <div style={{ width: '48px', height: '48px', borderRadius: '50%', background: 'rgba(99, 102, 241, 0.15)', border: '2px solid #6366f1', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <RefreshCw size={24} style={{ color: '#6366f1', animation: 'spin 1s linear infinite' }} />
              </div>
            </div>
            <h3 style={{ fontSize: '1.1rem', fontWeight: '700', color: '#f3f4f6', marginBottom: '0.5rem' }}>
              Synthesizing Architecture...
            </h3>
            <p style={{ color: '#38bdf8', fontSize: '0.88rem', fontFamily: 'var(--font-mono)', minHeight: '24px' }}>
              {loadingSteps[loadingStep]}
            </p>
            <div style={{ width: '100%', background: 'rgba(255,255,255,0.06)', height: '4px', borderRadius: '2px', marginTop: '1rem', overflow: 'hidden' }}>
              <div style={{ width: `${((loadingStep + 1) / loadingSteps.length) * 100}%`, background: 'linear-gradient(90deg, #6366f1, #06b6d4)', height: '100%', transition: 'width 0.3s ease' }} />
            </div>
          </div>
        </div>
      )}

      {/* Error Message Display */}
      {errorMsg && (
        <div style={{ maxWidth: '800px', margin: '1.5rem auto', width: '100%', padding: '0 1.5rem' }}>
          <div className="glass-panel" style={{ padding: '1.25rem', border: '1px solid rgba(239, 68, 68, 0.4)', background: 'rgba(239, 68, 68, 0.08)', display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <AlertTriangle style={{ color: '#f87171', flexShrink: 0 }} size={24} />
            <div style={{ flex: 1 }}>
              <h4 style={{ color: '#f87171', fontWeight: '700', fontSize: '0.95rem' }}>Generation Error</h4>
              <p style={{ color: '#fca5a5', fontSize: '0.85rem', marginTop: '0.2rem' }}>{errorMsg}</p>
            </div>
            <button onClick={() => handleGenerate()} className="btn-secondary" style={{ fontSize: '0.8rem' }}>
              Retry
            </button>
          </div>
        </div>
      )}

      {/* Results Dashboard */}
      {architecture && !isLoading && (
        <main style={{ maxWidth: '1400px', margin: '1.5rem auto 4rem', width: '100%', padding: '0 1.5rem', flex: 1 }}>
          {/* System Title Banner */}
          <div className="glass-panel" style={{ padding: '1.25rem 1.5rem', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem' }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <h2 style={{ fontSize: '1.4rem', fontWeight: '800', color: '#ffffff' }}>
                  {architecture.systemName}
                </h2>
                <span style={{ background: 'rgba(16, 185, 129, 0.15)', color: '#34d399', fontSize: '0.7rem', padding: '0.2rem 0.6rem', borderRadius: '9999px', border: '1px solid rgba(16, 185, 129, 0.3)', fontWeight: '600' }}>
                  Dynamic AI Generation
                </span>
              </div>
              <p style={{ color: '#9ca3af', fontSize: '0.875rem', marginTop: '0.25rem' }}>
                {architecture.description}
              </p>
            </div>

            <div style={{ display: 'flex', gap: '1.5rem', alignItems: 'center' }}>
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: '1.2rem', fontWeight: '800', color: '#6366f1' }}>{architecture.tables.length}</div>
                <div style={{ fontSize: '0.7rem', color: '#9ca3af', textTransform: 'uppercase' }}>Tables</div>
              </div>
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: '1.2rem', fontWeight: '800', color: '#06b6d4' }}>{architecture.apiEndpoints.length}</div>
                <div style={{ fontSize: '0.7rem', color: '#9ca3af', textTransform: 'uppercase' }}>Endpoints</div>
              </div>
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: '1.2rem', fontWeight: '800', color: '#a855f7' }}>3NF</div>
                <div style={{ fontSize: '0.7rem', color: '#9ca3af', textTransform: 'uppercase' }}>Schema</div>
              </div>
            </div>
          </div>

          {/* Main Dashboard Navigation Tabs */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', borderBottom: '1px solid var(--border-color)', marginBottom: '1.5rem', overflowX: 'auto', paddingBottom: '2px' }}>
            <button
              onClick={() => setActiveTab('erd')}
              style={{
                background: activeTab === 'erd' ? 'rgba(99, 102, 241, 0.15)' : 'transparent',
                color: activeTab === 'erd' ? '#ffffff' : '#9ca3af',
                border: 'none',
                borderBottom: activeTab === 'erd' ? '2px solid #6366f1' : '2px solid transparent',
                padding: '0.75rem 1.25rem',
                fontWeight: '600',
                fontSize: '0.9rem',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                whiteSpace: 'nowrap'
              }}
            >
              <Layers size={16} style={{ color: activeTab === 'erd' ? '#6366f1' : '#9ca3af' }} />
              Visual ERD
            </button>

            <button
              onClick={() => setActiveTab('sql')}
              style={{
                background: activeTab === 'sql' ? 'rgba(99, 102, 241, 0.15)' : 'transparent',
                color: activeTab === 'sql' ? '#ffffff' : '#9ca3af',
                border: 'none',
                borderBottom: activeTab === 'sql' ? '2px solid #6366f1' : '2px solid transparent',
                padding: '0.75rem 1.25rem',
                fontWeight: '600',
                fontSize: '0.9rem',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                whiteSpace: 'nowrap'
              }}
            >
              <Database size={16} style={{ color: activeTab === 'sql' ? '#38bdf8' : '#9ca3af' }} />
              PostgreSQL DDL
            </button>

            <button
              onClick={() => setActiveTab('apis')}
              style={{
                background: activeTab === 'apis' ? 'rgba(99, 102, 241, 0.15)' : 'transparent',
                color: activeTab === 'apis' ? '#ffffff' : '#9ca3af',
                border: 'none',
                borderBottom: activeTab === 'apis' ? '2px solid #6366f1' : '2px solid transparent',
                padding: '0.75rem 1.25rem',
                fontWeight: '600',
                fontSize: '0.9rem',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                whiteSpace: 'nowrap'
              }}
            >
              <Code size={16} style={{ color: activeTab === 'apis' ? '#10b981' : '#9ca3af' }} />
              REST Endpoints ({architecture.apiEndpoints.length})
            </button>

            <button
              onClick={() => setActiveTab('openapi')}
              style={{
                background: activeTab === 'openapi' ? 'rgba(99, 102, 241, 0.15)' : 'transparent',
                color: activeTab === 'openapi' ? '#ffffff' : '#9ca3af',
                border: 'none',
                borderBottom: activeTab === 'openapi' ? '2px solid #6366f1' : '2px solid transparent',
                padding: '0.75rem 1.25rem',
                fontWeight: '600',
                fontSize: '0.9rem',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                whiteSpace: 'nowrap'
              }}
            >
              <BookOpen size={16} style={{ color: activeTab === 'openapi' ? '#a855f7' : '#9ca3af' }} />
              OpenAPI 3.0 Spec
            </button>

            <button
              onClick={() => setActiveTab('jsonschema')}
              style={{
                background: activeTab === 'jsonschema' ? 'rgba(99, 102, 241, 0.15)' : 'transparent',
                color: activeTab === 'jsonschema' ? '#ffffff' : '#9ca3af',
                border: 'none',
                borderBottom: activeTab === 'jsonschema' ? '2px solid #6366f1' : '2px solid transparent',
                padding: '0.75rem 1.25rem',
                fontWeight: '600',
                fontSize: '0.9rem',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                whiteSpace: 'nowrap'
              }}
            >
              <FileJson size={16} style={{ color: activeTab === 'jsonschema' ? '#f59e0b' : '#9ca3af' }} />
              JSON Schemas
            </button>

            <button
              onClick={() => setActiveTab('sandbox')}
              style={{
                background: activeTab === 'sandbox' ? 'rgba(99, 102, 241, 0.15)' : 'transparent',
                color: activeTab === 'sandbox' ? '#ffffff' : '#9ca3af',
                border: 'none',
                borderBottom: activeTab === 'sandbox' ? '2px solid #6366f1' : '2px solid transparent',
                padding: '0.75rem 1.25rem',
                fontWeight: '600',
                fontSize: '0.9rem',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                whiteSpace: 'nowrap'
              }}
            >
              <Play size={16} style={{ color: activeTab === 'sandbox' ? '#10b981' : '#9ca3af' }} />
              Live API Sandbox
            </button>
          </div>

          {/* Tab Content 1: Visual ERD */}
          {activeTab === 'erd' && (
            <div className="glass-panel">
              <ERDViewer tables={architecture.tables} relationships={architecture.relationships} />
            </div>
          )}

          {/* Tab Content 2: PostgreSQL DDL */}
          {activeTab === 'sql' && (
            <div className="glass-panel" style={{ padding: '1.5rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
                <div>
                  <h3 style={{ fontSize: '1.1rem', fontWeight: '700', color: '#f3f4f6' }}>
                    PostgreSQL DDL Creation Script
                  </h3>
                  <p style={{ fontSize: '0.8rem', color: '#9ca3af' }}>
                    Copy or execute in psql, pgAdmin, or Supabase.
                  </p>
                </div>
                <button
                  onClick={() => handleCopyCode(architecture.sql, 'sql')}
                  className="btn-secondary"
                  style={{ fontSize: '0.85rem' }}
                >
                  {copiedSection === 'sql' ? <Check size={16} style={{ color: '#10b981' }} /> : <Copy size={16} />}
                  {copiedSection === 'sql' ? 'Copied SQL!' : 'Copy SQL'}
                </button>
              </div>

              <div style={{ background: '#070a12', borderRadius: '8px', padding: '1rem', border: '1px solid rgba(255,255,255,0.05)', maxHeight: '650px', overflowY: 'auto' }}>
                <pre style={{ margin: 0, fontSize: '0.85rem', color: '#38bdf8', whiteSpace: 'pre-wrap' }}>
                  {architecture.sql}
                </pre>
              </div>
            </div>
          )}

          {/* Tab Content 3: REST Endpoints */}
          {activeTab === 'apis' && (
            <div className="glass-panel" style={{ padding: '1.5rem' }}>
              {/* Filter controls */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem', marginBottom: '1.5rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  {['ALL', 'GET', 'POST', 'PUT', 'DELETE'].map(m => (
                    <button
                      key={m}
                      onClick={() => setApiFilterMethod(m)}
                      style={{
                        background: apiFilterMethod === m ? 'rgba(99, 102, 241, 0.25)' : 'rgba(255,255,255,0.04)',
                        color: apiFilterMethod === m ? '#ffffff' : '#9ca3af',
                        border: apiFilterMethod === m ? '1px solid #6366f1' : '1px solid var(--border-color)',
                        borderRadius: '6px',
                        padding: '0.35rem 0.75rem',
                        fontSize: '0.8rem',
                        fontWeight: '700',
                        cursor: 'pointer'
                      }}
                    >
                      {m}
                    </button>
                  ))}
                </div>

                <div style={{ display: 'flex', alignItems: 'center', background: 'rgba(0,0,0,0.3)', border: '1px solid var(--border-color)', borderRadius: '6px', padding: '0.35rem 0.75rem', width: '280px' }}>
                  <Search size={16} style={{ color: '#9ca3af', marginRight: '0.5rem' }} />
                  <input
                    type="text"
                    value={apiSearchTerm}
                    onChange={(e) => setApiSearchTerm(e.target.value)}
                    placeholder="Search endpoints..."
                    style={{ background: 'transparent', border: 'none', color: '#fff', fontSize: '0.85rem', outline: 'none', width: '100%' }}
                  />
                </div>
              </div>

              {/* Endpoints Accordion/List */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                {filteredEndpoints.map(ep => {
                  let badgeClass = 'badge-get';
                  if (ep.method === 'POST') badgeClass = 'badge-post';
                  if (ep.method === 'PUT') badgeClass = 'badge-put';
                  if (ep.method === 'DELETE') badgeClass = 'badge-delete';

                  return (
                    <div key={ep.id} className="glass-panel" style={{ padding: '1rem', border: '1px solid var(--border-color)' }}>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                          <span className={badgeClass} style={{ fontSize: '0.8rem', fontWeight: '800', padding: '0.25rem 0.6rem', borderRadius: '4px', fontFamily: 'var(--font-mono)' }}>
                            {ep.method}
                          </span>
                          <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.95rem', fontWeight: '600', color: '#ffffff' }}>
                            {ep.path}
                          </span>
                        </div>
                        <span style={{ fontSize: '0.75rem', color: '#9ca3af', background: 'rgba(255,255,255,0.05)', padding: '0.15rem 0.5rem', borderRadius: '4px' }}>
                          Resource: {ep.table}
                        </span>
                      </div>

                      <p style={{ fontSize: '0.85rem', color: '#9ca3af', marginBottom: '1rem' }}>
                        {ep.description}
                      </p>

                      {/* Code Snippets Toggle */}
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                        {/* Express route handler */}
                        <div>
                          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.35rem' }}>
                            <span style={{ fontSize: '0.75rem', color: '#a5b4fc', fontWeight: '700' }}>EXPRESS ROUTE HANDLER</span>
                            <button
                              onClick={() => handleCopyCode(ep.expressCode, ep.id)}
                              style={{ background: 'none', border: 'none', color: '#9ca3af', cursor: 'pointer', fontSize: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.2rem' }}
                            >
                              {copiedSection === ep.id ? <Check size={12} style={{ color: '#10b981' }} /> : <Copy size={12} />}
                              {copiedSection === ep.id ? 'Copied' : 'Copy'}
                            </button>
                          </div>
                          <div style={{ background: '#070a12', borderRadius: '6px', padding: '0.75rem', border: '1px solid rgba(255,255,255,0.05)' }}>
                            <pre style={{ margin: 0, fontSize: '0.75rem', color: '#d1d5db', whiteSpace: 'pre-wrap' }}>
                              {ep.expressCode}
                            </pre>
                          </div>
                        </div>

                        {/* cURL Example */}
                        <div>
                          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.35rem' }}>
                            <span style={{ fontSize: '0.75rem', color: '#34d399', fontWeight: '700' }}>cURL COMMAND</span>
                            <button
                              onClick={() => handleCopyCode(ep.curlExample, `curl_${ep.id}`)}
                              style={{ background: 'none', border: 'none', color: '#9ca3af', cursor: 'pointer', fontSize: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.2rem' }}
                            >
                              {copiedSection === `curl_${ep.id}` ? <Check size={12} style={{ color: '#10b981' }} /> : <Copy size={12} />}
                              {copiedSection === `curl_${ep.id}` ? 'Copied' : 'Copy'}
                            </button>
                          </div>
                          <div style={{ background: '#070a12', borderRadius: '6px', padding: '0.75rem', border: '1px solid rgba(255,255,255,0.05)' }}>
                            <pre style={{ margin: 0, fontSize: '0.75rem', color: '#38bdf8', whiteSpace: 'pre-wrap' }}>
                              {ep.curlExample}
                            </pre>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Tab Content 4: OpenAPI Spec */}
          {activeTab === 'openapi' && (
            <div className="glass-panel" style={{ padding: '1.5rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                  <h3 style={{ fontSize: '1.1rem', fontWeight: '700', color: '#f3f4f6' }}>
                    OpenAPI 3.0 Specification
                  </h3>
                  <div style={{ display: 'flex', background: 'rgba(0,0,0,0.3)', borderRadius: '6px', padding: '0.15rem' }}>
                    <button
                      onClick={() => setOpenApiFormat('yaml')}
                      style={{ background: openApiFormat === 'yaml' ? '#6366f1' : 'transparent', color: '#fff', border: 'none', borderRadius: '4px', padding: '0.2rem 0.6rem', fontSize: '0.75rem', cursor: 'pointer' }}
                    >
                      YAML
                    </button>
                    <button
                      onClick={() => setOpenApiFormat('json')}
                      style={{ background: openApiFormat === 'json' ? '#6366f1' : 'transparent', color: '#fff', border: 'none', borderRadius: '4px', padding: '0.2rem 0.6rem', fontSize: '0.75rem', cursor: 'pointer' }}
                    >
                      JSON
                    </button>
                  </div>
                </div>

                <button
                  onClick={() => handleCopyCode(openApiFormat === 'yaml' ? architecture.openApiYaml : JSON.stringify(architecture.openApiJson, null, 2), 'openapi')}
                  className="btn-secondary"
                  style={{ fontSize: '0.85rem' }}
                >
                  {copiedSection === 'openapi' ? <Check size={16} style={{ color: '#10b981' }} /> : <Copy size={16} />}
                  {copiedSection === 'openapi' ? 'Copied Spec!' : 'Copy Spec'}
                </button>
              </div>

              <div style={{ background: '#070a12', borderRadius: '8px', padding: '1rem', border: '1px solid rgba(255,255,255,0.05)', maxHeight: '650px', overflowY: 'auto' }}>
                <pre style={{ margin: 0, fontSize: '0.82rem', color: '#a5b4fc', whiteSpace: 'pre-wrap' }}>
                  {openApiFormat === 'yaml' ? architecture.openApiYaml : JSON.stringify(architecture.openApiJson, null, 2)}
                </pre>
              </div>
            </div>
          )}

          {/* Tab Content 5: JSON Schemas */}
          {activeTab === 'jsonschema' && (
            <div className="glass-panel" style={{ padding: '1.5rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
                <div>
                  <h3 style={{ fontSize: '1.1rem', fontWeight: '700', color: '#f3f4f6' }}>
                    JSON Validation Schemas (Draft-07)
                  </h3>
                  <p style={{ fontSize: '0.8rem', color: '#9ca3af' }}>
                    Validation definitions for body payload verification in API gateways or middleware.
                  </p>
                </div>
                <button
                  onClick={() => handleCopyCode(JSON.stringify(architecture.jsonSchemas, null, 2), 'json_all')}
                  className="btn-secondary"
                  style={{ fontSize: '0.85rem' }}
                >
                  {copiedSection === 'json_all' ? <Check size={16} style={{ color: '#10b981' }} /> : <Copy size={16} />}
                  {copiedSection === 'json_all' ? 'Copied Schemas!' : 'Copy All Schemas'}
                </button>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(380px, 1fr))', gap: '1.25rem' }}>
                {Object.entries(architecture.jsonSchemas).map(([modelName, schemaObj]) => (
                  <div key={modelName} className="glass-panel" style={{ padding: '1rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                      <span style={{ fontWeight: '700', color: '#fbbf24', fontSize: '0.95rem' }}>{modelName} Schema</span>
                      <button
                        onClick={() => handleCopyCode(JSON.stringify(schemaObj, null, 2), `json_${modelName}`)}
                        style={{ background: 'none', border: 'none', color: '#9ca3af', cursor: 'pointer', fontSize: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.2rem' }}
                      >
                        {copiedSection === `json_${modelName}` ? <Check size={12} style={{ color: '#10b981' }} /> : <Copy size={12} />}
                        {copiedSection === `json_${modelName}` ? 'Copied' : 'Copy'}
                      </button>
                    </div>
                    <div style={{ background: '#070a12', borderRadius: '6px', padding: '0.75rem', border: '1px solid rgba(255,255,255,0.05)', maxHeight: '300px', overflowY: 'auto' }}>
                      <pre style={{ margin: 0, fontSize: '0.78rem', color: '#38bdf8', whiteSpace: 'pre-wrap' }}>
                        {JSON.stringify(schemaObj, null, 2)}
                      </pre>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Tab Content 6: Sandbox Tester */}
          {activeTab === 'sandbox' && (
            <div className="glass-panel">
              <APITester simulationId={simulationId} endpoints={architecture.apiEndpoints} tables={architecture.tables} />
            </div>
          )}
        </main>
      )}

      {/* Footer */}
      <footer style={{ marginTop: 'auto', borderTop: '1px solid var(--border-color)', background: 'rgba(9, 13, 22, 0.9)', padding: '1.25rem 1.5rem', textAlign: 'center', fontSize: '0.8rem', color: '#6b7280' }}>
        <p>AI API Builder • Powered by Dynamic PostgreSQL Schema & REST API Generator Engine</p>
      </footer>

      {/* Modals */}
      <ApiKeyModal
        isOpen={isApiKeyModalOpen}
        onClose={() => setIsApiKeyModalOpen(false)}
        apiKey={apiKey}
        onSaveApiKey={handleSaveApiKey}
      />

      <ExportModal
        isOpen={isExportModalOpen}
        onClose={() => setIsExportModalOpen(false)}
        architecture={architecture}
      />
    </div>
  );
}
