import React, { useState } from 'react';
import { useLocation } from 'react-router-dom';
import { useSimulationStore } from '../store/simulationStore';

const pageTitles: Record<string, string> = {
  '/':           'Command Centre',
  '/map':        'Live Disaster Map',
  '/isolation':  'Isolation Intelligence',
  '/relief':     'Relief Operations',
  '/routes':     'Route Planner',
  '/historical': 'Historical Analysis',
  '/simulator':  'Scenario Simulator',
  '/system':     'System Status & Data Sources',
};

export default function TopHeader() {
  const location = useLocation();
  const { simState, connected } = useSimulationStore();
  const [search, setSearch] = useState('');

  const title = pageTitles[location.pathname] || 'LIFELINE 2.0';
  const phase = simState?.phase ?? 'baseline';
  const isSimulating = simState?.isRunning || (phase !== 'baseline' && phase !== undefined);

  return (
    <header className="top-header">
      <div className="header-title">{title}</div>

      <div style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 11 }}>
        <span
          className="status-dot"
          style={{ background: isSimulating ? 'var(--warning)' : 'var(--success)' }}
        />
        <span style={{ color: 'var(--text-muted)' }}>
          {isSimulating ? 'SIMULATION ACTIVE' : 'MONITORING'}
        </span>
      </div>

      <div className="header-spacer" />

      <div className="header-search">
        <span style={{ color: 'var(--text-muted)' }}>🔍</span>
        <input
          placeholder="Search communities, routes..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      <button className="header-btn">
        📍 Himachal Pradesh
      </button>

      <button className="header-btn">
        <span
          className="status-dot"
          style={{
            background: connected ? 'var(--success)' : 'var(--critical)',
            animation: 'pulse 2s infinite',
          }}
        />
        {connected ? 'LIVE' : 'OFFLINE'}
      </button>

      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 6,
          padding: '4px 10px',
          background: 'var(--warning-dim)',
          border: '1px solid var(--warning)',
          borderRadius: 'var(--radius-sm)',
          fontSize: 10,
          fontWeight: 700,
          color: 'var(--warning)',
          letterSpacing: 1,
        }}
      >
        ⚡ SIMULATION MODE
      </div>
    </header>
  );
}
