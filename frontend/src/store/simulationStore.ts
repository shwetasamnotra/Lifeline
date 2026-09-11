import { create } from 'zustand';

export interface SimState {
  phase: string;
  currentStep: number;
  isRunning: boolean;
  isPaused: boolean;
  infraStatus: Record<string, string>;
  communityStatus: Record<string, any>;
  routeStatus: Record<string, string>;
  routeRejectionReasons: Record<string, string>;
  recommendedRoute: string | null;
  missionStatus: Record<string, string>;
  missionRoute: Record<string, string>;
  alerts: any[];
  activeDisasters: string[];
  kpi: {
    active_disasters: number;
    communities_at_risk: number;
    critically_isolated: number;
    critical_needs: number;
    blocked_routes: number;
    active_missions: number;
  };
  graphState: { nodes: any[]; edges: any[] } | null;
}

interface SimulationStore {
  simState: SimState | null;
  currentEvent: any | null;
  eventHistory: any[];
  connected: boolean;
  setSimState: (s: SimState) => void;
  setCurrentEvent: (e: any) => void;
  pushEventToHistory: (e: any) => void;
  setConnected: (v: boolean) => void;
  reset: () => void;
}

const defaultKpi = {
  active_disasters: 0,
  communities_at_risk: 0,
  critically_isolated: 0,
  critical_needs: 0,
  blocked_routes: 0,
  active_missions: 0,
};

export const useSimulationStore = create<SimulationStore>((set) => ({
  simState: null,
  currentEvent: null,
  eventHistory: [],
  connected: false,
  setSimState: (s) => set({ simState: s }),
  setCurrentEvent: (e) => set({ currentEvent: e }),
  pushEventToHistory: (e) => set((st) => ({ eventHistory: [...st.eventHistory.slice(-20), e] })),
  setConnected: (v) => set({ connected: v }),
  reset: () => set({ simState: null, currentEvent: null, eventHistory: [] }),
}));
