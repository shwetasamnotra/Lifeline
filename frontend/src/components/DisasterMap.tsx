import React, { useEffect, useRef, useState, useCallback } from 'react';
import { MapContainer, TileLayer, CircleMarker, Polyline, Popup, LayersControl, useMap, LayerGroup, Circle } from 'react-leaflet';
import { useSimulationStore } from '../store/simulationStore';
import CommunityPanel from './CommunityPanel';
import 'leaflet/dist/leaflet.css';

const { BaseLayer, Overlay } = LayersControl;

// Colour helpers
function communityColor(status: string) {
  switch (status) {
    case 'CRITICALLY_ISOLATED': return '#ef4444';
    case 'ISOLATED':            return '#f97316';
    case 'AT_RISK':             return '#f59e0b';
    default:                    return '#22c55e';
  }
}

function routeColor(status: string) {
  switch (status) {
    case 'RECOMMENDED':  return '#00d4ff';
    case 'BLOCKED':
    case 'REJECTED':     return '#ef4444';
    case 'VIABLE':       return '#22c55e';
    default:             return '#6366f1';
  }
}

function infraColor(type: string, status: string) {
  if (status === 'FAILED' || status === 'BLOCKED') return '#ef4444';
  switch (type) {
    case 'hospital':    return '#a78bfa';
    case 'shelter':     return '#34d399';
    case 'warehouse':   return '#60a5fa';
    case 'water_point': return '#22d3ee';
    case 'bridge':      return status === 'OPERATIONAL' ? '#fbbf24' : '#ef4444';
    default:            return '#94a3b8';
  }
}

function infraIcon(type: string) {
  switch (type) {
    case 'hospital':    return '🏥';
    case 'shelter':     return '⛺';
    case 'warehouse':   return '🏭';
    case 'water_point': return '💧';
    case 'bridge':      return '🌉';
    default:            return '📍';
  }
}

interface MapProps {
  communities: any[];
  infrastructure: any[];
  disasters: any[];
  routes: any[];
}

// Route waypoint polylines
function RouteLines({ routes }: { routes: any[] }) {
  return (
    <>
      {routes.map((route) => {
        const pts = (route.waypoints || []).map((w: any) => [w.lat, w.lng] as [number, number]);
        if (pts.length < 2) return null;
        const color = routeColor(route.status);
        const isDashed = route.status === 'BLOCKED' || route.status === 'REJECTED';
        return (
          <Polyline
            key={route.id}
            positions={pts}
            pathOptions={{
              color,
              weight: route.is_recommended ? 5 : 2.5,
              opacity: route.status === 'REJECTED' ? 0.5 : 0.85,
              dashArray: isDashed ? '8, 6' : undefined,
            }}
          >
            <Popup>
              <div style={{ fontFamily: 'var(--font-base)', fontSize: 13 }}>
                <strong>{route.name}</strong>
                <div style={{ marginTop: 4, fontSize: 11 }}>
                  Distance: {route.distance_km} km<br />
                  Status: <span style={{ color: routeColor(route.status), fontWeight: 700 }}>{route.status}</span><br />
                  Risk: {route.risk_level}<br />
                  {route.rejection_reason && <span style={{ color: '#ef4444' }}>⚠ {route.rejection_reason}</span>}
                  {route.is_recommended && (
                    <div style={{ marginTop: 4, color: '#00d4ff', fontWeight: 700 }}>★ CURRENTLY VIABLE — RECOMMENDED</div>
                  )}
                </div>
              </div>
            </Popup>
          </Polyline>
        );
      })}
    </>
  );
}

// Disaster zone circles
function DisasterZones({ disasters, simPhase }: { disasters: any[], simPhase: string }) {
  const isActive = simPhase !== 'baseline';
  return (
    <>
      {disasters.map((d) => (
        <React.Fragment key={d.id}>
          <Circle
            center={[d.lat, d.lng]}
            radius={(d.radius_km || 8) * 1000}
            pathOptions={{
              color: '#ef4444',
              fillColor: '#ef4444',
              fillOpacity: isActive ? 0.12 : 0.05,
              weight: isActive ? 2 : 1,
              dashArray: '4, 4',
            }}
          />
          {isActive && (
            <Circle
              center={[d.lat, d.lng]}
              radius={(d.radius_km || 8) * 600}
              pathOptions={{
                color: '#f97316',
                fillColor: '#f97316',
                fillOpacity: 0.06,
                weight: 1,
                dashArray: '2, 4',
              }}
            />
          )}
        </React.Fragment>
      ))}
    </>
  );
}

