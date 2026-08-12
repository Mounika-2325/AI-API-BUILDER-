import React from 'react';
import { Key, Link2, Database, Table as TableIcon } from 'lucide-react';

export default function ERDViewer({ tables, relationships }) {
  if (!tables || tables.length === 0) return null;

  return (
    <div style={{ padding: '1.5rem' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.5rem' }}>
        <div>
          <h2 style={{ fontSize: '1.25rem', fontWeight: '700', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Database style={{ color: '#6366f1' }} size={22} /> Visual Entity-Relationship Diagram (ERD)
          </h2>
          <p style={{ color: '#9ca3af', fontSize: '0.875rem' }}>
            Normalized relational database structure with table constraints & foreign key references.
          </p>
        </div>
        <span style={{ fontSize: '0.75rem', background: 'rgba(99, 102, 241, 0.15)', color: '#a5b4fc', padding: '0.25rem 0.75rem', borderRadius: '9999px', border: '1px solid rgba(99, 102, 241, 0.3)' }}>
          {tables.length} Tables • {relationships.length} Relationships
        </span>
      </div>

      {/* Tables Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '1.5rem' }}>
        {tables.map(table => (
          <div key={table.name} className="glass-panel glass-panel-hover" style={{ overflow: 'hidden' }}>
            {/* Table Header */}
            <div style={{ padding: '0.85rem 1rem', background: 'rgba(255, 255, 255, 0.04)', borderBottom: '1px solid var(--border-color)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <TableIcon size={18} style={{ color: '#06b6d4' }} />
                <span style={{ fontWeight: '700', fontSize: '1rem', color: '#f3f4f6' }}>{table.name}</span>
                <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.75rem', color: '#9ca3af' }}>({table.sqlName})</span>
              </div>
              <span style={{ fontSize: '0.7rem', color: '#9ca3af', background: 'rgba(255, 255, 255, 0.06)', padding: '0.15rem 0.5rem', borderRadius: '4px' }}>
                {table.columns.length} cols
              </span>
            </div>

            {/* Table Description */}
            <div style={{ padding: '0.5rem 1rem', fontSize: '0.8rem', color: '#9ca3af', borderBottom: '1px solid rgba(255,255,255,0.03)' }}>
              {table.description}
            </div>

            {/* Columns List */}
            <div style={{ padding: '0.5rem 0' }}>
              {table.columns.map(col => (
                <div 
                  key={col.name} 
                  style={{ 
                    display: 'flex', 
                    alignItems: 'center', 
                    justifyContent: 'space-between', 
                    padding: '0.4rem 1rem',
                    fontSize: '0.85rem',
                    borderBottom: '1px solid rgba(255, 255, 255, 0.02)',
                    background: col.isPrimary ? 'rgba(99, 102, 241, 0.05)' : col.isForeign ? 'rgba(6, 182, 212, 0.05)' : 'transparent'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    {col.isPrimary ? (
                      <Key size={14} style={{ color: '#f59e0b' }} title="Primary Key" />
                    ) : col.isForeign ? (
                      <Link2 size={14} style={{ color: '#06b6d4' }} title={`Foreign Key -> ${col.references}`} />
                    ) : (
                      <span style={{ width: '14px' }} />
                    )}
                    <span style={{ fontFamily: 'var(--font-mono)', fontWeight: col.isPrimary || col.isForeign ? '600' : '400', color: col.isPrimary ? '#fbbf24' : col.isForeign ? '#38bdf8' : '#e5e7eb' }}>
                      {col.name}
                    </span>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.75rem', color: '#a5b4fc', background: 'rgba(0, 0, 0, 0.3)', padding: '0.1rem 0.4rem', borderRadius: '4px' }}>
                      {col.type}
                    </span>
                    {!col.nullable && !col.isPrimary && (
                      <span style={{ fontSize: '0.65rem', color: '#ef4444', fontWeight: '700' }} title="NOT NULL">NN</span>
                    )}
                  </div>
                </div>
              ))}
            </div>

            {/* Indexes footer */}
            {table.indexes && table.indexes.length > 0 && (
              <div style={{ padding: '0.5rem 1rem', background: 'rgba(0, 0, 0, 0.2)', borderTop: '1px solid var(--border-color)', fontSize: '0.75rem', color: '#6b7280' }}>
                <span style={{ fontWeight: '600', color: '#9ca3af' }}>Indexes: </span>
                {table.indexes.length} configured
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Relationships Legend Card */}
      {relationships && relationships.length > 0 && (
        <div className="glass-panel" style={{ marginTop: '1.5rem', padding: '1rem 1.25rem' }}>
          <h3 style={{ fontSize: '0.95rem', fontWeight: '700', marginBottom: '0.5rem', color: '#e5e7eb' }}>
            Foreign Key Relationships Map
          </h3>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '0.75rem' }}>
            {relationships.map((rel, idx) => (
              <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', background: 'rgba(0, 0, 0, 0.3)', padding: '0.5rem 0.75rem', borderRadius: '6px', fontSize: '0.85rem' }}>
                <span style={{ fontFamily: 'var(--font-mono)', color: '#38bdf8' }}>{rel.fromTable}.{rel.fromColumn}</span>
                <span style={{ color: '#9ca3af' }}>→</span>
                <span style={{ fontFamily: 'var(--font-mono)', color: '#a5b4fc' }}>{rel.toTable}.{rel.toColumn}</span>
                <span style={{ marginLeft: 'auto', fontSize: '0.7rem', color: '#6b7280', background: 'rgba(255,255,255,0.05)', padding: '0.1rem 0.4rem', borderRadius: '4px' }}>
                  {rel.type}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
