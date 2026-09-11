import React, { useEffect, useState } from 'react';
import { api } from '../api/client';
import { useSimulationStore } from '../store/simulationStore';
import DisasterMap from '../components/DisasterMap';
import EventToast from '../components/EventToast';

export default function LiveDisasterMap() {
  const { simState } = useSimulationStore();
  const [communities, setCommunities] = useState<any[]>([]);
  const [infrastructure, setInfrastructure] = useState<any[]>([]);
  const [disasters, setDisasters] = useState<any[]>([]);
  const [routes, setRoutes] = useState<any[]>([]);

  useEffect(() => {
    Promise.all([
      api.getCommunities(),
      api.getInfrastructure(),
      api.getDisasters(),
      api.getRoutes(),
    ]).then(([c, i, d, r]) => {
      setCommunities(c);
      setInfrastructure(i);
      setDisasters(d);
      setRoutes(r);
    });
  }, [simState?.phase]);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden' }}>
      <EventToast />
      <div style={{ padding: '8px 20px', background: 'var(--bg-surface)', borderBottom: '1px solid var(--border)', flexShrink: 0, display: 'flex', alignItems: 'center', gap: 12 }}>
        <span style={{ fontSize: 12, color: 'var(--text-secondary)' }}>
          Interactive map — Click communities for detail panel. Use layer controls (top right) to toggle overlays.
        </span>
        <span className="simulation-label" style={{ marginLeft: 'auto' }}>SIMULATION</span>
        <div style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 11, color: 'var(--text-muted)' }}>
          <span style={{ width: 8, height: 8, borderRadius: '50%', background: 'var(--success)', display: 'inline-block', animation: 'pulse 2s infinite' }} />
          CARTO Dark + OpenStreetMap
        </div>
      </div>
      <div style={{ flex: 1 }}>
        <DisasterMap
          communities={communities}
          infrastructure={infrastructure}
          disasters={disasters}
          routes={routes}
        />
      </div>
    </div>
  );
}
