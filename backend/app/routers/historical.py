from fastapi import APIRouter, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.database import get_db
from app.models.models import HistoricalEvent
from typing import Optional

router = APIRouter(prefix="/api/historical", tags=["historical"])


@router.get("")
async def get_historical_events(
    disaster_type: Optional[str] = Query(None),
    year: Optional[int] = Query(None),
    region: Optional[str] = Query(None),
    db: AsyncSession = Depends(get_db),
):
    query = select(HistoricalEvent)
    if disaster_type:
        query = query.where(HistoricalEvent.disaster_type == disaster_type)
    if year:
        query = query.where(HistoricalEvent.year == year)
    if region:
        query = query.where(HistoricalEvent.region.ilike(f"%{region}%"))
    
    result = await db.execute(query.order_by(HistoricalEvent.year.desc()))
    events = result.scalars().all()
    
    return [
        {
            "id": e.id,
            "name": e.name,
            "disaster_type": e.disaster_type,
            "year": e.year,
            "region": e.region,
            "country": e.country,
            "affected_population": e.affected_population,
            "deaths": e.deaths,
            "displaced": e.displaced,
            "infrastructure_damage_desc": e.infrastructure_damage_desc,
            "accessibility_challenges": e.accessibility_challenges,
            "response_challenges": e.response_challenges,
            "source": e.source,
            "lat": e.lat,
            "lng": e.lng,
            "data_label": "HISTORICAL DATA",
        }
        for e in events
    ]
