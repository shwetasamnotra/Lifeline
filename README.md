# LIFELINE 2.0
## Real-Time Disaster Isolation & Last-Mile Relief Intelligence
### Smart India Hackathon 2026 Prototype — Disaster Management Theme

> **"THE DISASTER IS VISIBLE. THE ISOLATION IT CREATES IS NOT."**
> **LIFELINE 2.0 makes that invisible isolation measurable and actionable.**

---

## ⚠ Important Disclaimer

All community, infrastructure, and scenario data in this application is **simulated for demonstration purposes only**.
The "Kothi Flash Flood" scenario is a fictional scenario created for the SIH 2026 prototype.
No simulated data is presented as verified real-world disaster information.
Historical data is sourced from official government and international reports (sources cited).

---

## Architecture

```
LIFELINE 2.0
├── backend/                  # FastAPI + Python
│   ├── app/
│   │   ├── main.py           # FastAPI app + WebSocket
│   │   ├── config.py         # Settings (pydantic-settings)
│   │   ├── database.py       # SQLAlchemy + aiosqlite
│   │   ├── models/
│   │   │   ├── models.py     # ORM models (all entities)
│   │   │   └── seed.py       # Demo data seeder
│   │   ├── algorithms/
│   │   │   ├── graph_engine.py   # NetworkX BFS/Dijkstra
│   │   │   └── lifeline_loss.py  # Weighted isolation score
│   │   ├── services/
│   │   │   └── simulation_service.py  # Deterministic simulation engine
│   │   └── routers/
│   │       ├── disasters.py
│   │       ├── communities.py    # includes /lifeline endpoint
│   │       ├── infrastructure.py
│   │       ├── routes.py        # includes /optimize (Dijkstra)
│   │       ├── alerts.py
│   │       ├── simulation.py    # start/pause/reset/step
│   │       ├── historical.py
│   │       └── system.py        # Live API status + weather/earthquakes
│   └── requirements.txt
│
├── frontend/                 # Vite + React + TypeScript
│   ├── src/
│   │   ├── api/client.ts     # API client (all endpoints)
│   │   ├── store/simulationStore.ts   # Zustand state
│   │   ├── hooks/useWebSocket.ts      # WS auto-reconnect hook
│   │   ├── components/
│   │   │   ├── Sidebar.tsx
│   │   │   ├── TopHeader.tsx
│   │   │   ├── DisasterMap.tsx   # Leaflet + dark tiles + all layers
│   │   │   ├── CommunityPanel.tsx
│   │   │   └── EventToast.tsx
│   │   ├── pages/
│   │   │   ├── CommandCentre.tsx
│   │   │   ├── LiveDisasterMap.tsx
│   │   │   ├── IsolationIntelligence.tsx
│   │   │   ├── ReliefOperations.tsx
│   │   │   ├── RoutePlanner.tsx
│   │   │   ├── HistoricalAnalysis.tsx
│   │   │   ├── ScenarioSimulator.tsx
│   │   │   └── SystemStatus.tsx
│   │   └── index.css         # Full dark command-centre design system
│   └── package.json
│
├── .env.example              # All configurable environment variables
├── start_backend.sh          # Backend startup script
└── README.md
```

---

## Quick Start

### 1. Backend

```bash
# Option A: Use startup script (recommended)
chmod +x start_backend.sh
./start_backend.sh

# Option B: Manual
cd backend
/usr/local/bin/python3.12 -m venv venv
venv/bin/pip install -r requirements.txt
cp ../.env.example .env
venv/bin/uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
```

Backend available at: **http://localhost:8000**
API docs: **http://localhost:8000/docs**

### 2. Frontend

```bash
cd frontend
npm install
npm run dev
```

Frontend available at: **http://localhost:5173**

---

## SIH Demo Walkthrough (3 minutes)

1. Open **http://localhost:5173** → Command Centre
2. Observe: All communities connected, Lifeline Loss low
3. Go to **Scenario Simulator** (⚡ in sidebar)
4. Click **▶ START** then **↪ NEXT EVENT** repeatedly (or run automatically)
5. Watch the sequence:
   - Flash Flood detected → map disaster overlay appears
   - Bridge B-03 FAILED → Route A rejected
   - Valley Road BLOCKED → Route B rejected
   - Kothi Village: ISOLATED (Lifeline Loss: 25 → 87)
   - Critical needs appear: Water, Medicine, Food
   - System matches resources at Warehouse Alpha
   - Route C (Mountain Road) → RECOMMENDED
   - New flooding → Route C BLOCKED
   - System auto-reroutes to Route D (Northern Bypass)
6. All panels (map, KPI cards, routes, missions, alerts) update in real-time via WebSocket

