import React, { useEffect, useState } from 'react';
import { api } from '../api/client';

const DISASTER_TYPES = ['', 'flood', 'earthquake', 'landslide', 'cyclone'];
const YEARS = [0, 2023, 2022, 2021, 2018, 2013];

export default function HistoricalAnalysis() {
  const [events, setEvents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterType, setFilterType] = useState('');
  const [filterYear, setFilterYear] = useState(0);
  const [filterRegion, setFilterRegion] = useState('');

  const fetchData = () => {
    setLoading(true);
    api.getHistorical({
      disaster_type: filterType || undefined,
      year: filterYear || undefined,
      region: filterRegion || undefined,
    }).then((data) => {
      setEvents(data);
      setLoading(false);
    });
  };

  useEffect(() => { fetchData(); }, []);

  const handleFilter = () => fetchData();

  return (
    <div className="page-container">
      <div style={{ marginBottom: 20 }}>
        <h1 style={{ fontSize: 20, fontWeight: 800, color: 'var(--text-primary)', marginBottom: 4 }}>
          Historical Analysis
        </h1>
        <p style={{ fontSize: 13, color: 'var(--text-secondary)' }}>
          Verified historical disaster data. All statistics are sourced from official government and international reports.
          No statistics have been fabricated. Sources cited for each event.
        </p>
        <div style={{
          marginTop: 8, padding: '6px 12px',
          background: 'var(--info-dim)', border: '1px solid var(--info)',
          borderRadius: 'var(--radius-sm)', display: 'inline-flex', alignItems: 'center', gap: 6,
          fontSize: 11, color: 'var(--info)',
        }}>
          ℹ HISTORICAL DATA — All figures sourced from official reports (NDMA, KSDMA, ASDMA, NDRF)
        </div>
      </div>

      {/* Filters */}
      <div className="card" style={{ marginBottom: 20 }}>
        <div className="card-header"><div className="card-title">Filter Events</div></div>
        <div className="card-body" style={{ display: 'flex', gap: 12, flexWrap: 'wrap', alignItems: 'flex-end' }}>
          <div>
            <div style={{ fontSize: 10, color: 'var(--text-muted)', marginBottom: 4 }}>DISASTER TYPE</div>
            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
              style={{ background: 'var(--bg-input)', border: '1px solid var(--border)', color: 'var(--text-primary)', padding: '6px 10px', borderRadius: 'var(--radius-sm)', fontFamily: 'var(--font-base)', fontSize: 13 }}
            >
              {DISASTER_TYPES.map((t) => <option key={t} value={t}>{t || 'All Types'}</option>)}
            </select>
          </div>
          <div>
            <div style={{ fontSize: 10, color: 'var(--text-muted)', marginBottom: 4 }}>YEAR</div>
            <select
              value={filterYear}
              onChange={(e) => setFilterYear(Number(e.target.value))}
              style={{ background: 'var(--bg-input)', border: '1px solid var(--border)', color: 'var(--text-primary)', padding: '6px 10px', borderRadius: 'var(--radius-sm)', fontFamily: 'var(--font-base)', fontSize: 13 }}
            >
              {YEARS.map((y) => <option key={y} value={y}>{y || 'All Years'}</option>)}
            </select>
          </div>
          <div>
            <div style={{ fontSize: 10, color: 'var(--text-muted)', marginBottom: 4 }}>REGION</div>
            <input
              value={filterRegion}
              onChange={(e) => setFilterRegion(e.target.value)}
              placeholder="e.g. Kerala"
              style={{ background: 'var(--bg-input)', border: '1px solid var(--border)', color: 'var(--text-primary)', padding: '6px 10px', borderRadius: 'var(--radius-sm)', fontFamily: 'var(--font-base)', fontSize: 13, width: 160 }}
            />
          </div>
          <button className="btn btn-primary" onClick={handleFilter}>
            Apply Filters
          </button>
        </div>
      </div>

      {loading && (
        <div style={{ textAlign: 'center', padding: 40, color: 'var(--text-muted)' }}>
          <span className="loading-spinner" style={{ marginRight: 8 }} />
          Loading historical data...
        </div>
      )}

      {!loading && events.length === 0 && (
        <div style={{ textAlign: 'center', padding: 40, color: 'var(--text-muted)' }}>
          No historical events match your filters.
        </div>
      )}

      {!loading && events.map((ev) => (
        <div key={ev.id} className="hist-card">
          <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 10 }}>
            <div>
              <div style={{ fontSize: 17, fontWeight: 800, color: 'var(--text-primary)', marginBottom: 4 }}>
                {ev.name}
              </div>
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                <span style={{ fontSize: 10, background: 'var(--info-dim)', color: 'var(--info)', padding: '2px 6px', borderRadius: 4, fontWeight: 600 }}>
                  {ev.disaster_type.toUpperCase()}
                </span>
                <span style={{ fontSize: 10, background: 'var(--bg-elevated)', color: 'var(--text-muted)', padding: '2px 6px', borderRadius: 4 }}>
                  {ev.region}, {ev.country}
                </span>
                <span style={{ fontSize: 10, background: 'var(--bg-elevated)', color: 'var(--text-muted)', padding: '2px 6px', borderRadius: 4 }}>
                  {ev.year}
                </span>
                <span style={{ fontSize: 9, background: 'var(--info-dim)', color: 'var(--info)', padding: '2px 6px', borderRadius: 4, fontWeight: 700 }}>
                  HISTORICAL DATA
                </span>
              </div>
            </div>
          </div>

          <div className="hist-stat-row">
            {ev.affected_population > 0 && (
              <div className="hist-stat">
                <div className="hist-stat-num" style={{ color: 'var(--warning)' }}>
                  {ev.affected_population >= 1000000
                    ? `${(ev.affected_population / 1000000).toFixed(1)}M`
                    : ev.affected_population >= 1000
                    ? `${(ev.affected_population / 1000).toFixed(0)}K`
                    : ev.affected_population}
                </div>
                <div className="hist-stat-lbl">Affected</div>
              </div>
            )}
            {ev.deaths != null && (
              <div className="hist-stat">
                <div className="hist-stat-num" style={{ color: 'var(--critical)' }}>
                  {ev.deaths.toLocaleString()}
                </div>
                <div className="hist-stat-lbl">Deaths (verified)</div>
              </div>
            )}
            {ev.displaced != null && (
              <div className="hist-stat">
                <div className="hist-stat-num" style={{ color: 'var(--danger)' }}>
                  {ev.displaced >= 1000000
                    ? `${(ev.displaced / 1000000).toFixed(1)}M`
                    : ev.displaced >= 1000
                    ? `${(ev.displaced / 1000).toFixed(0)}K`
                    : ev.displaced}
                </div>
                <div className="hist-stat-lbl">Displaced</div>
              </div>
            )}
          </div>

          {ev.infrastructure_damage_desc && (
            <div style={{ marginBottom: 8 }}>
              <div style={{ fontSize: 10, color: 'var(--text-muted)', marginBottom: 3, textTransform: 'uppercase', letterSpacing: 0.5 }}>
                Infrastructure Impact
              </div>
              <div style={{ fontSize: 12, color: 'var(--text-secondary)', lineHeight: 1.5 }}>
                {ev.infrastructure_damage_desc}
              </div>
            </div>
          )}

          {ev.accessibility_challenges && (
            <div style={{ marginBottom: 8 }}>
              <div style={{ fontSize: 10, color: 'var(--text-muted)', marginBottom: 3, textTransform: 'uppercase', letterSpacing: 0.5 }}>
                Last-Mile Access Challenges
              </div>
              <div style={{ fontSize: 12, color: 'var(--warning)', lineHeight: 1.5 }}>
                {ev.accessibility_challenges}
              </div>
            </div>
          )}

          {ev.response_challenges && (
            <div style={{ marginBottom: 8 }}>
              <div style={{ fontSize: 10, color: 'var(--text-muted)', marginBottom: 3, textTransform: 'uppercase', letterSpacing: 0.5 }}>
                Relief Response Challenges
              </div>
              <div style={{ fontSize: 12, color: 'var(--text-secondary)', lineHeight: 1.5 }}>
                {ev.response_challenges}
              </div>
            </div>
          )}

          <div style={{ fontSize: 10, color: 'var(--text-muted)', marginTop: 10, paddingTop: 8, borderTop: '1px solid var(--border)' }}>
            📚 Source: {ev.source}
          </div>
        </div>
      ))}
    </div>
  );
}
