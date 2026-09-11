# LIFELINE 2.0 — Production Implementation Guide

Welcome to the LIFELINE 2.0 repository! 

This guide is designed for developers and engineers who are taking this Smart India Hackathon (SIH) prototype and turning it into a **production-ready, real-world application**.

Currently, the repository is configured as a highly-polished prototype. It uses pre-seeded database values (the "Kothi Flash Flood" scenario) and a deterministic simulation engine to demonstrate the core innovation: the **Lifeline Loss Algorithm** and **Dynamic Graph Rerouting**.

To win SIH and deploy this for real disaster management agencies (NDMA, SDMAs), you must replace the simulated data pipelines with live data ingestion. This document outlines exactly how to do that.

---

## 1. Local Installation & Setup (Prototype Mode)

Before modifying the architecture, ensure you can run the current prototype locally.

### Prerequisites
* Python 3.10+
* Node.js 18+
* npm or yarn

### Backend Setup
```bash
git clone <repository_url>
cd lifeline2.0/backend

# Create and activate virtual environment
python3 -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Setup environment variables
cp ../.env.example .env

# Run the server (Database is auto-seeded on first run)
uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
```

### Frontend Setup
```bash
cd ../frontend

# Install dependencies
npm install

# Start development server
npm run dev
```

---

## 2. The Architecture Shift: Prototype ➡️ Production

To make this a real system, you need to transition three major components:
1. **The Data Layer:** Move from static SQLite to a spatial database (PostGIS).
2. **The Graph Engine:** Move from hardcoded nodes/edges to real OpenStreetMap (OSM) data.
3. **The Event Engine:** Move from a manual "Scenario Simulator" to real-time Webhooks/API polling.

### Phase 1: Database Migration (PostgreSQL + PostGIS)
Currently, `app/database.py` uses SQLite (`aiosqlite`). Real disaster management requires spatial queries (e.g., "Find all communities within 10km of this flood polygon").

**Action Items:**
1. Install PostgreSQL and the PostGIS extension.
2. Install `asyncpg` and `geoalchemy2` in Python: `pip install asyncpg geoalchemy2`.
3. Update `backend/.env`:
   ```env
   DATABASE_URL=postgresql+asyncpg://user:password@localhost/lifeline
   ```
4. Update `app/models/models.py` to use `Geometry` types for `lat`/`lng` columns.

### Phase 2: Generating the Real Infrastructure Graph
Currently, `seed.py` creates a tiny, hardcoded graph of 17 nodes. A real system needs the actual road network of a state.

**Action Items:**
1. Use **OSMnx** (`pip install osmnx`) to download the real road network for your target region (e.g., Himachal Pradesh).
   ```python
   import osmnx as ox
   # Download the road network for a specific region
   G = ox.graph_from_place('Himachal Pradesh, India', network_type='drive')
   ```
2. Save this graph to a graph database (like Neo4j) OR serialize it and load it into your `RegionGraph` class in `app/algorithms/graph_engine.py`.
3. Map real Hospitals, Warehouses (NDRF bases), and Communities to the nearest nodes on this OSM graph.

### Phase 3: Real-Time Data Ingestion
Currently, the `SimulationEngine` (`app/services/simulation_service.py`) triggers fake events. You must replace this with a background task queue (like **Celery** or **APScheduler**) that constantly fetches real data.

**Required Live Feeds:**
1. **Weather/Rainfall:** Integrate the **IMD (Indian Meteorological Department)** API or Open-Meteo for real-time rainfall data. If rainfall > threshold, increase flood risk on nearby graph edges.
2. **Earthquakes:** Connect to the **USGS Earthquake API** or **NCS (National Center for Seismology)** API.
3. **Disaster Alerts:** Connect to **GDACS** via their RSS/API feeds to get global disaster alerts.

