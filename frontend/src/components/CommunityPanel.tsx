import React, { useEffect, useState } from 'react';
import { api } from '../api/client';

interface Props {
  community: any;
  onClose: () => void;
}

function AccessItem({ label, value }: { label: string; value: string }) {
  const colorClass =
    value === 'AVAILABLE' || value === 'OPERATIONAL' || value === 'NORMAL' ? 'good'
    : value === 'LIMITED' || value === 'DEGRADED' ? 'limited'
    : value === 'CRITICAL' ? 'critical'
    : 'none';
  return (
    <div className="infra-item">
      <div className="infra-item-label">{label}</div>
      <div className={`infra-item-value ${colorClass}`}>{value}</div>
    </div>
  );
}

function getScoreClass(score: number) {
  if (score <= 20) return 'score-connected';
  if (score <= 40) return 'score-low';
  if (score <= 60) return 'score-moderate';
  if (score <= 80) return 'score-high';
  return 'score-critical';
}

function getScoreLabel(score: number) {
  if (score <= 20) return { label: 'CONNECTED', color: 'var(--success)' };
  if (score <= 40) return { label: 'LOW RISK', color: 'var(--success)' };
  if (score <= 60) return { label: 'MODERATE', color: 'var(--warning)' };
  if (score <= 80) return { label: 'HIGH', color: 'var(--danger)' };
  return { label: 'CRITICAL ISOLATION', color: 'var(--critical)' };
}

function priorityColor(p: string) {
  switch (p) {
    case 'CRITICAL': return 'var(--critical)';
    case 'HIGH':     return 'var(--danger)';
    case 'MEDIUM':   return 'var(--warning)';
    default:         return 'var(--success)';
  }
}

