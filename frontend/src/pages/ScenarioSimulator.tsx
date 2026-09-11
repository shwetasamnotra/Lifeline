import React, { useEffect, useState } from 'react';
import { api } from '../api/client';
import { useSimulationStore } from '../store/simulationStore';

function sevColor(s: string) {
  switch (s) {
    case 'CRITICAL': return 'var(--critical)';
    case 'HIGH':     return 'var(--danger)';
    case 'WARNING':  return 'var(--warning)';
    default:         return 'var(--info)';
  }
}

export default function ScenarioSimulator() {
  const { simState, eventHistory } = useSimulationStore();
  const [events, setEvents] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    api.getSimulationEvents().then(setEvents);
  }, []);

  const handleStart = async () => {
    setLoading(true);
    await api.startSimulation();
    setLoading(false);
  };

  const handlePause = async () => {
    await api.pauseSimulation();
  };

  const handleReset = async () => {
    setLoading(true);
    await api.resetSimulation();
    setLoading(false);
  };

  const handleStep = async () => {
    setLoading(true);
    await api.stepSimulation();
    setLoading(false);
  };

  const isRunning = simState?.isRunning;
  const currentStep = simState?.currentStep ?? 0;
  const phase = simState?.phase ?? 'baseline';
  const totalSteps = events.length;

  const kothiData = simState?.communityStatus?.['Kothi Village'];
  const score = kothiData?.lifeline_loss_score ?? 25;

  function getScoreColor(s: number) {
    if (s <= 20) return 'var(--success)';
    if (s <= 40) return '#4ade80';
    if (s <= 60) return 'var(--warning)';
    if (s <= 80) return 'var(--danger)';
    return 'var(--critical)';
  }

  return (
    <div className="page-container">
      {/* Banner */}
      <div style={{
        background: 'linear-gradient(135deg, rgba(239,68,68,0.1), rgba(245,158,11,0.1))',
        border: '1px solid rgba(239,68,68,0.3)',
        borderRadius: 'var(--radius-lg)',
        padding: '20px 24px',
        marginBottom: 24,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 8 }}>
          <span style={{ fontSize: 24 }}>⚡</span>
          <div>
            <div style={{ fontSize: 18, fontWeight: 800, color: 'var(--text-primary)' }}>
              KOTHI FLASH FLOOD — SIMULATION
            </div>
            <div style={{ fontSize: 12, color: 'var(--warning)', marginTop: 2 }}>
              ⚡ SIMULATION — This is a fictional demonstration scenario. Not verified real-world disaster data.
            </div>
          </div>
        </div>
        <div style={{ fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.6 }}>
          Step through the complete Kothi Flash Flood scenario. Each event updates the map, dashboard, alerts, 
          Lifeline Loss score, route recommendations, and relief missions in real-time.
          The scenario is deterministic — the same demo works every time.
        </div>
      </div>

      {/* Control Bar */}
      <div className="sim-control-bar">
        <button className="btn btn-success" onClick={handleStart} disabled={!!isRunning || loading}>
          ▶ START
        </button>
        <button className="btn btn-warning" onClick={handlePause} disabled={!isRunning || loading}>
          ⏸ PAUSE
        </button>
        <button className="btn btn-primary" onClick={handleStep} disabled={loading || currentStep >= totalSteps}>
          ↪ NEXT EVENT
        </button>
        <button className="btn btn-ghost" onClick={handleReset} disabled={loading}>
          ↺ RESET
        </button>
        <div className="sim-status-text">
          {loading ? (
            <><span className="loading-spinner" style={{ marginRight: 4 }} />Processing...</>
          ) : (
            `Step ${currentStep}/${totalSteps} • Phase: ${phase.toUpperCase().replace(/_/g, ' ')}`
          )}
        </div>
      </div>

      <div className="two-col" style={{ alignItems: 'start' }}>
        {/* Timeline */}
        <div>
          <div className="card">
            <div className="card-header">
              <div className="card-title">Scenario Timeline</div>
              <span className="simulation-label">KOTHI SCENARIO</span>
            </div>
            <div style={{ padding: '12px 16px' }}>
              <div className="timeline-list">
                {events.map((ev, idx) => {
                  const isPast = idx < currentStep;
                  const isCurrent = idx === currentStep - 1;
                  const isFuture = idx >= currentStep;
                  return (
                    <div className="timeline-item" key={ev.step_index}>
                      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 8, width: '100%' }}>
                        <div
                          className={`timeline-dot ${isCurrent ? 'active' : isPast ? 'past' : ev.severity}`}
                          style={{
                            background: isCurrent ? 'var(--accent)' : isPast ? 'var(--bg-elevated)' : sevColor(ev.severity),
                          }}
                        >
                          {isPast && !isCurrent ? '✓' : ''}
                        </div>
                        <div style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--text-muted)', width: 36, flexShrink: 0, paddingTop: 1 }}>
                          {ev.time_label}
                        </div>
                        <div style={{ flex: 1 }}>
                          <div style={{
                            fontSize: 13, fontWeight: 600,
                            color: isCurrent ? 'var(--accent)' : isPast ? 'var(--text-secondary)' : 'var(--text-primary)',
                          }}>
                            {ev.title}
                          </div>
                          {(isCurrent || isPast) && (
                            <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 3, lineHeight: 1.4 }}>
                              {ev.description}
                            </div>
                          )}
                        </div>
                        <div>
                          <span style={{
                            fontSize: 9, fontWeight: 700,
                            color: sevColor(ev.severity),
                            background: `${sevColor(ev.severity)}22`,
                            padding: '1px 5px', borderRadius: 3, letterSpacing: 0.5,
                          }}>
                            {ev.severity}
                          </span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>

        {/* Live State Panel */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {/* Kothi Score */}
          <div className="card">
            <div className="card-header">
              <div className="card-title">Kothi Village — Live Status</div>
            </div>
            <div className="card-body">
              <div style={{ display: 'flex', alignItems: 'center', gap: 20, marginBottom: 16 }}>
                <div style={{
                  width: 70, height: 70, borderRadius: '50%',
                  background: `${getScoreColor(score)}15`, border: `3px solid ${getScoreColor(score)}`,
                  display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                  flexShrink: 0, transition: 'all 0.8s ease',
                }}>
                  <span style={{ fontSize: 20, fontWeight: 800, fontFamily: 'var(--font-mono)', color: getScoreColor(score) }}>
                    {score.toFixed(0)}
                  </span>
                  <span style={{ fontSize: 9, color: 'var(--text-muted)' }}>/100</span>
                </div>
                <div>
                  <div style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 4 }}>LIFELINE LOSS SCORE</div>
                  <div style={{ fontWeight: 700, color: getScoreColor(score), fontSize: 14 }}>
                    {kothiData?.status?.replace(/_/g, ' ') || 'AT RISK'}
                  </div>
                  <div style={{ fontSize: 11, color: 'var(--text-secondary)', marginTop: 3 }}>
                    {phase === 'baseline' ? 'Normal operations' : `Phase: ${phase.replace(/_/g, ' ')}`}
                  </div>
                </div>
              </div>
              <div className="lifeline-score-bar" style={{ height: 10 }}>
                <div style={{
                  height: '100%', width: `${score}%`,
                  background: getScoreColor(score), borderRadius: 5,
                  transition: 'width 1s cubic-bezier(0.4,0,0.2,1), background 1s ease',
                }} />
              </div>
            </div>
          </div>

          {/* Infrastructure status */}
          <div className="card">
            <div className="card-header"><div className="card-title">Infrastructure Status</div></div>
            <div style={{ padding: '8px 12px' }}>
              {Object.entries({
                'Bridge B-03 (Kothi River)': simState?.infraStatus?.['Bridge B-03 (Kothi River)'] || 'OPERATIONAL',
                'Valley Road (Flood Zone)': simState?.infraStatus?.['Valley Road (Flood Zone)'] || 'OPERATIONAL',
                'Mountain Alternate Road': simState?.infraStatus?.['Mountain Alternate Road'] || 'OPERATIONAL',
              }).map(([name, status]) => (
                <div key={name} style={{
                  display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                  padding: '8px 0', borderBottom: '1px solid var(--border)',
                }}>
                  <span style={{ fontSize: 12, color: 'var(--text-secondary)' }}>{name}</span>
                  <span style={{
                    fontSize: 10, fontWeight: 700,
                    color: status === 'OPERATIONAL' ? 'var(--success)' : 'var(--critical)',
                    background: status === 'OPERATIONAL' ? 'var(--success-dim)' : 'var(--critical-dim)',
                    padding: '2px 6px', borderRadius: 4,
                  }}>
                    {status}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Route status */}
          <div className="card">
            <div className="card-header"><div className="card-title">Route Status</div></div>
            <div style={{ padding: '8px 12px' }}>
              {Object.entries({
                'Route A (Primary)': simState?.routeStatus?.['Route A (Primary)'] || 'VIABLE',
                'Route B (Valley Road)': simState?.routeStatus?.['Route B (Valley Road)'] || 'VIABLE',
                'Route C (Mountain Road)': simState?.routeStatus?.['Route C (Mountain Road)'] || 'VIABLE',
                'Route D (Northern Bypass)': simState?.routeStatus?.['Route D (Northern Bypass)'] || 'VIABLE',
              }).map(([name, status]) => {
                const col = status === 'VIABLE' ? 'var(--success)'
                  : status === 'RECOMMENDED' ? 'var(--accent)'
                  : 'var(--critical)';
                return (
                  <div key={name} style={{
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                    padding: '8px 0', borderBottom: '1px solid var(--border)',
                  }}>
                    <span style={{ fontSize: 12, color: 'var(--text-secondary)' }}>
                      {simState?.recommendedRoute === name && '★ '}{name}
                    </span>
                    <span style={{
                      fontSize: 10, fontWeight: 700, color: col,
                      background: `${col}22`, padding: '2px 6px', borderRadius: 4,
                    }}>
                      {status}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Recent events */}
          {eventHistory.length > 0 && (
            <div className="card">
              <div className="card-header"><div className="card-title">Recent Events</div></div>
              <div style={{ padding: '8px 12px', maxHeight: 200, overflowY: 'auto' }}>
                {[...eventHistory].reverse().slice(0, 5).map((ev, i) => (
                  <div key={i} style={{
                    padding: '6px 0', borderBottom: '1px solid var(--border)',
                    fontSize: 12, color: 'var(--text-secondary)',
                  }}>
                    <div style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{ev.title}</div>
                    <div style={{ fontSize: 10, color: 'var(--text-muted)', marginTop: 2 }}>
                      {ev.time_label} • {ev.severity}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Compound disaster note */}
      <div className="card" style={{ marginTop: 24 }}>
        <div className="card-header">
          <div className="card-title">Compound Disaster Impact Model</div>
        </div>
        <div className="card-body">
          <div style={{ fontSize: 12, color: 'var(--text-secondary)', marginBottom: 16 }}>
            LIFELINE 2.0 models how multiple simultaneous failures compound isolation:
          </div>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 16 }}>
            {['Flash Flood', 'Bridge Failure', 'Road Inundation', 'Hospital Reduced Access', 'Water Supply Disruption'].map((h) => (
              <span key={h} className="hazard-chip">{h}</span>
            ))}
          </div>
          <div style={{ fontSize: 12, color: 'var(--text-secondary)', lineHeight: 1.6 }}>
            Each hazard independently raises the Lifeline Loss Score. Combined, they compound to CRITICAL ISOLATION (87/100),
            which is not predictable from individual hazard scores alone. This is the core innovation of LIFELINE 2.0.
          </div>
        </div>
      </div>
    </div>
  );
}
