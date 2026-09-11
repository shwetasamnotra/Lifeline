import React, { useState } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { useSimulationStore } from '../store/simulationStore';

const navItems = [
  { path: '/',           icon: '⬡',  label: 'Command Centre' },
  { path: '/map',        icon: '🗺',  label: 'Live Disaster Map' },
  { path: '/isolation',  icon: '🔍', label: 'Isolation Intelligence' },
  { path: '/relief',     icon: '🚚', label: 'Relief Operations' },
  { path: '/routes',     icon: '↗',  label: 'Route Planner' },
  { path: '/historical', icon: '📊', label: 'Historical Analysis' },
  { path: '/simulator',  icon: '⚡', label: 'Scenario Simulator' },
  { path: '/system',     icon: '⚙',  label: 'System Status' },
];

export default function Sidebar() {
  const { simState, connected } = useSimulationStore();
  const alertCount = simState?.alerts?.length ?? 0;
  const criticalIsolated = simState?.kpi?.critically_isolated ?? 0;

  return (
    <nav className="sidebar">
      <div className="sidebar-logo">
        <div className="logo-title">LIFELINE 2.0</div>
        <div className="logo-sub">Disaster Isolation Intelligence</div>
        <div className="sim-badge">
          <span className="pulse-dot" />
          SIMULATION
        </div>
      </div>

      <div className="nav-section">
        <div className="nav-section-label">Navigation</div>
        {navItems.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            end={item.path === '/'}
            className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
          >
            <span className="nav-icon">{item.icon}</span>
            <span>{item.label}</span>
            {item.path === '/isolation' && criticalIsolated > 0 && (
              <span className="nav-badge">{criticalIsolated}</span>
            )}
            {item.path === '/' && alertCount > 0 && (
              <span className="nav-badge" style={{ background: 'var(--warning)' }}>
                {alertCount}
              </span>
            )}
          </NavLink>
        ))}
      </div>

      <div style={{ marginTop: 'auto', padding: '12px 16px', borderTop: '1px solid var(--border)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 11, color: 'var(--text-muted)' }}>
          <span
            className="status-dot"
            style={{
              background: connected ? 'var(--success)' : 'var(--critical)',
              animation: connected ? 'pulse 2s infinite' : 'none',
            }}
          />
          {connected ? 'LIVE FEED ACTIVE' : 'RECONNECTING...'}
        </div>
        <div style={{ fontSize: 10, color: 'var(--text-muted)', marginTop: 4 }}>
          SIH 2026 Prototype
        </div>
      </div>
    </nav>
  );
}