---

## How to Configure Real APIs

### 1. Open-Meteo (Weather)
- **Official site**: https://open-meteo.com/
- **API key required**: NO — completely free public API
- **Environment variable**: `OPEN_METEO_BASE_URL`
- **Default value**: `https://api.open-meteo.com/v1`
- **Verification**: Visit System Status page → Weather Data row shows CONNECTED

### 2. USGS Earthquake API
- **Official site**: https://earthquake.usgs.gov/fdsnws/event/1/
- **API key required**: NO — public government API
- **Environment variable**: `USGS_BASE_URL`
- **Default value**: `https://earthquake.usgs.gov/fdsnws/event/1`
- **Verification**: System Status page → USGS Earthquake Feed row

### 3. GDACS Global Disaster Alerts
- **Official site**: https://www.gdacs.org/
- **API key required**: NO — check GDACS Terms of Service before use
- **Environment variable**: `GDACS_BASE_URL`
- **Default value**: `https://www.gdacs.org`
- **Note**: GDACS may require registration for bulk API access

### 4. Map Provider (Optional)
- **Default**: OpenStreetMap + CARTO Dark tiles (no key required)
- **For Mapbox (optional)**: Register at https://account.mapbox.com/ (free tier available)
- **Environment variables**: `MAP_PROVIDER=mapbox`, `MAP_API_KEY=your_key_here`
- **Important**: Never commit the `.env` file with real keys to version control

### 5. Routing Provider (Optional)
- **Default**: Internal Dijkstra/A* engine (no external API)
- **For OpenRouteService (optional)**: Register at https://openrouteservice.org/ (free tier)
- **Environment variables**: `ROUTING_PROVIDER=openrouteservice`, `ROUTING_API_KEY=your_key_here`

### Applying Configuration Changes
1. Edit `.env` in the `backend/` directory
2. Restart the backend: `Ctrl+C` then re-run `./start_backend.sh`
3. Frontend reads `VITE_*` variables from `frontend/.env` — restart `npm run dev` if changed

---

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/disasters` | List all disasters |
| GET | `/api/disasters/{id}` | Single disaster |
| GET | `/api/communities` | All communities (live state) |
| GET | `/api/communities/{id}` | Single community |
| GET | `/api/communities/{id}/lifeline` | Lifeline Loss calculation |
| GET | `/api/infrastructure` | All infrastructure |
| GET | `/api/infrastructure/warehouses` | Warehouses + inventory |
| GET | `/api/routes` | All routes (live status) |
| POST | `/api/routes/optimize` | Dijkstra route optimisation |
| GET | `/api/routes/missions` | Relief missions |
| GET | `/api/alerts` | All alerts (live + DB) |
| GET | `/api/historical` | Historical events |
| GET | `/api/simulation/state` | Current simulation state |
| POST | `/api/simulation/start` | Start simulation |
| POST | `/api/simulation/pause` | Pause simulation |
| POST | `/api/simulation/reset` | Reset simulation |
| POST | `/api/simulation/step` | Execute next event |
| GET | `/api/system/status` | Live API connectivity check |
| GET | `/api/system/weather` | Weather data (Open-Meteo) |
| GET | `/api/system/earthquakes` | Earthquake data (USGS) |
| WS | `/ws/live` | Real-time WebSocket feed |

---

## Core Algorithms

### Lifeline Loss Engine (0-100 score)
Weighted sum of infrastructure failure factors:
- Road Connectivity: max 25 points
- Bridge Failure: max 20 points
- Hospital Access: max 15 points
- Water Disruption: max 15 points
- Alternative Routes: max 10 points
- Communication Status: max 8 points
- Shelter Access: max 7 points

### Graph Connectivity (BFS)
Regional infrastructure represented as a NetworkX graph.
Communities are checked against essential facilities (hospitals, warehouses, water) using BFS.
Isolation is confirmed algorithmically when no operational path exists.

### Route Optimisation (Dijkstra)
Edge weights = `distance_km × risk_multiplier` where:
- OPERATIONAL: 1.0×
- DEGRADED: 1.5×
- HIGH flood risk: 5.0× penalty
- FAILED/BLOCKED: ∞ (excluded)

---

## Security Notes

- No API secrets are stored in frontend code
- All sensitive configuration uses environment variables
- `.env` files are git-ignored
- The System Status page shows only "Configured ✓" or "Not Configured ○" — never the actual key

---

## Claims Policy

This application:
- Never claims guaranteed rescue or 100% safe routes
- Uses "currently viable" instead of "safe"
- Labels all simulation data clearly as SIMULATION
- Labels all historical data with verified sources
- Displays confidence indicators, not certainties
- Does not fabricate statistics or research papers
