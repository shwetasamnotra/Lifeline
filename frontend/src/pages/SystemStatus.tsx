import React, { useEffect, useState } from 'react';
import { api } from '../api/client';

function statusColor(s: string) {
  switch (s) {
    case 'CONNECTED': return 'var(--success)';
    case 'OFFLINE':   return 'var(--critical)';
    default:          return 'var(--warning)';
  }
}

export default function SystemStatus() {
  const [status, setStatus] = useState<any>(null);
  const [weather, setWeather] = useState<any>(null);
  const [earthquakes, setEarthquakes] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    Promise.all([
      api.getSystemStatus(),
      api.getWeather(),
      api.getEarthquakes(),
    ]).then(([s, w, e]) => {
      setStatus(s);
      setWeather(w);
      setEarthquakes(e);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, []);

  return (
    <div className="page-container">
      <div style={{ marginBottom: 20 }}>
        <h1 style={{ fontSize: 20, fontWeight: 800, color: 'var(--text-primary)', marginBottom: 4 }}>
          System Status & Data Sources
        </h1>
        <p style={{ fontSize: 13, color: 'var(--text-secondary)' }}>
          API connectivity status. No API secrets are displayed. Configured status only.
          See README for how to configure real APIs.
        </p>
      </div>

      {loading && (
        <div style={{ textAlign: 'center', padding: 40, color: 'var(--text-muted)' }}>
          <span className="loading-spinner" style={{ marginRight: 8 }} />
          Checking API connectivity...
        </div>
      )}

      {status && (
        <>
          {/* Overall status */}
          <div className="card" style={{ marginBottom: 20 }}>
            <div className="card-header">
              <div className="card-title">Overall System Health</div>
              <span style={{
                fontSize: 11, fontWeight: 700,
                color: status.overall === 'OPERATIONAL' ? 'var(--success)' : 'var(--warning)',
              }}>
                {status.overall}
              </span>
            </div>
            <div className="card-body">
              <div style={{ display: 'flex', gap: 24, flexWrap: 'wrap' }}>
                <div>
                  <div style={{ fontSize: 10, color: 'var(--text-muted)', marginBottom: 4 }}>DATABASE</div>
                  <span style={{ color: 'var(--success)', fontWeight: 700, fontSize: 13 }}>✓ CONNECTED (SQLite)</span>
                </div>
                <div>
                  <div style={{ fontSize: 10, color: 'var(--text-muted)', marginBottom: 4 }}>SIMULATION ENGINE</div>
                  <span style={{ color: 'var(--success)', fontWeight: 700, fontSize: 13 }}>✓ RUNNING</span>
                </div>
                <div>
                  <div style={{ fontSize: 10, color: 'var(--text-muted)', marginBottom: 4 }}>FALLBACK MODE</div>
                  <span style={{ color: status.fallback_mode ? 'var(--warning)' : 'var(--success)', fontWeight: 700, fontSize: 13 }}>
                    {status.fallback_mode ? '⚠ PARTIALLY ACTIVE' : '○ NOT REQUIRED'}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Data sources grid */}
          <div style={{ marginBottom: 24 }}>
            <h2 style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-secondary)', letterSpacing: 0.8, textTransform: 'uppercase', marginBottom: 12 }}>
              External Data Sources
            </h2>
            <div className="card">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Data Source</th>
                    <th>Type</th>
                    <th>Status</th>
                    <th>API Key Required</th>
                    <th>Key Status</th>
                    <th>Fallback Active</th>
                    <th>Description</th>
                  </tr>
                </thead>
                <tbody>
                  {(status.sources || []).map((src: any) => (
                    <tr key={src.id}>
                      <td style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{src.name}</td>
                      <td>
                        <span style={{ fontSize: 10, padding: '2px 6px', borderRadius: 4, fontWeight: 600,
                          background: src.source_type === 'LIVE' ? 'var(--success-dim)' : src.source_type === 'SIMULATED' ? 'var(--warning-dim)' : 'var(--info-dim)',
                          color: src.source_type === 'LIVE' ? 'var(--success)' : src.source_type === 'SIMULATED' ? 'var(--warning)' : 'var(--info)',
                        }}>
                          {src.source_type}
                        </span>
                      </td>
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                          <span style={{ width: 8, height: 8, borderRadius: '50%', background: statusColor(src.status), display: 'inline-block' }} />
                          <span style={{ color: statusColor(src.status), fontWeight: 600, fontSize: 11 }}>{src.status}</span>
                        </div>
                      </td>
                      <td style={{ color: src.requires_key ? 'var(--warning)' : 'var(--success)' }}>
                        {src.requires_key ? 'Required' : 'Not Required'}
                      </td>
                      <td>
                        {src.requires_key !== null ? (
                          <span style={{
                            color: src.key_configured ? 'var(--success)' : 'var(--text-muted)',
                            fontSize: 11,
                          }}>
                            {src.key_configured ? 'Configured ✓' : 'Not Configured ○'}
                          </span>
                        ) : <span style={{ color: 'var(--text-muted)' }}>N/A</span>}
                      </td>
                      <td style={{ color: src.fallback_active ? 'var(--warning)' : 'var(--text-muted)' }}>
                        {src.fallback_active ? 'ACTIVE' : '—'}
                      </td>
                      <td style={{ fontSize: 11, maxWidth: 250 }}>{src.description}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* API key status */}
          <div className="card" style={{ marginBottom: 20 }}>
            <div className="card-header">
              <div className="card-title">Optional API Credentials</div>
            </div>
            <div className="card-body" style={{ fontSize: 12, color: 'var(--text-secondary)' }}>
              <div style={{ marginBottom: 8 }}>
                <strong>Map Provider:</strong>{' '}
                <span style={{ color: status.api_keys?.map_provider === 'configured' ? 'var(--success)' : 'var(--text-muted)' }}>
                  {status.api_keys?.map_provider === 'configured' ? 'Configured ✓' : 'Not Configured (using OpenStreetMap)'}
                </span>
              </div>
              <div>
                <strong>Routing Provider:</strong>{' '}
                <span style={{ color: status.api_keys?.routing_provider === 'configured' ? 'var(--success)' : 'var(--text-muted)' }}>
                  {status.api_keys?.routing_provider === 'configured' ? 'Configured ✓' : 'Not Configured (using internal Dijkstra engine)'}
                </span>
              </div>
              <div style={{ marginTop: 10, padding: '8px 12px', background: 'var(--info-dim)', border: '1px solid var(--info)', borderRadius: 'var(--radius-sm)', color: 'var(--info)', fontSize: 11 }}>
                ℹ API secrets are never displayed here. See <code>.env.example</code> and the README for configuration instructions.
              </div>
            </div>
          </div>
        </>
      )}

      {/* Weather data */}
      {weather && (
        <div className="card" style={{ marginBottom: 20 }}>
          <div className="card-header">
            <div className="card-title">Weather Data — {weather.location}</div>
            <span style={{
              fontSize: 10, fontWeight: 700, padding: '2px 6px', borderRadius: 4,
              background: weather.source === 'LIVE' ? 'var(--success-dim)' : 'var(--warning-dim)',
              color: weather.source === 'LIVE' ? 'var(--success)' : 'var(--warning)',
            }}>
              {weather.source}
            </span>
          </div>
          <div className="card-body">
            {weather.source === 'LIVE' ? (
              <div style={{ display: 'flex', gap: 24, flexWrap: 'wrap', fontSize: 12 }}>
                <div>
                  <div style={{ color: 'var(--text-muted)', fontSize: 10, marginBottom: 2 }}>TEMPERATURE</div>
                  <div style={{ fontSize: 18, fontWeight: 700, fontFamily: 'var(--font-mono)', color: 'var(--accent)' }}>
                    {weather.current_temperature_c}°C
                  </div>
                </div>
                <div>
                  <div style={{ color: 'var(--text-muted)', fontSize: 10, marginBottom: 2 }}>WINDSPEED</div>
                  <div style={{ fontSize: 18, fontWeight: 700, fontFamily: 'var(--font-mono)', color: 'var(--accent)' }}>
                    {weather.current_windspeed_kmh} km/h
                  </div>
                </div>
              </div>
            ) : (
              <div style={{ fontSize: 12, color: 'var(--warning)' }}>
                ⚡ {weather.disclaimer}
                {weather.simulated_rainfall_mm && (
                  <div style={{ marginTop: 6, fontSize: 13, fontWeight: 700, color: 'var(--critical)' }}>
                    Simulated Rainfall: {weather.simulated_rainfall_mm}mm
                  </div>
                )}
              </div>
            )}
            <div style={{ fontSize: 10, color: 'var(--text-muted)', marginTop: 8 }}>
              Provider: {weather.provider}
            </div>
          </div>
        </div>
      )}

      {/* Earthquake data */}
      {earthquakes && earthquakes.count > 0 && (
        <div className="card" style={{ marginBottom: 20 }}>
          <div className="card-header">
            <div className="card-title">Recent Seismic Activity — {earthquakes.note}</div>
            <span style={{ fontSize: 10, background: 'var(--info-dim)', color: 'var(--info)', padding: '2px 6px', borderRadius: 4, fontWeight: 600 }}>
              HISTORICAL DATA
            </span>
          </div>
          <div style={{ overflowX: 'auto' }}>
            <table className="data-table">
              <thead>
                <tr>
                  <th>Place</th>
                  <th>Magnitude</th>
                  <th>Depth (km)</th>
                  <th>Date</th>
                </tr>
              </thead>
              <tbody>
                {(earthquakes.events || []).slice(0, 8).map((eq: any) => (
                  <tr key={eq.id}>
                    <td style={{ color: 'var(--text-primary)' }}>{eq.place}</td>
                    <td style={{ color: eq.magnitude >= 5.5 ? 'var(--critical)' : eq.magnitude >= 4.5 ? 'var(--warning)' : 'var(--success)', fontWeight: 700 }}>
                      M {eq.magnitude}
                    </td>
                    <td style={{ fontFamily: 'var(--font-mono)' }}>{eq.depth_km?.toFixed(1)}</td>
                    <td style={{ fontFamily: 'var(--font-mono)', fontSize: 11 }}>
                      {eq.time ? new Date(eq.time).toLocaleDateString() : '—'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* README excerpt */}
      <div className="card">
        <div className="card-header">
          <div className="card-title">How to Configure Real APIs</div>
        </div>
        <div className="card-body">
          <div style={{ fontSize: 12, color: 'var(--text-secondary)', lineHeight: 1.7 }}>
            <p><strong style={{ color: 'var(--text-primary)' }}>1. Open-Meteo</strong> — No API key required. Uses free public API.
            Set <code>OPEN_METEO_BASE_URL</code> in <code>.env</code>.</p>
            <p style={{ marginTop: 8 }}><strong style={{ color: 'var(--text-primary)' }}>2. USGS Earthquake API</strong> — No API key required.
            Set <code>USGS_BASE_URL</code> in <code>.env</code>.</p>
            <p style={{ marginTop: 8 }}><strong style={{ color: 'var(--text-primary)' }}>3. GDACS</strong> — No API key required.
            Set <code>GDACS_BASE_URL</code> in <code>.env</code>. Check GDACS Terms of Service before use.</p>
            <p style={{ marginTop: 8 }}><strong style={{ color: 'var(--text-primary)' }}>4. Map Provider (optional)</strong> — Default uses OpenStreetMap (no key).
            For Mapbox: register at <code>account.mapbox.com</code>, set <code>MAP_API_KEY</code>.</p>
            <p style={{ marginTop: 8 }}><strong style={{ color: 'var(--text-primary)' }}>5. Routing Provider (optional)</strong> — Default uses internal Dijkstra engine.
            For OpenRouteService: register at <code>openrouteservice.org</code>, set <code>ROUTING_API_KEY</code>.</p>
            <p style={{ marginTop: 12, color: 'var(--warning)' }}>
              After changing <code>.env</code>, restart both the backend (<code>uvicorn</code>) and frontend dev server (<code>npm run dev</code>).
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
