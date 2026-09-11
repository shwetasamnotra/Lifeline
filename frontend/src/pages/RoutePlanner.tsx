import React, { useEffect, useState } from 'react';
import { api } from '../api/client';
import { useSimulationStore } from '../store/simulationStore';

function routeStatusColor(s: string) {
  switch (s) {
    case 'RECOMMENDED': return 'var(--accent)';
    case 'VIABLE':      return 'var(--success)';
    case 'BLOCKED':
    case 'REJECTED':    return 'var(--critical)';
    default:            return 'var(--text-muted)';
  }
}

function riskColor(r: string) {
  switch (r) {
    case 'LOW':      return 'var(--success)';
    case 'MEDIUM':   return 'var(--warning)';
    case 'HIGH':     return 'var(--danger)';
    case 'CRITICAL': return 'var(--critical)';
    default:         return 'var(--text-muted)';
  }
}

export default function RoutePlanner() {
  const { simState } = useSimulationStore();
  const [routes, setRoutes] = useState<any[]>([]);
  const [optimizeResult, setOptimizeResult] = useState<any>(null);
  const [optimizing, setOptimizing] = useState(false);

  useEffect(() => {
    api.getRoutes().then(setRoutes);
  }, [simState?.phase]);

  const mergedRoutes = routes.map((r) => ({
    ...r,
    status: simState?.routeStatus?.[r.name] || r.status,
    rejection_reason: simState?.routeRejectionReasons?.[r.name] || r.rejection_reason,
    is_recommended: simState?.recommendedRoute === r.name,
  }));

  const handleOptimize = async () => {
    setOptimizing(true);
    try {
      const result = await api.optimizeRoute('warehouse_alpha', 'community_kothi');
      setOptimizeResult(result);
    } catch (e) {
      setOptimizeResult({ viable: false, message: 'Optimization engine error.' });
    } finally {
      setOptimizing(false);
    }
  };

  const isRerouting = simState?.phase === 'rerouting' || simState?.phase === 'rerouted';

  return (
    <div className="page-container">
      <div style={{ marginBottom: 20 }}>
        <h1 style={{ fontSize: 20, fontWeight: 800, color: 'var(--text-primary)', marginBottom: 4 }}>
          Route Planner
        </h1>
        <p style={{ fontSize: 13, color: 'var(--text-secondary)' }}>
          Route evaluation using Dijkstra's algorithm on the live infrastructure graph.
          Routes are assessed by distance, road/bridge status, flood risk, and reliability.
        </p>
      </div>

      {isRerouting && (
        <div className="rerouting-banner" style={{ marginBottom: 16 }}>
          <span style={{ fontSize: 18 }}>⚠</span>
          <div>
            <div style={{ fontWeight: 700, color: 'var(--critical)' }}>ROUTE CHANGE DETECTED</div>
            <div style={{ fontSize: 12, color: 'var(--text-secondary)', marginTop: 2 }}>
              Route C has become inaccessible due to new flooding. System automatically rerouted to Route D.
            </div>
          </div>
        </div>
      )}

      <div style={{ marginBottom: 16 }}>
        <div className="viable-disclaimer">
          ⚠ Routes are evaluated as "CURRENTLY VIABLE" based on current data. Verify conditions before deployment.
          Road/bridge status may change rapidly during active disasters.
        </div>
      </div>

      {/* Route cards */}
      <div style={{ marginBottom: 24 }}>
        {mergedRoutes.map((route) => {
          const color = routeStatusColor(route.status);
          const isRec = route.is_recommended;
          const isRej = route.status === 'REJECTED' || route.status === 'BLOCKED';
          return (
            <div
              key={route.id}
              className={`route-card ${isRec ? 'recommended' : ''} ${isRej ? 'rejected' : ''}`}
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  {isRec && <span style={{ fontSize: 16 }}>★</span>}
                  <div>
                    <div style={{ fontWeight: 700, fontSize: 15, color: isRec ? 'var(--accent)' : 'var(--text-primary)' }}>
                      {route.name}
                    </div>
                    <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 1 }}>
                      {route.from_node} → {route.to_node}
                    </div>
                  </div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontSize: 10, fontWeight: 700, color, background: `${color}22`, padding: '3px 8px', borderRadius: 4, letterSpacing: 1, textTransform: 'uppercase' }}>
                    {isRec ? 'CURRENTLY VIABLE ★' : route.status}
                  </div>
                  {route.rejection_reason && (
                    <div style={{ fontSize: 10, color: 'var(--critical)', marginTop: 4 }}>
                      ✗ {route.rejection_reason}
                    </div>
                  )}
                </div>
              </div>

              <div style={{ display: 'flex', gap: 20, marginBottom: 12, fontSize: 12 }}>
                <div>
                  <div style={{ color: 'var(--text-muted)', fontSize: 10, marginBottom: 2 }}>DISTANCE</div>
                  <div style={{ fontWeight: 700, fontFamily: 'var(--font-mono)', color: 'var(--text-primary)' }}>
                    {route.distance_km} km
                  </div>
                </div>
                <div>
                  <div style={{ color: 'var(--text-muted)', fontSize: 10, marginBottom: 2 }}>RISK</div>
                  <div style={{ fontWeight: 700, color: riskColor(route.risk_level) }}>
                    {route.risk_level}
                  </div>
                </div>
                <div>
                  <div style={{ color: 'var(--text-muted)', fontSize: 10, marginBottom: 2 }}>CONFIDENCE</div>
                  <div style={{ fontWeight: 700, color: 'var(--text-primary)' }}>
                    {((route.confidence || 0) * 100).toFixed(0)}%
                  </div>
                </div>
              </div>

              {/* Waypoints */}
              {(route.waypoints || []).length > 0 && (
                <div className="route-waypoints">
                  {route.waypoints.map((wp: any, i: number) => (
                    <React.Fragment key={i}>
                      <div className="waypoint-item">
                        <div className="waypoint-dot" style={{
                          background: i === 0 || i === route.waypoints.length - 1 ? color : 'var(--text-muted)'
                        }} />
                        <span style={{ color: 'var(--text-primary)', fontWeight: i === 0 || i === route.waypoints.length - 1 ? 600 : 400 }}>
                          {wp.label}
                        </span>
                      </div>
                      {i < route.waypoints.length - 1 && (
                        <div className="waypoint-item" style={{ paddingLeft: 0 }}>
                          <div className="waypoint-line" style={{ marginLeft: 3, background: isRej ? 'var(--critical)' : 'var(--border)' }} />
                        </div>
                      )}
                    </React.Fragment>
                  ))}
                </div>
              )}

              {isRec && (
                <div className="viable-disclaimer" style={{ marginTop: 8 }}>
                  Currently viable — verify conditions before deployment. Route status subject to change.
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Dijkstra optimization */}
      <div className="card">
        <div className="card-header">
          <div className="card-title">Live Route Optimisation (Dijkstra)</div>
          <span className="simulation-label">ALGORITHM</span>
        </div>
        <div className="card-body">
          <p style={{ fontSize: 12, color: 'var(--text-secondary)', marginBottom: 12 }}>
            Run Dijkstra's algorithm on the current infrastructure graph (Warehouse Alpha → Kothi Village).
            Edge weights reflect distance × risk multiplier. Blocked/failed edges are excluded.
          </p>
          <button className="btn btn-primary" onClick={handleOptimize} disabled={optimizing}>
            {optimizing ? <><span className="loading-spinner" /> Optimizing...</> : '▶ Run Dijkstra Optimisation'}
          </button>

          {optimizeResult && (
            <div style={{ marginTop: 16 }}>
              {optimizeResult.viable ? (
                <div>
                  <div style={{
                    background: 'var(--success-dim)', border: '1px solid var(--success)',
                    borderRadius: 'var(--radius-sm)', padding: '10px 14px', marginBottom: 12,
                    fontSize: 13, fontWeight: 700, color: 'var(--success)',
                  }}>
                    ✓ OPTIMAL VIABLE PATH FOUND
                  </div>
                  <div style={{ display: 'flex', gap: 20, marginBottom: 12, fontSize: 12 }}>
                    <div>
                      <div style={{ color: 'var(--text-muted)', fontSize: 10 }}>ACTUAL DISTANCE</div>
                      <div style={{ fontWeight: 700, fontFamily: 'var(--font-mono)', color: 'var(--accent)' }}>
                        {optimizeResult.actual_distance_km} km
                      </div>
                    </div>
                    <div>
                      <div style={{ color: 'var(--text-muted)', fontSize: 10 }}>MAX RISK</div>
                      <div style={{ fontWeight: 700, color: riskColor(optimizeResult.risk_level) }}>
                        {optimizeResult.risk_level}
                      </div>
                    </div>
                    <div>
                      <div style={{ color: 'var(--text-muted)', fontSize: 10 }}>NODES</div>
                      <div style={{ fontWeight: 700, color: 'var(--text-primary)' }}>
                        {(optimizeResult.path || []).length}
                      </div>
                    </div>
                  </div>
                  <div style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 8 }}>Path:</div>
                  <div style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--text-secondary)' }}>
                    {(optimizeResult.path || []).join(' → ')}
                  </div>
                  <div className="viable-disclaimer" style={{ marginTop: 8 }}>
                    {optimizeResult.disclaimer}
                  </div>
                </div>
              ) : (
                <div style={{
                  background: 'var(--critical-dim)', border: '1px solid var(--critical)',
                  borderRadius: 'var(--radius-sm)', padding: '10px 14px',
                  fontSize: 13, fontWeight: 700, color: 'var(--critical)',
                }}>
                  ✗ {optimizeResult.message}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