export default function CommunityPanel({ community, onClose }: Props) {
  const [lifelineData, setLifelineData] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!community?.id) return;
    setLoading(true);
    api.getCommunityLifeline(community.id)
      .then(setLifelineData)
      .catch(() => setLifelineData(null))
      .finally(() => setLoading(false));
  }, [community?.id, community?.lifeline_loss_score]);

  const score = community.lifeline_loss_score ?? 25;
  const { label, color } = getScoreLabel(score);
  const scoreClass = getScoreClass(score);
  const factors = lifelineData?.lifeline_loss?.factors ?? [];
  const connectivity = lifelineData?.graph_connectivity;

  return (
    <div className="community-panel">
      <button className="community-panel-close" onClick={onClose}>✕</button>

      <div style={{ paddingTop: 4, paddingRight: 36 }}>
        {/* Header */}
        <div style={{ marginBottom: 12 }}>
          <div style={{ fontSize: 10, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 4 }}>
            Community
          </div>
          <div style={{ fontSize: 20, fontWeight: 800, color: 'var(--text-primary)' }}>
            {community.name}
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 6 }}>
            <span
              className="status-pill"
              style={{
                background: `${color}22`,
                color,
                border: `1px solid ${color}`,
                fontSize: 9,
                fontWeight: 700,
              }}
            >
              {community.status?.replace(/_/g, ' ')}
            </span>
            <span className="simulation-label">SIMULATION</span>
          </div>
        </div>

        <div className="divider" />

        {/* Lifeline Loss Score */}
        <div style={{ marginBottom: 16 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
            <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: 0.5 }}>
              Lifeline Loss Score
            </div>
            <div style={{ fontSize: 22, fontWeight: 800, fontFamily: 'var(--font-mono)', color }}>
              {score.toFixed(0)}<span style={{ fontSize: 13, color: 'var(--text-muted)' }}>/100</span>
            </div>
          </div>
          <div className="lifeline-score-bar">
            <div
              className={`lifeline-score-fill ${scoreClass}`}
              style={{ width: `${score}%` }}
            />
          </div>
          <div style={{ fontSize: 11, color, fontWeight: 700, marginTop: 4 }}>{label}</div>
        </div>

        {/* Factor breakdown */}
        {loading && <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>Calculating factors...</div>}
        {factors.length > 0 && (
          <div style={{ marginBottom: 16 }}>
            <div style={{ fontSize: 10, fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 8 }}>
              Score Breakdown
            </div>
            {factors.map((f: any) => (
              <div className="factor-row" key={f.name}>
                <div className="factor-name">{f.name}</div>
                <div className="factor-bar-wrap">
                  <div
                    className="factor-bar-fill"
                    style={{ width: `${(f.contribution / f.max_possible) * 100}%` }}
                  />
                </div>
                <div className="factor-score">+{f.contribution}</div>
              </div>
            ))}
          </div>
        )}

        <div className="divider" />

        {/* Infrastructure Access */}
        <div style={{ marginBottom: 16 }}>
          <div style={{ fontSize: 10, fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 8 }}>
            Access Status
          </div>
          <div className="infra-grid">
            <AccessItem label="Primary Road" value={community.road_connectivity > 0.5 ? 'AVAILABLE' : 'BLOCKED'} />
            <AccessItem label="Bridge" value={community.bridge_accessible ? 'ACCESSIBLE' : 'FAILED'} />
            <AccessItem label="Hospital" value={community.hospital_access || 'AVAILABLE'} />
            <AccessItem label="Shelter" value={community.shelter_access || 'AVAILABLE'} />
            <AccessItem label="Water" value={community.water_access || 'AVAILABLE'} />
            <AccessItem label="Communication" value={community.communication || 'NORMAL'} />
          </div>
        </div>

        {/* Graph Connectivity */}
        {connectivity && (
          <div style={{ marginBottom: 16 }}>
            <div style={{ fontSize: 10, fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 8 }}>
              Graph Connectivity
            </div>
            <div style={{
              background: connectivity.is_connected ? 'var(--success-dim)' : 'var(--critical-dim)',
              border: `1px solid ${connectivity.is_connected ? 'var(--success)' : 'var(--critical)'}`,
              borderRadius: 'var(--radius-sm)',
              padding: '8px 10px',
              fontSize: 12,
              color: connectivity.is_connected ? 'var(--success)' : 'var(--critical)',
              fontWeight: 600,
              marginBottom: 8,
            }}>
              {connectivity.is_connected ? '✓ CONNECTED TO NETWORK' : '✗ ISOLATED FROM NETWORK'}
            </div>
            <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>
              Reachable facilities: {connectivity.reachable_count}/{connectivity.total_facilities}
            </div>
            {connectivity.disconnected_facilities.length > 0 && (
              <div style={{ fontSize: 11, color: 'var(--critical)', marginTop: 4 }}>
                Disconnected: {connectivity.disconnected_facilities.join(', ')}
              </div>
            )}
          </div>
        )}

        {/* Needs */}
        {(community.needs || []).length > 0 && (
          <div style={{ marginBottom: 16 }}>
            <div style={{ fontSize: 10, fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 8 }}>
              Prioritised Needs
            </div>
            {(community.needs || []).map((need: any, i: number) => (
              <div key={i} style={{
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                padding: '7px 10px', background: 'var(--bg-card)', borderRadius: 'var(--radius-sm)',
                marginBottom: 5, border: '1px solid var(--border)',
              }}>
                <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-primary)' }}>{need.resource}</span>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>{need.quantity} units</span>
                  <span
                    className="tag"
                    style={{
                      background: `${priorityColor(need.priority)}22`,
                      color: priorityColor(need.priority),
                    }}
                  >
                    {need.priority}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Cause of isolation */}
        {(community.cause_of_isolation || []).length > 0 && (
          <div style={{ marginBottom: 16 }}>
            <div style={{ fontSize: 10, fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 8 }}>
              Cause of Isolation
            </div>
            {(community.cause_of_isolation || []).map((cause: string, i: number) => (
              <div key={i} style={{
                display: 'flex', alignItems: 'flex-start', gap: 8,
                fontSize: 12, color: 'var(--text-secondary)', marginBottom: 5,
              }}>
                <span style={{ color: 'var(--critical)', marginTop: 1 }}>•</span>
                {cause}
              </div>
            ))}
          </div>
        )}

        {/* Footer meta */}
        <div className="divider" />
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 10, color: 'var(--text-muted)' }}>
          <span>Pop: {community.population?.toLocaleString()}</span>
          <span>Alt Routes: {community.alternative_routes}</span>
          <span>⚡ SIMULATION</span>
        </div>
      </div>
    </div>
  );
}
