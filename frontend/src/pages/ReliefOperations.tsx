import React, { useEffect, useState } from 'react';
import { api } from '../api/client';
import { useSimulationStore } from '../store/simulationStore';

function missionStatusColor(s: string) {
  switch (s) {
    case 'IN_TRANSIT':        return 'var(--accent)';
    case 'ROUTE_INTERRUPTED': return 'var(--critical)';
    case 'REROUTING':         return 'var(--warning)';
    case 'COMPLETED':         return 'var(--success)';
    default:                  return 'var(--text-muted)';
  }
}

export default function ReliefOperations() {
  const { simState } = useSimulationStore();
  const [communities, setCommunities] = useState<any[]>([]);
  const [missions, setMissions] = useState<any[]>([]);
  const [warehouses, setWarehouses] = useState<any[]>([]);
  const [routes, setRoutes] = useState<any[]>([]);

  useEffect(() => {
    Promise.all([
      api.getCommunities(),
      api.getMissions(),
      api.getWarehouses(),
      api.getRoutes(),
    ]).then(([c, m, w, r]) => {
      setCommunities(c);
      setMissions(m);
      setWarehouses(w);
      setRoutes(r);
    });
  }, [simState?.phase]);

  // Merge live state
  const mergedMissions = missions.map((m) => ({
    ...m,
    status: simState?.missionStatus?.[m.mission_code] || m.status,
    route_name: simState?.missionRoute?.[m.mission_code] || m.route_name,
  }));

  const mergedCommunities = communities.map((c) => {
    const live = simState?.communityStatus?.[c.name] || {};
    return { ...c, ...live };
  });

  const criticalCommunities = [...mergedCommunities]
    .filter((c) => (c.lifeline_loss_score ?? 0) > 20)
    .sort((a, b) => (b.lifeline_loss_score || 0) - (a.lifeline_loss_score || 0));

  const isRerouting = simState?.phase === 'rerouting';
  const isRouted = simState?.phase === 'rerouted';

  return (
    <div className="page-container">
      <div style={{ marginBottom: 20 }}>
        <h1 style={{ fontSize: 20, fontWeight: 800, color: 'var(--text-primary)', marginBottom: 4 }}>
          Relief Operations
        </h1>
        <p style={{ fontSize: 13, color: 'var(--text-secondary)' }}>
          Ranked relief priorities, resource matching, and active mission tracking.
        </p>
      </div>

      {isRerouting && (
        <div className="rerouting-banner" style={{ marginBottom: 16 }}>
          <span className="loading-spinner" />
          <span className="rerouting-text">
            ⚠ ROUTE INTERRUPTED — MISSION-001: Route C blocked. Recalculating via Route D (Northern Bypass)...
          </span>
        </div>
      )}

      {isRouted && (
        <div style={{
          background: 'var(--success-dim)', border: '1px solid var(--success)',
          borderRadius: 'var(--radius-md)', padding: '12px 16px',
          display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16,
          fontSize: 13, fontWeight: 600, color: 'var(--success)',
        }}>
          ✓ MISSION-001 REROUTED — Now via Route D (Northern Bypass, 22.1km)
        </div>
      )}

      {/* Active missions */}
      {mergedMissions.length > 0 && (
        <div style={{ marginBottom: 24 }}>
          <h2 style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-secondary)', letterSpacing: 0.8, textTransform: 'uppercase', marginBottom: 12 }}>
            Active Relief Missions
          </h2>
          <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
            {mergedMissions.map((m) => {
              const statusColor = missionStatusColor(m.status);
              const isInterrupted = m.status === 'ROUTE_INTERRUPTED' || m.status === 'REROUTING';
              return (
                <div
                  key={m.id}
                  className="card"
                  style={{
                    flex: '1 1 280px', maxWidth: 340,
                    borderColor: isInterrupted ? 'var(--critical)' : m.status === 'IN_TRANSIT' ? 'var(--accent)' : 'var(--border)',
                    transition: 'border-color 0.5s ease',
                  }}
                >
                  <div className="card-header">
                    <div style={{ fontWeight: 800, fontSize: 14, color: 'var(--accent)', fontFamily: 'var(--font-mono)' }}>
                      {m.mission_code}
                    </div>
                    <span style={{
                      fontSize: 10, fontWeight: 700, letterSpacing: 1,
                      color: statusColor, background: `${statusColor}22`,
                      padding: '2px 8px', borderRadius: 4, textTransform: 'uppercase',
                    }}>
                      {m.status.replace(/_/g, ' ')}
                    </span>
                  </div>
                  <div className="card-body">
                    <div style={{ fontSize: 12, marginBottom: 10 }}>
                      <div style={{ display: 'flex', gap: 8, marginBottom: 4 }}>
                        <span style={{ color: 'var(--text-muted)', width: 60 }}>FROM</span>
                        <span style={{ color: 'var(--text-primary)', fontWeight: 600 }}>{m.from_warehouse}</span>
                      </div>
                      <div style={{ display: 'flex', gap: 8, marginBottom: 4 }}>
                        <span style={{ color: 'var(--text-muted)', width: 60 }}>TO</span>
                        <span style={{ color: 'var(--text-primary)', fontWeight: 600 }}>{m.to_community}</span>
                      </div>
                      <div style={{ display: 'flex', gap: 8, marginBottom: 4 }}>
                        <span style={{ color: 'var(--text-muted)', width: 60 }}>ROUTE</span>
                        <span style={{ color: statusColor, fontWeight: 600 }}>{m.route_name}</span>
                      </div>
                    </div>
                    {(m.cargo || []).length > 0 && (
                      <div>
                        <div style={{ fontSize: 10, color: 'var(--text-muted)', marginBottom: 6, textTransform: 'uppercase', letterSpacing: 0.5 }}>Cargo</div>
                        {m.cargo.map((item: any, i: number) => (
                          <div key={i} style={{
                            display: 'flex', justifyContent: 'space-between',
                            fontSize: 11, padding: '3px 0', borderBottom: '1px solid var(--border)',
                            color: 'var(--text-secondary)',
                          }}>
                            <span>{item.resource}</span>
                            <span style={{ color: 'var(--accent)', fontFamily: 'var(--font-mono)' }}>{item.quantity.toLocaleString()} units</span>
                          </div>
                        ))}
                      </div>
                    )}
                    {isInterrupted && (
                      <div style={{
                        marginTop: 10, padding: '6px 10px',
                        background: 'var(--critical-dim)', border: '1px solid var(--critical)',
                        borderRadius: 'var(--radius-sm)', fontSize: 11, color: 'var(--critical)', fontWeight: 600,
                      }}>
                        ⚠ Route interrupted. System recalculating alternative route.
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Critical communities table */}
      <div style={{ marginBottom: 24 }}>
        <h2 style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-secondary)', letterSpacing: 0.8, textTransform: 'uppercase', marginBottom: 12 }}>
          Priority Communities — Relief Queue
        </h2>
        <div className="card">
          <div className="card-header">
            <div className="card-title">Ranked by Lifeline Loss Score</div>
            <span className="simulation-label">SIMULATION</span>
          </div>
          <div style={{ overflowX: 'auto' }}>
            <table className="data-table">
              <thead>
                <tr>
                  <th>#</th>
                  <th>Community</th>
                  <th>Lifeline Loss</th>
                  <th>Status</th>
                  <th>Main Need</th>
                  <th>Population</th>
                  <th>Alt Routes</th>
                </tr>
              </thead>
              <tbody>
                {criticalCommunities.map((c, i) => {
                  const score = c.lifeline_loss_score ?? 0;
                  const rowClass = i === 0 ? 'priority-1' : i === 1 ? 'priority-2' : 'priority-3';
                  const scoreColors: Record<string, string> = {
                    CONNECTED: 'var(--success)', AT_RISK: 'var(--warning)',
                    ISOLATED: 'var(--danger)', CRITICALLY_ISOLATED: 'var(--critical)',
                  };
                  const col = scoreColors[c.status] || 'var(--text-muted)';
                  const topNeed = (c.needs || []).find((n: any) => n.priority === 'CRITICAL') ||
                    (c.needs || [])[0];
                  return (
                    <tr key={c.id} className={rowClass}>
                      <td style={{ fontWeight: 800 }}>{i + 1}</td>
                      <td style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{c.name}</td>
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                          <span style={{ fontSize: 16, fontWeight: 800, color: col, fontFamily: 'var(--font-mono)' }}>
                            {score.toFixed(0)}
                          </span>
                          <div style={{ flex: 1, height: 4, background: 'var(--bg-elevated)', borderRadius: 2, overflow: 'hidden' }}>
                            <div style={{ height: '100%', width: `${score}%`, background: col, borderRadius: 2 }} />
                          </div>
                        </div>
                      </td>
                      <td>
                        <span style={{ fontSize: 10, fontWeight: 700, color: col, background: `${col}22`, padding: '2px 6px', borderRadius: 4 }}>
                          {c.status?.replace(/_/g, ' ')}
                        </span>
                      </td>
                      <td>
                        {topNeed ? (
                          <span style={{
                            color: topNeed.priority === 'CRITICAL' ? 'var(--critical)' : 'var(--warning)',
                            fontWeight: 600
                          }}>
                            {topNeed.resource} ({topNeed.priority})
                          </span>
                        ) : <span style={{ color: 'var(--success)' }}>None critical</span>}
                      </td>
                      <td style={{ fontFamily: 'var(--font-mono)' }}>{c.population?.toLocaleString()}</td>
                      <td style={{ fontFamily: 'var(--font-mono)', color: c.alternative_routes === 0 ? 'var(--critical)' : 'var(--success)' }}>
                        {c.alternative_routes}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Resource matching */}
      <div>
        <h2 style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-secondary)', letterSpacing: 0.8, textTransform: 'uppercase', marginBottom: 12 }}>
          Resource Inventory — Warehouse Availability
        </h2>
        <div className="two-col">
          {warehouses.map((w) => (
            <div key={w.id} className="card">
              <div className="card-header">
                <div className="card-title">🏭 {w.name}</div>
                <span style={{ fontSize: 10, color: 'var(--success)', fontWeight: 600 }}>{w.status}</span>
              </div>
              <div style={{ padding: '8px 12px' }}>
                {(w.resources || []).map((r: any) => (
                  <div className="resource-match-row" key={r.resource_type}>
                    <div style={{ width: 80, fontSize: 12, fontWeight: 600, color: 'var(--text-primary)', flexShrink: 0 }}>
                      {r.resource_type}
                    </div>
                    <div className="resource-bar-wrap">
                      <div
                        className="resource-bar-fill"
                        style={{ width: `${Math.min((r.quantity / 6000) * 100, 100)}%` }}
                      />
                    </div>
                    <div style={{ fontSize: 11, fontFamily: 'var(--font-mono)', color: 'var(--accent)', width: 70, textAlign: 'right', flexShrink: 0 }}>
                      {r.quantity.toLocaleString()}
                    </div>
                    <div style={{ fontSize: 9, color: 'var(--text-muted)', width: 30, flexShrink: 0 }}>
                      {r.unit}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
