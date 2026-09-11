from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.database import get_db
from app.models.models import Disaster

router = APIRouter(prefix="/api/disasters", tags=["disasters"])

@router.get("")
async def get_disasters(db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Disaster))
    disasters = result.scalars().all()
    return [
        {
            "id": d.id, "name": d.name, "disaster_type": d.disaster_type,
            "severity": d.severity, "status": d.status,
            "lat": d.lat, "lng": d.lng, "radius_km": d.radius_km,
            "affected_population": d.affected_population,
            "description": d.description, "is_simulated": d.is_simulated,
            "started_at": d.started_at.isoformat() if d.started_at else None,
            "updated_at": d.updated_at.isoformat() if d.updated_at else None,
            "metadata": d.metadata_,
        }
        for d in disasters
    ]

@router.get("/{disaster_id}")
async def get_disaster(disaster_id: int, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Disaster).where(Disaster.id == disaster_id))
    d = result.scalar_one_or_none()
    if not d:
        from fastapi import HTTPException
        raise HTTPException(status_code=404, detail="Disaster not found")
    return {
        "id": d.id, "name": d.name, "disaster_type": d.disaster_type,
        "severity": d.severity, "status": d.status,
        "lat": d.lat, "lng": d.lng, "radius_km": d.radius_km,
        "affected_population": d.affected_population,
        "description": d.description, "is_simulated": d.is_simulated,
        "started_at": d.started_at.isoformat() if d.started_at else None,
        "metadata": d.metadata_,
    }
