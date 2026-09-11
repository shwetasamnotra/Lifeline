import asyncio
from contextlib import asynccontextmanager
from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware
from app.config import settings
from app.database import init_db
from app.models.seed import seed_database
from app.routers import disasters, communities, infrastructure, routes, alerts, simulation, historical, system
from app.services.simulation_service import simulation_engine
import json


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup
    await init_db()
    await seed_database()
    yield
    # Shutdown


app = FastAPI(
    title="LIFELINE 2.0 API",
    description="Real-Time Disaster Isolation & Last-Mile Relief Intelligence",
    version="2.0.0",
    lifespan=lifespan,
)

origins = [o.strip() for o in settings.cors_origins.split(",")]
app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(disasters.router)
app.include_router(communities.router)
app.include_router(infrastructure.router)
app.include_router(routes.router)
app.include_router(alerts.router)
app.include_router(simulation.router)
app.include_router(historical.router)
app.include_router(system.router)


@app.get("/")
async def root():
    return {
        "app": "LIFELINE 2.0",
        "status": "operational",
        "description": "Real-Time Disaster Isolation & Last-Mile Relief Intelligence",
        "version": "2.0.0",
        "data_label": "SIMULATION — Prototype for SIH 2026",
    }


@app.websocket("/ws/live")
async def websocket_endpoint(websocket: WebSocket):
    await websocket.accept()
    simulation_engine.add_listener(websocket)
    
    # Send initial state
    await websocket.send_text(json.dumps({
        "type": "CONNECTED",
        "payload": {
            "message": "LIFELINE 2.0 live feed connected.",
            "state": simulation_engine.get_state(),
        }
    }))
    
    try:
        while True:
            # Keep connection alive; client can also send commands
            data = await websocket.receive_text()
            try:
                msg = json.loads(data)
                cmd = msg.get("command")
                if cmd == "ping":
                    await websocket.send_text(json.dumps({"type": "PONG"}))
                elif cmd == "get_state":
                    await websocket.send_text(json.dumps({
                        "type": "STATE_UPDATE",
                        "payload": simulation_engine.get_state()
                    }))
            except json.JSONDecodeError:
                pass
    except WebSocketDisconnect:
        simulation_engine.remove_listener(websocket)
    except Exception:
        simulation_engine.remove_listener(websocket)