**How to implement:**
Create a new file `app/services/data_ingestion.py`:
```python
# Example: Fetching live alerts and updating the graph
async def fetch_live_disasters():
    # 1. Hit NDMA/GDACS API
    # 2. Extract disaster polygons/coordinates
    # 3. Find all infrastructure nodes/edges inside that polygon
    # 4. Mark them as FAILED or BLOCKED in graph_engine.py
    # 5. Recalculate Lifeline Loss for affected communities
    # 6. Broadcast updates via WebSocket
```

### Phase 4: Real-World Routing Engine
Currently, `app/routers/routes.py` runs a custom Dijkstra algorithm on the small graph. For real-world roads (millions of nodes), you should use an external routing API, combined with your risk logic.

**Action Items:**
1. Register for **OpenRouteService (ORS)** or **Mapbox Directions API**.
2. Set `ROUTING_API_KEY=your_key` in `.env`.
3. When calculating a route, send a request to ORS. If ORS returns a route that passes through a blocked edge (based on your disaster data), use the ORS "Avoid Polygons" feature to force the API to route *around* the disaster zone.

---

## 3. Connecting the API Keys

To activate the real-world dashboards currently built into the frontend (System Status, Live Weather), you need to configure the `.env` file in the `backend/` folder.

```env
# --- REQUIRED FOR PRODUCTION ---

# 1. Weather Data (Currently uses free Open-Meteo, no key needed)
OPEN_METEO_BASE_URL="https://api.open-meteo.com/v1"

# 2. Earthquake Data (USGS, no key needed)
USGS_BASE_URL="https://earthquake.usgs.gov/fdsnws/event/1"

# 3. Disaster Alerts (GDACS)
GDACS_BASE_URL="https://www.gdacs.org"

# --- OPTIONAL / PREMIUM APIS ---

# Map Provider (Used by Leaflet in frontend)
# If left blank, uses default OpenStreetMap/CARTO.
MAP_PROVIDER="mapbox"
MAP_API_KEY="pk.eyJ1...your_mapbox_key_here..."

# Routing Provider
ROUTING_PROVIDER="openrouteservice"
ROUTING_API_KEY="5b3ce3e...your_ors_key_here..."
```
*Note: If you add `MAP_API_KEY`, ensure the frontend `vite.config.ts` or `client.ts` is updated to inject this key into the Leaflet TileLayer.*

---

## 4. The "Winning" SIH Pitch Strategy

If you are presenting this to judges, **honesty about data is key**. 

1. **Acknowledge the Prototype:** Tell the judges: *"For this 36-hour hackathon, we built the algorithm and the real-time processing engine. We are demonstrating it using a simulated high-fidelity scenario (Kothi Flash Flood) to prove the math works."*
2. **Show the Algorithm, Not Just the Map:** Don't just show them a map with dots. Show them the **Isolation Intelligence** page. Explain the *Lifeline Loss Engine* formula. This proves you built a mathematical model, not just a UI.
3. **Explain the Real-World Roadmap:** Show them this exact document. Say: *"If deployed by the NDMA tomorrow, we would swap out our static graph for OSMnx and attach our webhooks to the IMD API. The architecture is already designed to support this."*
4. **The Core USP:** Reinforce your unique selling proposition: *"Everyone else built a dashboard that shows where the flood is. We built a system that calculates exactly who is isolated because of it, and exactly how to reach them."*

---

## Final Checklist for Production Deployment

- [ ] Swap SQLite for PostgreSQL/PostGIS.
- [ ] Delete `app/models/seed.py` and replace with a script that loads state-level OSM data.
- [ ] Replace `simulation_service.py` with `data_ingestion.py` (Celery/APScheduler).
- [ ] Add real API keys to `.env`.
- [ ] Dockerize the application (`Dockerfile` for FastAPI, `Dockerfile` for Vite/Nginx).
- [ ] Deploy backend to AWS EC2 / Google Cloud Run.
- [ ] Deploy frontend to Vercel / Netlify / AWS S3.

Good luck, and build something that saves lives!
