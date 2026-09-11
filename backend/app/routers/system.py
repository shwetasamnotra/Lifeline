from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.database import get_db
from app.models.models import DataSource
from app.config import settings
import httpx
from datetime import datetime, timezone

router = APIRouter(prefix="/api/system", tags=["system"])


async def check_url(url: str, timeout: float = 3.0) -> bool:
    try:
        async with httpx.AsyncClient() as client:
            resp = await client.get(url, timeout=timeout)
            return resp.status_code < 500
    except Exception:
        return False


@router.get("/status")
async def get_system_status(db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(DataSource))
    sources = result.scalars().all()
    
    # Live-check Open-Meteo and USGS (no key required)
    openmeteo_ok = await check_url(f"{settings.open_meteo_base_url}/forecast?latitude=31.85&longitude=77.10&hourly=precipitation")
    usgs_ok = await check_url(f"{settings.usgs_base_url}/query?format=geojson&starttime=2024-01-01&limit=1")
    
    status_map = {
        "Open-Meteo Weather API": "CONNECTED" if openmeteo_ok else "OFFLINE",
        "USGS Earthquake Feed": "CONNECTED" if usgs_ok else "OFFLINE",
        "OpenStreetMap Tiles": "CONNECTED",
        "Routing Engine (Internal)": "CONNECTED",
        "Simulation Engine": "CONNECTED",
        "GDACS Global Alerts": "OFFLINE",
    }
    
    output = []
    for s in sources:
        live_status = status_map.get(s.name, s.status)
        output.append({
            "id": s.id,
            "name": s.name,
            "source_type": s.source_type,
            "url": s.url,
            "status": live_status,
            "requires_key": s.requires_key,
            "key_configured": s.key_configured if s.requires_key else None,
            "fallback_active": live_status == "OFFLINE",
            "description": s.description,
            "checked_at": datetime.now(timezone.utc).isoformat(),
        })
    
    all_critical = [s for s in output if s["status"] == "OFFLINE" and s["source_type"] == "LIVE"]
    
    return {
        "sources": output,
        "overall": "DEGRADED" if all_critical else "OPERATIONAL",
        "fallback_mode": len(all_critical) > 0,
        "simulation_engine": "RUNNING",
        "database": "CONNECTED",
        "api_keys": {
            "map_provider": "configured" if settings.map_api_key else "not_configured",
            "routing_provider": "configured" if settings.routing_api_key else "not_configured",
        },
        "checked_at": datetime.now(timezone.utc).isoformat(),
    }


@router.get("/graph")
async def get_graph_state():
    from app.algorithms.graph_engine import region_graph
    return region_graph.get_graph_state()


@router.get("/weather")
async def get_weather_data():
    """Fetch live weather data from Open-Meteo for Kothi area."""
    url = (
        f"{settings.open_meteo_base_url}/forecast"
        "?latitude=31.85&longitude=77.10"
        "&hourly=precipitation,temperature_2m,rain,windspeed_10m"
        "&current_weather=true&timezone=Asia%2FKolkata&forecast_days=1"
    )
    try:
        async with httpx.AsyncClient() as client:
            resp = await client.get(url, timeout=5.0)
            if resp.status_code == 200:
                data = resp.json()
                current = data.get("current_weather", {})
                return {
                    "source": "LIVE",
                    "provider": "Open-Meteo",
                    "location": "Kothi Valley, Himachal Pradesh (approx.)",
                    "current_temperature_c": current.get("temperature"),
                    "current_windspeed_kmh": current.get("windspeed"),
                    "disclaimer": "Approximate coordinates used for demonstration. Not a verified disaster location.",
                    "data": data,
                }
    except Exception as e:
        pass
    
    # Fallback simulation data
    return {
        "source": "SIMULATION",
        "provider": "Simulation Engine (Open-Meteo unavailable)",
        "location": "Kothi Valley — SIMULATED",
        "current_temperature_c": 14.2,
        "current_windspeed_kmh": 45.0,
        "simulated_rainfall_mm": 180,
        "disclaimer": "This is simulated weather data. Open-Meteo API unavailable.",
    }


@router.get("/earthquakes")
async def get_earthquake_data():
    """Fetch recent earthquake data from USGS for Indian subcontinent region."""
    url = (
        f"{settings.usgs_base_url}/query"
        "?format=geojson&starttime=2024-01-01&endtime=2025-01-01"
        "&minlatitude=8&maxlatitude=37&minlongitude=68&maxlongitude=98"
        "&minmagnitude=4.0&orderby=time&limit=10"
    )
    try:
        async with httpx.AsyncClient() as client:
            resp = await client.get(url, timeout=5.0)
            if resp.status_code == 200:
                data = resp.json()
                features = data.get("features", [])
                return {
                    "source": "HISTORICAL",
                    "provider": "USGS",
                    "count": len(features),
                    "note": "Historical earthquake data (2024) for Indian subcontinent region.",
                    "events": [
                        {
                            "id": f.get("id"),
                            "magnitude": f["properties"].get("mag"),
                            "place": f["properties"].get("place"),
                            "time": f["properties"].get("time"),
                            "lat": f["geometry"]["coordinates"][1] if f.get("geometry") else None,
                            "lng": f["geometry"]["coordinates"][0] if f.get("geometry") else None,
                            "depth_km": f["geometry"]["coordinates"][2] if f.get("geometry") else None,
                        }
                        for f in features
                    ],
                }
    except Exception:
        pass
    
    return {
        "source": "UNAVAILABLE",
        "provider": "USGS (offline or timeout)",
        "count": 0,
        "events": [],
        "note": "USGS API unavailable. No earthquake data to display.",
    }
