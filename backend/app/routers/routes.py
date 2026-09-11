from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.database import get_db
from app.models.models import Route, ReliefMission
from app.services.simulation_service import simulation_engine
from app.algorithms.graph_engine import region_graph
from pydantic import BaseModel
from typing import Optional

router = APIRouter(prefix="/api/routes", tags=["routes"])


class RouteOptimizeRequest(BaseModel):
    from_node: str
    to_node: str
    avoid_flooded: bool = True


@router.get("")
async def get_routes(db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Route))
    routes = result.scalars().all()
    
    sim_routes = simulation_engine.state.route_status
    sim_rejection = simulation_engine.state.route_rejection_reasons
    recommended = simulation_engine.state.recommended_route
    
    output = []
    for r in routes:
        live_status = sim_routes.get(r.name, r.status)
        output.append({
            "id": r.id, "name": r.name,
            "from_node": r.from_node, "to_node": r.to_node,
            "distance_km": r.distance_km,
            "status": live_status,
            "risk_level": r.risk_level,
            "confidence": r.confidence,
            "waypoints": r.waypoints or [],
            "rejection_reason": sim_rejection.get(r.name, r.rejection_reason),
            "is_recommended": r.name == recommended,
            "is_simulated": r.is_simulated,
        })
    return output


@router.post("/optimize")
async def optimize_route(req: RouteOptimizeRequest):
    """Run Dijkstra's algorithm on the live graph to find optimal route."""
    result = region_graph.find_optimal_route(req.from_node, req.to_node, req.avoid_flooded)
    if result is None:
        return {
            "viable": False,
            "message": "No viable route found. All paths blocked or unavailable.",
            "from_node": req.from_node,
            "to_node": req.to_node,
        }
    return {
        "viable": True,
        "from_node": req.from_node,
        "to_node": req.to_node,
        **result,
        "disclaimer": "Route reflects current graph state. Verify conditions before deployment.",
    }


@router.get("/missions")
async def get_missions(db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(ReliefMission))
    missions = result.scalars().all()
    
    sim_mission_status = simulation_engine.state.mission_status
    sim_mission_route = simulation_engine.state.mission_route
    
    return [
        {
            "id": m.id, "mission_code": m.mission_code,
            "from_warehouse": m.from_warehouse, "to_community": m.to_community,
            "cargo": m.cargo or [],
            "route_name": sim_mission_route.get(m.mission_code, m.route_name),
            "status": sim_mission_status.get(m.mission_code, m.status),
            "priority": m.priority, "is_simulated": m.is_simulated,
            "created_at": m.created_at.isoformat() if m.created_at else None,
        }
        for m in missions
    ]
