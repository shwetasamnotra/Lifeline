import React, { useEffect, useState } from 'react';
import { useSimulationStore } from '../store/simulationStore';
import { api } from '../api/client';

export default function EventToast() {
  const { currentEvent } = useSimulationStore();
  const [visible, setVisible] = useState(false);
  const [displayed, setDisplayed] = useState<any>(null);

  useEffect(() => {
    if (!currentEvent) return;
    setDisplayed(currentEvent);
    setVisible(true);
    const t = setTimeout(() => setVisible(false), 6000);
    return () => clearTimeout(t);
  }, [currentEvent]);

  if (!visible || !displayed) return null;

  const sev = displayed.severity || 'INFO';
  const sevColor: Record<string, string> = {
    CRITICAL: 'var(--critical)',
    HIGH: 'var(--danger)',
    WARNING: 'var(--warning)',
    INFO: 'var(--info)',
  };

  return (
    <div className={`event-toast ${sev}`} style={{ borderColor: sevColor[sev] }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 }}>
        <span
          style={{
            fontSize: 9, fontWeight: 700, letterSpacing: 1, textTransform: 'uppercase',
            color: sevColor[sev], background: `${sevColor[sev]}22`, padding: '2px 6px', borderRadius: 4,
          }}
        >
          {sev}
        </span>
        <span style={{ fontSize: 10, color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
          {displayed.time_label}
        </span>
        <button
          onClick={() => setVisible(false)}
          style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', fontSize: 14 }}
        >
          ✕
        </button>
      </div>
      <div style={{ fontWeight: 700, fontSize: 13, color: 'var(--text-primary)', marginBottom: 4 }}>
        {displayed.title}
      </div>
      <div style={{ fontSize: 11, color: 'var(--text-secondary)', lineHeight: 1.4 }}>
        {displayed.description}
      </div>
    </div>
  );
}
