from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.database import get_db
from app.models.models import Infrastructure, Resource
from app.services.simulation_service import simulation_engine

router = APIRouter(prefix="/api/infrastructure", tags=["infrastructure"])


@router.get("")
async def get_infrastructure(db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Infrastructure))
    infra_list = result.scalars().all()
    
    sim_infra = simulation_engine.state.infra_status
    
    output = []
    for i in infra_list:
        d = {
            "id": i.id, "name": i.name, "infra_type": i.infra_type,
            "status": sim_infra.get(i.name, i.status),
            "lat": i.lat, "lng": i.lng, "lat_end": i.lat_end, "lng_end": i.lng_end,
            "capacity": i.capacity, "current_load": i.current_load,
            "is_simulated": i.is_simulated,
            "metadata": i.metadata_ or {},
        }
        output.append(d)
    return output


@router.get("/warehouses")
async def get_warehouses(db: AsyncSession = Depends(get_db)):
    result = await db.execute(
        select(Infrastructure).where(Infrastructure.infra_type == "warehouse")
    )
    warehouses = result.scalars().all()
    
    output = []
    for w in warehouses:
        res_result = await db.execute(
            select(Resource).where(Resource.warehouse_id == w.id)
        )
        resources = res_result.scalars().all()
        
        output.append({
            "id": w.id, "name": w.name, "status": w.status,
            "lat": w.lat, "lng": w.lng,
            "capacity": w.capacity, "current_load": w.current_load,
            "resources": [
                {
                    "resource_type": r.resource_type,
                    "quantity": r.quantity,
                    "unit": r.unit,
                }
                for r in resources
            ],
        })
    return output