function MapLegend() {
  return (
    <div style={{
      position: 'absolute',
      bottom: 20,
      left: 20,
      background: 'rgba(13, 21, 32, 0.92)',
      border: '1px solid rgba(255,255,255,0.1)',
      borderRadius: 10,
      padding: '12px 14px',
      fontSize: 11,
      zIndex: 1000,
      minWidth: 160,
      backdropFilter: 'blur(8px)',
    }}>
      <div style={{ fontWeight: 700, color: '#00d4ff', marginBottom: 8, fontSize: 10, letterSpacing: 1, textTransform: 'uppercase' }}>
        Map Legend
      </div>
      {[
        { color: '#22c55e', label: 'Connected' },
        { color: '#f59e0b', label: 'At Risk' },
        { color: '#f97316', label: 'Isolated' },
        { color: '#ef4444', label: 'Critically Isolated' },
      ].map(({ color, label }) => (
        <div key={label} style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 5, color: '#94a3b8' }}>
          <span style={{ width: 10, height: 10, borderRadius: '50%', background: color, display: 'inline-block', flexShrink: 0 }} />
          {label}
        </div>
      ))}
      <div style={{ height: 1, background: 'rgba(255,255,255,0.07)', margin: '8px 0' }} />
      {[
        { color: '#00d4ff', label: 'Recommended Route', dashed: false, thick: true },
        { color: '#22c55e', label: 'Viable Route', dashed: false, thick: false },
        { color: '#ef4444', label: 'Blocked Route', dashed: true, thick: false },
      ].map(({ color, label, dashed, thick }) => (
        <div key={label} style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 5, color: '#94a3b8' }}>
          <span style={{
            width: 22, height: thick ? 3 : 2,
            background: color,
            display: 'inline-block',
            borderTop: dashed ? `2px dashed ${color}` : undefined,
            opacity: dashed ? 0.7 : 1,
          }} />
          {label}
        </div>
      ))}
      <div style={{ height: 1, background: 'rgba(255,255,255,0.07)', margin: '8px 0' }} />
      {[
        { icon: '🏥', label: 'Hospital' },
        { icon: '⛺', label: 'Shelter' },
        { icon: '🏭', label: 'Warehouse' },
        { icon: '💧', label: 'Water' },
      ].map(({ icon, label }) => (
        <div key={label} style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4, color: '#94a3b8' }}>
          <span>{icon}</span>{label}
        </div>
      ))}
    </div>
  );
}

