from fastapi import APIRouter
from app.services.simulation_service import simulation_engine
from pydantic import BaseModel

router = APIRouter(prefix="/api/simulation", tags=["simulation"])


@router.get("/state")
async def get_state():
    return simulation_engine.get_state()


@router.post("/start")
async def start_simulation():
    await simulation_engine.start()
    return {"status": "started", "state": simulation_engine.get_state()}


@router.post("/pause")
async def pause_simulation():
    await simulation_engine.pause()
    return {"status": "paused", "state": simulation_engine.get_state()}


@router.post("/reset")
async def reset_simulation():
    await simulation_engine.reset()
    return {"status": "reset", "state": simulation_engine.get_state()}


@router.post("/step")
async def next_step():
    event = await simulation_engine.step()
    if event is None:
        return {
            "status": "complete",
            "message": "Simulation scenario complete. Press reset to restart.",
            "state": simulation_engine.get_state()
        }
    return {"status": "stepped", "event": event, "state": simulation_engine.get_state()}


@router.get("/events")
async def get_simulation_events():
    from sqlalchemy import select
    from app.database import AsyncSessionLocal
    from app.models.models import SimulationEvent

    async with AsyncSessionLocal() as db:
        result = await db.execute(
            select(SimulationEvent)
            .where(SimulationEvent.scenario_id == "kothi_flash_flood")
            .order_by(SimulationEvent.step_index)
        )
        events = result.scalars().all()
        return [
            {
                "step_index": e.step_index,
                "time_label": e.time_label,
                "event_type": e.event_type,
                "title": e.title,
                "description": e.description,
                "severity": e.severity,
            }
            for e in events
        ]
