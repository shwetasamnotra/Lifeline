import { useEffect, useRef, useCallback } from 'react';
import { useSimulationStore } from '../store/simulationStore';

const WS_URL = import.meta.env.VITE_WS_URL || 'ws://localhost:8000/ws/live';

export function useWebSocket() {
  const ws = useRef<WebSocket | null>(null);
  const reconnectTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const { setSimState, setCurrentEvent, pushEventToHistory, setConnected } = useSimulationStore();

  const connect = useCallback(() => {
    if (ws.current?.readyState === WebSocket.OPEN) return;
    
    try {
      ws.current = new WebSocket(WS_URL);

      ws.current.onopen = () => {
        setConnected(true);
      };

      ws.current.onmessage = (evt) => {
        try {
          const msg = JSON.parse(evt.data);
          const { type, payload } = msg;

          if (type === 'CONNECTED' || type === 'STATE_UPDATE') {
            if (payload?.state) setSimState(payload.state);
          } else if (type === 'SIMULATION_STEP') {
            if (payload?.state) setSimState(payload.state);
            setCurrentEvent(payload);
            pushEventToHistory(payload);
          } else if (
            type === 'SIMULATION_STARTED' ||
            type === 'SIMULATION_PAUSED' ||
            type === 'SIMULATION_RESET'
          ) {
            setSimState(payload);
          }
        } catch {
          // ignore parse errors
        }
      };

      ws.current.onclose = () => {
        setConnected(false);
        // Reconnect after 3s
        reconnectTimer.current = setTimeout(connect, 3000);
      };

      ws.current.onerror = () => {
        ws.current?.close();
      };
    } catch {
      setConnected(false);
      reconnectTimer.current = setTimeout(connect, 3000);
    }
  }, [setSimState, setCurrentEvent, pushEventToHistory, setConnected]);

  useEffect(() => {
    connect();
    return () => {
      if (reconnectTimer.current) clearTimeout(reconnectTimer.current);
      ws.current?.close();
    };
  }, [connect]);

  const sendMessage = useCallback((msg: object) => {
    if (ws.current?.readyState === WebSocket.OPEN) {
      ws.current.send(JSON.stringify(msg));
    }
  }, []);

  return { sendMessage };
}
