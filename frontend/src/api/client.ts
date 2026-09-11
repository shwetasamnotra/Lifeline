// API client
const BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000';

async function apiFetch<T>(path: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${BASE_URL}${path}`, {
    headers: { 'Content-Type': 'application/json' },
    ...options,
  });
  if (!res.ok) throw new Error(`API error ${res.status}: ${path}`);
  return res.json();
}

export const api = {
  getDisasters: () => apiFetch<any[]>('/api/disasters'),
  getCommunities: () => apiFetch<any[]>('/api/communities'),
  getCommunityLifeline: (id: number) => apiFetch<any>(`/api/communities/${id}/lifeline`),
  getInfrastructure: () => apiFetch<any[]>('/api/infrastructure'),
  getWarehouses: () => apiFetch<any[]>('/api/infrastructure/warehouses'),
  getRoutes: () => apiFetch<any[]>('/api/routes'),
  getMissions: () => apiFetch<any[]>('/api/routes/missions'),
  getAlerts: () => apiFetch<any[]>('/api/alerts'),
  getResources: () => apiFetch<any[]>('/api/alerts/resources'),
  getHistorical: (params?: { disaster_type?: string; year?: number; region?: string }) => {
    const q = new URLSearchParams();
    if (params?.disaster_type) q.set('disaster_type', params.disaster_type);
    if (params?.year) q.set('year', String(params.year));
    if (params?.region) q.set('region', params.region);
    return apiFetch<any[]>(`/api/historical${q.toString() ? '?' + q.toString() : ''}`);
  },
  getSimulationState: () => apiFetch<any>('/api/simulation/state'),
  getSimulationEvents: () => apiFetch<any[]>('/api/simulation/events'),
  startSimulation: () => apiFetch<any>('/api/simulation/start', { method: 'POST' }),
  pauseSimulation: () => apiFetch<any>('/api/simulation/pause', { method: 'POST' }),
  resetSimulation: () => apiFetch<any>('/api/simulation/reset', { method: 'POST' }),
  stepSimulation: () => apiFetch<any>('/api/simulation/step', { method: 'POST' }),
  getSystemStatus: () => apiFetch<any>('/api/system/status'),
  getWeather: () => apiFetch<any>('/api/system/weather'),
  getEarthquakes: () => apiFetch<any>('/api/system/earthquakes'),
  getGraph: () => apiFetch<any>('/api/system/graph'),
  optimizeRoute: (from_node: string, to_node: string) =>
    apiFetch<any>('/api/routes/optimize', {
      method: 'POST',
      body: JSON.stringify({ from_node, to_node, avoid_flooded: true }),
    }),
};
