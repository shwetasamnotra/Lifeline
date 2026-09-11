from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.database import get_db
from app.models.models import Community
from app.algorithms.lifeline_loss import calculate_lifeline_loss, get_community_status_from_score
from app.services.simulation_service import simulation_engine

router = APIRouter(prefix="/api/communities", tags=["communities"])


def _community_dict(c: Community) -> dict:
    return {
        "id": c.id, "name": c.name, "lat": c.lat, "lng": c.lng,
        "population": c.population, "status": c.status,
        "lifeline_loss_score": c.lifeline_loss_score,
        "road_connectivity": c.road_connectivity,
        "bridge_accessible": c.bridge_accessible,
        "hospital_access": c.hospital_access,
        "shelter_access": c.shelter_access,
        "water_access": c.water_access,
        "communication": c.communication,
        "alternative_routes": c.alternative_routes,
        "infrastructure_damage": c.infrastructure_damage,
        "is_simulated": c.is_simulated,
        "updated_at": c.updated_at.isoformat() if c.updated_at else None,
        "needs": c.needs or [],
        "cause_of_isolation": c.cause_of_isolation or [],
    }


@router.get("")
async def get_communities(db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Community))
    communities = result.scalars().all()
    
    # Merge with live simulation state
    sim_state = simulation_engine.state.community_status
    
    output = []
    for c in communities:
        d = _community_dict(c)
        if c.name in sim_state:
            # Override with live simulation data
            live = sim_state[c.name]
            for key, val in live.items():
                if key in d:
                    d[key] = val
        output.append(d)
    return output


@router.get("/{community_id}")
async def get_community(community_id: int, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Community).where(Community.id == community_id))
    c = result.scalar_one_or_none()
    if not c:
        from fastapi import HTTPException
        raise HTTPException(status_code=404, detail="Community not found")
    
    d = _community_dict(c)
    sim_state = simulation_engine.state.community_status
    if c.name in sim_state:
        for key, val in sim_state[c.name].items():
            if key in d:
                d[key] = val
    return d


@router.get("/{community_id}/lifeline")
async def get_community_lifeline(community_id: int, db: AsyncSession = Depends(get_db)):
    """Calculate and return the Lifeline Loss breakdown for a community."""
    result = await db.execute(select(Community).where(Community.id == community_id))
    c = result.scalar_one_or_none()
    if not c:
        from fastapi import HTTPException
        raise HTTPException(status_code=404, detail="Community not found")
    
    d = _community_dict(c)
    sim_state = simulation_engine.state.community_status
    if c.name in sim_state:
        for key, val in sim_state[c.name].items():
            if key in d:
                d[key] = val
    
    # Run actual Lifeline Loss calculation
    lifeline_result = calculate_lifeline_loss(d)
    
    # Also get graph connectivity
    node_id_map = {
        "Kothi Village": "community_kothi",
        "Rampur Town": "community_rampur",
        "Banjara Settlement": "community_banjara",
        "Nirmand Village": "community_nirmand",
    }
    from app.algorithms.graph_engine import region_graph
    node_id = node_id_map.get(c.name)
    connectivity = None
    if node_id:
        connectivity = region_graph.is_community_connected(node_id)
    
    return {
        "community": d,
        "lifeline_loss": lifeline_result,
        "graph_connectivity": connectivity,
        "data_label": "SIMULATION" if c.is_simulated else "LIVE",
    }
