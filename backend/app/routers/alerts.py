from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.database import get_db
from app.models.models import Alert as AlertModel
from app.services.simulation_service import simulation_engine
from datetime import datetime, timezone

router = APIRouter(prefix="/api/alerts", tags=["alerts"])


@router.get("")
async def get_alerts(db: AsyncSession = Depends(get_db)):
    result = await db.execute(
        select(AlertModel).order_by(AlertModel.created_at.desc()).limit(50)
    )
    db_alerts = result.scalars().all()
    
    # Merge DB alerts with live simulation alerts
    db_list = [
        {
            "id": a.id,
            "severity": a.severity,
            "title": a.title,
            "message": a.message,
            "location": a.location,
            "component": a.component,
            "recommended_action": a.recommended_action,
            "is_read": a.is_read,
            "created_at": a.created_at.isoformat() if a.created_at else None,
            "is_simulated": a.is_simulated,
            "source": "database",
        }
        for a in db_alerts
    ]
    
    sim_alerts = [
        {**a, "source": "simulation"}
        for a in simulation_engine.state.alerts
    ]
    
    # Combine, dedup by title, sort by time
    all_alerts = sim_alerts + db_list
    return sorted(all_alerts, key=lambda x: x.get("created_at") or "", reverse=True)[:50]


@router.get("/resources")
async def get_resources(db: AsyncSession = Depends(get_db)):
    from app.models.models import Resource, Infrastructure
    result = await db.execute(select(Resource))
    resources = result.scalars().all()
    return [
        {
            "id": r.id,
            "warehouse_id": r.warehouse_id,
            "resource_type": r.resource_type,
            "quantity": r.quantity,
            "unit": r.unit,
        }
        for r in resources
    ]