export default function DisasterMap({ communities, infrastructure, disasters, routes }: MapProps) {
  const { simState } = useSimulationStore();
  const [selectedCommunity, setSelectedCommunity] = useState<any>(null);
  const simPhase = simState?.phase ?? 'baseline';
  const simCommunity = simState?.communityStatus ?? {};
  const simInfra = simState?.infraStatus ?? {};
  const simRoutes = simState?.routeStatus ?? {};

  // Merge live simulation state into community data
  const mergedCommunities = communities.map((c) => {
    const live = simCommunity[c.name] || {};
    return { ...c, ...live };
  });

  // Merge infra status
  const mergedInfra = infrastructure.map((i) => ({
    ...i,
    status: simInfra[i.name] || i.status,
  }));

  // Merge route status
  const mergedRoutes = routes.map((r) => ({
    ...r,
    status: simRoutes[r.name] || r.status,
    is_recommended: simState?.recommendedRoute === r.name,
  }));

  return (
    <div style={{ position: 'relative', width: '100%', height: '100%' }}>
      <MapContainer
        center={[31.85, 77.10]}
        zoom={11}
        style={{ width: '100%', height: '100%', background: '#0d1520' }}
        zoomControl={true}
      >
        <TileLayer
          url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
          attribution='&copy; <a href="https://carto.com">CARTO</a> | &copy; <a href="https://openstreetmap.org">OpenStreetMap</a>'
          maxZoom={19}
        />

        <LayersControl position="topright">
          <Overlay checked name="Disaster Zones">
            <LayerGroup>
              <DisasterZones disasters={disasters} simPhase={simPhase} />
            </LayerGroup>
          </Overlay>

          <Overlay checked name="Routes">
            <LayerGroup>
              <RouteLines routes={mergedRoutes} />
            </LayerGroup>
          </Overlay>

          <Overlay checked name="Infrastructure">
            <LayerGroup>
              {mergedInfra
                .filter((i) => !['road'].includes(i.infra_type))
                .map((item) => (
                  <CircleMarker
                    key={item.id}
                    center={[item.lat, item.lng]}
                    radius={item.infra_type === 'warehouse' ? 10 : 7}
                    pathOptions={{
                      color: infraColor(item.infra_type, item.status),
                      fillColor: infraColor(item.infra_type, item.status),
                      fillOpacity: 0.85,
                      weight: item.status === 'FAILED' || item.status === 'BLOCKED' ? 3 : 1.5,
                    }}
                  >
                    <Popup>
                      <div style={{ fontFamily: 'var(--font-base)', fontSize: 12 }}>
                        <strong>{infraIcon(item.infra_type)} {item.name}</strong>
                        <div style={{ marginTop: 4, color: infraColor(item.infra_type, item.status), fontWeight: 700 }}>
                          {item.status}
                        </div>
                        {item.capacity && (
                          <div style={{ fontSize: 11, color: '#94a3b8', marginTop: 2 }}>
                            Capacity: {item.current_load}/{item.capacity}
                          </div>
                        )}
                        {item.is_simulated && (
                          <div style={{ fontSize: 9, color: '#f59e0b', marginTop: 4, fontWeight: 700 }}>⚡ SIMULATION</div>
                        )}
                      </div>
                    </Popup>
                  </CircleMarker>
                ))}
            </LayerGroup>
          </Overlay>

          <Overlay checked name="Communities">
            <LayerGroup>
              {mergedCommunities.map((c) => {
                const color = communityColor(c.status);
                const isCritical = c.status === 'CRITICALLY_ISOLATED';
                return (
                  <React.Fragment key={c.id}>
                    {isCritical && (
                      <Circle
                        center={[c.lat, c.lng]}
                        radius={800}
                        pathOptions={{ color: '#ef4444', fillColor: '#ef4444', fillOpacity: 0.08, weight: 1.5, dashArray: '3,3' }}
                      />
                    )}
                    <CircleMarker
                      center={[c.lat, c.lng]}
                      radius={isCritical ? 14 : 10}
                      pathOptions={{
                        color: color,
                        fillColor: color,
                        fillOpacity: 0.9,
                        weight: isCritical ? 3 : 2,
                      }}
                      eventHandlers={{
                        click: () => setSelectedCommunity(c),
                      }}
                    >
                      <Popup>
                        <div style={{ fontFamily: 'var(--font-base)', fontSize: 12, minWidth: 180 }}>
                          <strong style={{ fontSize: 14 }}>{c.name}</strong>
                          <div style={{ marginTop: 4, color, fontWeight: 700, fontSize: 11 }}>
                            {c.status.replace(/_/g, ' ')}
                          </div>
                          <div style={{ marginTop: 4, fontSize: 12 }}>
                            <span style={{ color: '#94a3b8' }}>Lifeline Loss: </span>
                            <span style={{ color, fontWeight: 700 }}>{c.lifeline_loss_score?.toFixed(1)}/100</span>
                          </div>
                          <div style={{ fontSize: 11, color: '#94a3b8', marginTop: 2 }}>Pop: {c.population?.toLocaleString()}</div>
                          <button
                            onClick={() => setSelectedCommunity(c)}
                            style={{
                              marginTop: 8, padding: '4px 10px', background: 'var(--accent)',
                              color: '#000', border: 'none', borderRadius: 4, cursor: 'pointer',
                              fontSize: 11, fontWeight: 700
                            }}
                          >
                            View Details →
                          </button>
                          {c.is_simulated && (
                            <div style={{ fontSize: 9, color: '#f59e0b', marginTop: 4, fontWeight: 700 }}>⚡ SIMULATION</div>
                          )}
                        </div>
                      </Popup>
                    </CircleMarker>
                  </React.Fragment>
                );
              })}
            </LayerGroup>
          </Overlay>
        </LayersControl>

        <MapLegend />
      </MapContainer>

      {selectedCommunity && (
        <CommunityPanel
          community={selectedCommunity}
          onClose={() => setSelectedCommunity(null)}
        />
      )}
    </div>
  );
}
