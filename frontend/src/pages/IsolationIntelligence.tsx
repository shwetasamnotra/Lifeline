import React, { useEffect, useState } from 'react';
import { api } from '../api/client';
import { useSimulationStore } from '../store/simulationStore';
import EventToast from '../components/EventToast';

function getScoreColor(score: number) {
  if (score <= 20) return 'var(--success)';
  if (score <= 40) return '#4ade80';
  if (score <= 60) return 'var(--warning)';
  if (score <= 80) return 'var(--danger)';
  return 'var(--critical)';
}

function getScoreLabel(score: number) {
  if (score <= 20) return 'CONNECTED';
  if (score <= 40) return 'LOW RISK';
  if (score <= 60) return 'MODERATE';
  if (score <= 80) return 'HIGH';
  return 'CRITICAL ISOLATION';
}

function needPriorityColor(p: string) {
  switch (p) {
    case 'CRITICAL': return 'var(--critical)';
    case 'HIGH': return 'var(--danger)';
    case 'MEDIUM': return 'var(--warning)';
    default: return 'var(--success)';
  }
}

export default function IsolationIntelligence() {
  const { simState } = useSimulationStore();
  const [communities, setCommunities] = useState<any[]>([]);
  const [selected, setSelected] = useState<number | null>(null);
  const [lifelineData, setLifelineData] = useState<any>(null);

  useEffect(() => {
    api.getCommunities().then(setCommunities);
  }, [simState?.phase]);

  useEffect(() => {
    if (selected !== null) {
      api.getCommunityLifeline(selected).then(setLifelineData);
    }
  }, [selected, simState?.phase]);

  const sortedCommunities = [...communities].sort(
    (a, b) => {
      const liveA = simState?.communityStatus?.[a.name]?.lifeline_loss_score ?? a.lifeline_loss_score;
      const liveB = simState?.communityStatus?.[b.name]?.lifeline_loss_score ?? b.lifeline_loss_score;
      return liveB - liveA;
    }
  );

  const isRerouting = simState?.phase === 'rerouting';

  return (
    <div className="page-container">
      <EventToast />

      {isRerouting && (
        <div className="rerouting-banner">
          <span className="loading-spinner" />
          <span className="rerouting-text">⚠ ROUTE CHANGE — System recalculating. NEW RECOMMENDED ROUTE: Route D (Northern Bypass)</span>
        </div>
      )}

      <div style={{ marginBottom: 20 }}>
        <h1 style={{ fontSize: 20, fontWeight: 800, color: 'var(--text-primary)', marginBottom: 4 }}>
          Isolation Intelligence
        </h1>
        <p style={{ fontSize: 13, color: 'var(--text-secondary)' }}>
          Graph-based connectivity analysis. Communities are checked against the regional infrastructure graph using BFS.
          Lifeline Loss is calculated algorithmically from weighted infrastructure factors.
        </p>
      </div>

      <div className="two-col" style={{ alignItems: 'start' }}>
        {/* Community ranking */}
        <div>
          <div className="card">
            <div className="card-header">
              <div className="card-title">Communities — Ranked by Isolation Risk</div>
              <span className="simulation-label">SIMULATION</span>
            </div>
            <div style={{ padding: '8px 0' }}>
              {sortedCommunities.map((c, idx) => {
                const live = simState?.communityStatus?.[c.name] || {};
                const merged = { ...c, ...live };
                const score = merged.lifeline_loss_score ?? c.lifeline_loss_score;
                const color = getScoreColor(score);
                const lbl = getScoreLabel(score);
                const isSelected = selected === c.id;

                return (
                  <div
                    key={c.id}
                    onClick={() => setSelected(isSelected ? null : c.id)}
                    style={{
                      display: 'flex', alignItems: 'center', gap: 12,
                      padding: '12px 16px',
                      cursor: 'pointer',
                      background: isSelected ? 'var(--bg-card-hover)' : 'transparent',
                      borderLeft: `3px solid ${isSelected ? color : 'transparent'}`,
                      borderBottom: '1px solid var(--border)',
                      transition: 'all 0.15s',
                    }}
                  >
                    <div style={{
                      width: 28, height: 28, borderRadius: '50%',
                      background: `${color}22`, border: `2px solid ${color}`,
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontSize: 11, fontWeight: 700, color, flexShrink: 0,
                    }}>
                      {idx + 1}
                    </div>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)' }}>{c.name}</div>
                      <div style={{ fontSize: 10, color, fontWeight: 600, marginTop: 1 }}>
                        {merged.status?.replace(/_/g, ' ')} • {lbl}
                      </div>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <div style={{ fontSize: 22, fontWeight: 800, fontFamily: 'var(--font-mono)', color }}>
                        {score?.toFixed(0)}
                      </div>
                      <div style={{ fontSize: 9, color: 'var(--text-muted)' }}>/ 100</div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Lifeline Loss formula explanation */}
          <div className="card" style={{ marginTop: 16 }}>
            <div className="card-header">
              <div className="card-title">Lifeline Loss Engine — How it Works</div>
            </div>
            <div className="card-body" style={{ fontSize: 12, color: 'var(--text-secondary)', lineHeight: 1.7 }}>
              <p>The Lifeline Loss Score is a weighted sum of infrastructure failure factors, calculated algorithmically:</p>
              <div style={{ marginTop: 12, fontFamily: 'var(--font-mono)', fontSize: 11 }}>
                {[
                  { name: 'Road Connectivity', weight: 25 },
                  { name: 'Bridge Failure', weight: 20 },
                  { name: 'Hospital Access', weight: 15 },
                  { name: 'Water Disruption', weight: 15 },
                  { name: 'Alternative Routes', weight: 10 },
                  { name: 'Communication Status', weight: 8 },
                  { name: 'Shelter Access', weight: 7 },
                ].map(f => (
                  <div key={f.name} style={{ display: 'flex', justifyContent: 'space-between', padding: '3px 0', borderBottom: '1px solid var(--border)' }}>
                    <span>{f.name}</span>
                    <span style={{ color: 'var(--accent)' }}>max {f.weight}</span>
                  </div>
                ))}
                <div style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', fontWeight: 700, color: 'var(--text-primary)', marginTop: 4 }}>
                  <span>TOTAL</span>
                  <span style={{ color: 'var(--accent)' }}>100</span>
                </div>
              </div>
              <p style={{ marginTop: 10, fontSize: 11, color: 'var(--text-muted)' }}>
                Graph connectivity is verified independently using BFS from the community node to essential facilities (hospitals, warehouses, water). 
                A community is isolated when no operational path exists to any essential facility.
              </p>
            </div>
          </div>
        </div>

        {/* Detail panel */}
        <div>
          {!selected && (
            <div className="card">
              <div className="card-body" style={{ textAlign: 'center', padding: 40, color: 'var(--text-muted)' }}>
                <div style={{ fontSize: 32, marginBottom: 12 }}>🔍</div>
                <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 4 }}>Select a Community</div>
                <div style={{ fontSize: 12 }}>Click a community to see the full Lifeline Loss breakdown and connectivity analysis.</div>
              </div>
            </div>
          )}

          {selected && lifelineData && (() => {
            const { community: c, lifeline_loss: ll, graph_connectivity: gc } = lifelineData;
            const score = ll?.score ?? c.lifeline_loss_score;
            const color = getScoreColor(score);
            return (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                {/* Score overview */}
                <div className="card">
                  <div className="card-header">
                    <div className="card-title">{c.name}</div>
                    <span className="simulation-label">SIMULATION</span>
                  </div>
                  <div className="card-body">
                    <div style={{ display: 'flex', alignItems: 'center', gap: 20, marginBottom: 16 }}>
                      <div style={{
                        width: 80, height: 80, borderRadius: '50%',
                        background: `${color}15`, border: `3px solid ${color}`,
                        display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                        flexShrink: 0,
                      }}>
                        <span style={{ fontSize: 22, fontWeight: 800, fontFamily: 'var(--font-mono)', color }}>
                          {score?.toFixed(0)}
                        </span>
                        <span style={{ fontSize: 9, color: 'var(--text-muted)' }}>/100</span>
                      </div>
                      <div>
                        <div style={{ fontSize: 16, fontWeight: 700, color }}>{ll?.label}</div>
                        <div style={{ fontSize: 12, color: 'var(--text-secondary)', marginTop: 4, lineHeight: 1.5 }}>
                          {ll?.interpretation}
                        </div>
                      </div>
                    </div>

                    <div className="lifeline-score-bar" style={{ height: 10 }}>
                      <div
                        style={{
                          height: '100%', width: `${score}%`,
                          background: color, borderRadius: 5,
                          transition: 'width 1s ease',
                        }}
                      />
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 9, color: 'var(--text-muted)', marginTop: 4 }}>
                      <span>0 CONNECTED</span><span>20</span><span>40</span><span>60</span><span>80</span><span>100 CRITICAL</span>
                    </div>
                  </div>
                </div>

                {/* Factor breakdown */}
                <div className="card">
                  <div className="card-header"><div className="card-title">Score Factor Breakdown</div></div>
                  <div className="card-body">
                    {(ll?.factors || []).map((f: any) => (
                      <div className="factor-row" key={f.name}>
                        <div className="factor-name">{f.name}</div>
                        <div className="factor-bar-wrap">
                          <div
                            className="factor-bar-fill"
                            style={{ width: `${(f.contribution / f.max_possible) * 100}%`, background: color }}
                          />
                        </div>
                        <div className="factor-score">+{f.contribution}</div>
                        <div style={{ fontSize: 10, color: 'var(--text-muted)', width: 50 }}>/{f.max_possible}</div>
                      </div>
                    ))}
                    <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 8, paddingTop: 8, borderTop: '1px solid var(--border)', fontSize: 13, fontWeight: 700 }}>
                      <span style={{ color: 'var(--text-secondary)', marginRight: 8 }}>TOTAL</span>
                      <span style={{ color, fontFamily: 'var(--font-mono)' }}>{score?.toFixed(1)} / 100</span>
                    </div>
                  </div>
                </div>

                {/* Graph connectivity */}
                {gc && (
                  <div className="card">
                    <div className="card-header"><div className="card-title">Graph Connectivity (BFS)</div></div>
                    <div className="card-body">
                      <div style={{
                        background: gc.is_connected ? 'var(--success-dim)' : 'var(--critical-dim)',
                        border: `1px solid ${gc.is_connected ? 'var(--success)' : 'var(--critical)'}`,
                        borderRadius: 'var(--radius-sm)',
                        padding: '10px 14px',
                        marginBottom: 12,
                        fontSize: 13,
                        fontWeight: 700,
                        color: gc.is_connected ? 'var(--success)' : 'var(--critical)',
                      }}>
                        {gc.is_connected ? '✓ CONNECTED TO NETWORK' : '✗ ISOLATED FROM NETWORK'}
                      </div>
                      <div style={{ fontSize: 12, color: 'var(--text-secondary)', marginBottom: 8 }}>
                        Reachable essential facilities: {gc.reachable_count}/{gc.total_facilities}
                      </div>
                      {gc.disconnected_facilities.length > 0 && (
                        <div>
                          <div style={{ fontSize: 10, color: 'var(--text-muted)', marginBottom: 4 }}>DISCONNECTED:</div>
                          {gc.disconnected_facilities.map((f: string) => (
                            <div key={f} style={{ fontSize: 11, color: 'var(--critical)', marginBottom: 3 }}>
                              ✗ {f.replace(/_/g, ' ').toUpperCase()}
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Needs */}
                {(c.needs || []).length > 0 && (
                  <div className="card">
                    <div className="card-header"><div className="card-title">Prioritised Needs</div></div>
                    <div style={{ padding: '8px 12px' }}>
                      {c.needs.map((n: any, i: number) => (
                        <div key={i} style={{
                          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                          padding: '8px 0', borderBottom: '1px solid var(--border)',
                        }}>
                          <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)' }}>{n.resource}</span>
                          <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
                            <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>{n.quantity} units</span>
                            <span className="tag" style={{
                              background: `${needPriorityColor(n.priority)}22`,
                              color: needPriorityColor(n.priority),
                            }}>{n.priority}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            );
          })()}
        </div>
      </div>
    </div>
  );
}
