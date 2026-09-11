import React, { useEffect, useState, useCallback } from 'react';
import { api } from '../api/client';
import { useSimulationStore } from '../store/simulationStore';
import DisasterMap from '../components/DisasterMap';
import EventToast from '../components/EventToast';

function KPICard({
  label, value, sublabel, colorClass
}: { label: string; value: number | string; sublabel?: string; colorClass: string }) {
  return (
    <div className={`kpi-card ${colorClass}`}>
      <div className="kpi-label">{label}</div>
      <div className={`kpi-value ${colorClass}`}>{value}</div>
      {sublabel && <div className="kpi-sublabel">{sublabel}</div>}
    </div>
  );
}

function AlertFeed({ alerts }: { alerts: any[] }) {
  const shown = alerts.slice(0, 6);
  return (
    <div>
      {shown.length === 0 && (
        <div style={{ fontSize: 12, color: 'var(--text-muted)', padding: 12 }}>No active alerts.</div>
      )}
      {shown.map((a, i) => (
        <div key={a.id || i} className={`alert-item ${a.severity}`}>
          <div>
            <div className={`alert-severity ${a.severity}`}>{a.severity}</div>
          </div>
          <div className="alert-content">
            <div className="alert-title">{a.title}</div>
            <div className="alert-message">{a.message}</div>
            <div className="alert-meta">
              {a.location && <span>📍 {a.location}</span>}
              {a.recommended_action && (
                <span style={{ marginLeft: 8, color: 'var(--accent)' }}>▸ {a.recommended_action}</span>
              )}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

export default function CommandCentre() {
  const { simState } = useSimulationStore();
  const [communities, setCommunities] = useState<any[]>([]);
  const [infrastructure, setInfrastructure] = useState<any[]>([]);
  const [disasters, setDisasters] = useState<any[]>([]);
  const [routes, setRoutes] = useState<any[]>([]);
  const [alerts, setAlerts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchAll = useCallback(async () => {
    try {
      const [c, i, d, r, a] = await Promise.all([
        api.getCommunities(),
        api.getInfrastructure(),
        api.getDisasters(),
        api.getRoutes(),
        api.getAlerts(),
      ]);
      setCommunities(c);
      setInfrastructure(i);
      setDisasters(d);
      setRoutes(r);
      setAlerts(a);
    } catch (e) {
      console.error('Data fetch error', e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAll();
  }, [fetchAll]);

  // Refresh data when simulation state changes
  useEffect(() => {
    if (simState?.phase) {
      fetchAll();
    }
  }, [simState?.phase, fetchAll]);

  const kpi = simState?.kpi || {
    active_disasters: disasters.length,
    communities_at_risk: 0,
    critically_isolated: 0,
    critical_needs: 0,
    blocked_routes: 0,
    active_missions: 0,
  };

  const simAlerts = simState?.alerts || [];
  const allAlerts = [...simAlerts, ...alerts].slice(0, 8);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden' }}>
      <EventToast />

      {/* Differentiator Banner */}
      <div style={{
        padding: '10px 20px',
        background: 'linear-gradient(90deg, rgba(0,212,255,0.07), rgba(99,102,241,0.07))',
        borderBottom: '1px solid var(--border)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexShrink: 0,
      }}>
        <div>
          <span style={{ fontWeight: 800, color: 'var(--accent)', fontSize: 12, letterSpacing: 0.5 }}>
            "THE DISASTER IS VISIBLE. THE ISOLATION IT CREATES IS NOT."
          </span>
          <span style={{ marginLeft: 16, fontSize: 11, color: 'var(--text-secondary)' }}>
            LIFELINE 2.0 makes that invisible isolation measurable and actionable.
          </span>
        </div>
        <span className="simulation-label">SIMULATION</span>
      </div>

      {/* KPI Grid */}
      <div style={{ padding: '12px 20px 0', flexShrink: 0 }}>
        <div className="kpi-grid">
          <KPICard label="Active Disasters" value={kpi.active_disasters} sublabel="Monitoring" colorClass="orange" />
          <KPICard label="Communities At Risk" value={kpi.communities_at_risk} sublabel="Affected" colorClass="yellow" />
          <KPICard label="Critically Isolated" value={kpi.critically_isolated} sublabel="Immediate action" colorClass="red" />
          <KPICard label="Critical Needs" value={kpi.critical_needs} sublabel="Resources needed" colorClass="orange" />
          <KPICard label="Blocked Routes" value={kpi.blocked_routes} sublabel="Inaccessible" colorClass="red" />
          <KPICard label="Active Missions" value={kpi.active_missions} sublabel="In transit" colorClass="blue" />
        </div>
      </div>

      {/* Map + Alert feed */}
      <div style={{ flex: 1, display: 'flex', gap: 16, padding: '12px 20px 16px', overflow: 'hidden', minHeight: 0 }}>
        {/* Map */}
        <div className="map-container-wrap" style={{ flex: 1 }}>
          {loading ? (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', color: 'var(--text-muted)' }}>
              <span className="loading-spinner" style={{ marginRight: 8 }} />
              Loading map data...
            </div>
          ) : (
            <DisasterMap
              communities={communities}
              infrastructure={infrastructure}
              disasters={disasters}
              routes={routes}
            />
          )}
        </div>

        {/* Alert feed */}
        <div style={{ width: 340, flexShrink: 0, display: 'flex', flexDirection: 'column', gap: 12, overflowY: 'auto' }}>
          <div className="card" style={{ flex: 1, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
            <div className="card-header">
              <div className="card-title">
                <span style={{ color: 'var(--critical)' }}>●</span> Alert Feed
              </div>
              <span className="simulation-label">LIVE</span>
            </div>
            <div style={{ flex: 1, overflowY: 'auto', padding: 12 }}>
              <AlertFeed alerts={allAlerts} />
            </div>
          </div>

          {/* Quick community status */}
          <div className="card">
            <div className="card-header">
              <div className="card-title">Community Status</div>
            </div>
            <div style={{ padding: '8px 12px' }}>
              {communities.map((c) => {
                const live = simState?.communityStatus?.[c.name] || {};
                const merged = { ...c, ...live };
                const scoreColors: Record<string, string> = {
                  CONNECTED: 'var(--success)',
                  AT_RISK: 'var(--warning)',
                  ISOLATED: 'var(--danger)',
                  CRITICALLY_ISOLATED: 'var(--critical)',
                };
                const col = scoreColors[merged.status] || 'var(--text-muted)';
                return (
                  <div key={c.id} style={{
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                    padding: '7px 0', borderBottom: '1px solid var(--border)',
                  }}>
                    <div>
                      <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-primary)' }}>{c.name}</div>
                      <div style={{ fontSize: 10, color: col, fontWeight: 600, marginTop: 1 }}>
                        {merged.status?.replace(/_/g, ' ')}
                      </div>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <div style={{ fontSize: 16, fontWeight: 800, fontFamily: 'var(--font-mono)', color: col }}>
                        {(merged.lifeline_loss_score ?? c.lifeline_loss_score)?.toFixed(0)}
                      </div>
                      <div style={{ fontSize: 9, color: 'var(--text-muted)' }}>/ 100</div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
