from sqlalchemy import Column, Integer, String, Float, Boolean, DateTime, JSON, ForeignKey, Text
from sqlalchemy.orm import relationship
from datetime import datetime, timezone
from app.database import Base


def now_utc():
    return datetime.now(timezone.utc)


class Disaster(Base):
    __tablename__ = "disasters"
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False)
    disaster_type = Column(String, nullable=False)  # flood, earthquake, cyclone, landslide
    severity = Column(String, nullable=False)  # LOW, MODERATE, HIGH, CRITICAL
    status = Column(String, default="ACTIVE")  # ACTIVE, MONITORING, RESOLVED
    lat = Column(Float, nullable=False)
    lng = Column(Float, nullable=False)
    radius_km = Column(Float, default=10.0)
    affected_population = Column(Integer, default=0)
    started_at = Column(DateTime, default=now_utc)
    updated_at = Column(DateTime, default=now_utc, onupdate=now_utc)
    description = Column(Text, default="")
    is_simulated = Column(Boolean, default=True)
    metadata_ = Column("metadata", JSON, default=dict)


class Community(Base):
    __tablename__ = "communities"
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False)
    lat = Column(Float, nullable=False)
    lng = Column(Float, nullable=False)
    population = Column(Integer, default=500)
    status = Column(String, default="CONNECTED")  # CONNECTED, AT_RISK, ISOLATED, CRITICALLY_ISOLATED
    lifeline_loss_score = Column(Float, default=0.0)
    road_connectivity = Column(Float, default=1.0)   # 0-1 factor
    bridge_accessible = Column(Boolean, default=True)
    hospital_access = Column(String, default="AVAILABLE")  # AVAILABLE, LIMITED, CRITICAL, NONE
    shelter_access = Column(String, default="AVAILABLE")
    water_access = Column(String, default="AVAILABLE")
    communication = Column(String, default="NORMAL")  # NORMAL, DEGRADED, LOST
    alternative_routes = Column(Integer, default=2)
    infrastructure_damage = Column(Float, default=0.0)  # 0-1
    is_simulated = Column(Boolean, default=True)
    updated_at = Column(DateTime, default=now_utc, onupdate=now_utc)
    needs = Column(JSON, default=list)  # list of {resource, priority, quantity}
    cause_of_isolation = Column(JSON, default=list)


class Infrastructure(Base):
    __tablename__ = "infrastructure"
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False)
    infra_type = Column(String, nullable=False)  # road, bridge, hospital, shelter, warehouse, water_point
    status = Column(String, default="OPERATIONAL")  # OPERATIONAL, DEGRADED, FAILED, BLOCKED
    lat = Column(Float, nullable=False)
    lng = Column(Float, nullable=False)
    lat_end = Column(Float, nullable=True)  # for roads/bridges
    lng_end = Column(Float, nullable=True)
    capacity = Column(Integer, default=0)
    current_load = Column(Integer, default=0)
    is_simulated = Column(Boolean, default=True)
    updated_at = Column(DateTime, default=now_utc, onupdate=now_utc)
    metadata_ = Column("metadata", JSON, default=dict)


class Resource(Base):
    __tablename__ = "resources"
    id = Column(Integer, primary_key=True, index=True)
    warehouse_id = Column(Integer, ForeignKey("infrastructure.id"), nullable=False)
    resource_type = Column(String, nullable=False)  # Water, Food, Medicine, FirstAid, Blankets, ShelterKit
    quantity = Column(Integer, default=0)
    unit = Column(String, default="units")
    updated_at = Column(DateTime, default=now_utc, onupdate=now_utc)


class Route(Base):
    __tablename__ = "routes"
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False)
    from_node = Column(String, nullable=False)
    to_node = Column(String, nullable=False)
    distance_km = Column(Float, nullable=False)
    status = Column(String, default="VIABLE")  # VIABLE, BLOCKED, RECOMMENDED, REJECTED
    risk_level = Column(String, default="LOW")  # LOW, MEDIUM, HIGH, CRITICAL
    confidence = Column(Float, default=0.85)
    waypoints = Column(JSON, default=list)  # list of {lat, lng, label}
    rejection_reason = Column(String, nullable=True)
    updated_at = Column(DateTime, default=now_utc, onupdate=now_utc)
    is_simulated = Column(Boolean, default=True)


class ReliefMission(Base):
    __tablename__ = "relief_missions"
    id = Column(Integer, primary_key=True, index=True)
    mission_code = Column(String, nullable=False)
    from_warehouse = Column(String, nullable=False)
    to_community = Column(String, nullable=False)
    cargo = Column(JSON, default=list)  # [{resource, quantity}]
    route_id = Column(Integer, ForeignKey("routes.id"), nullable=True)
    route_name = Column(String, nullable=True)
    status = Column(String, default="PLANNED")  # PLANNED, IN_TRANSIT, ROUTE_INTERRUPTED, COMPLETED, REROUTING
    priority = Column(Integer, default=1)
    created_at = Column(DateTime, default=now_utc)
    updated_at = Column(DateTime, default=now_utc, onupdate=now_utc)
    is_simulated = Column(Boolean, default=True)


class Alert(Base):
    __tablename__ = "alerts"
    id = Column(Integer, primary_key=True, index=True)
    severity = Column(String, nullable=False)  # CRITICAL, HIGH, WARNING, INFO
    title = Column(String, nullable=False)
    message = Column(Text, nullable=False)
    location = Column(String, default="")
    component = Column(String, default="")
    recommended_action = Column(String, default="")
    is_read = Column(Boolean, default=False)
    created_at = Column(DateTime, default=now_utc)
    is_simulated = Column(Boolean, default=True)


class HistoricalEvent(Base):
    __tablename__ = "historical_events"
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False)
    disaster_type = Column(String, nullable=False)
    year = Column(Integer, nullable=False)
    region = Column(String, nullable=False)
    country = Column(String, default="India")
    affected_population = Column(Integer, default=0)
    deaths = Column(Integer, nullable=True)
    displaced = Column(Integer, nullable=True)
    infrastructure_damage_desc = Column(Text, default="")
    accessibility_challenges = Column(Text, default="")
    response_challenges = Column(Text, default="")
    source = Column(String, default="")
    lat = Column(Float, nullable=True)
    lng = Column(Float, nullable=True)


class SimulationEvent(Base):
    __tablename__ = "simulation_events"
    id = Column(Integer, primary_key=True, index=True)
    scenario_id = Column(String, nullable=False, default="kothi_flash_flood")
    step_index = Column(Integer, nullable=False)
    time_label = Column(String, nullable=False)
    event_type = Column(String, nullable=False)
    title = Column(String, nullable=False)
    description = Column(Text, default="")
    state_changes = Column(JSON, default=dict)
    severity = Column(String, default="INFO")


class DataSource(Base):
    __tablename__ = "data_sources"
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False)
    source_type = Column(String, nullable=False)  # LIVE, HISTORICAL, SIMULATED
    url = Column(String, default="")
    status = Column(String, default="UNKNOWN")  # CONNECTED, OFFLINE, CONFIGURED, NOT_CONFIGURED
    last_checked = Column(DateTime, nullable=True)
    requires_key = Column(Boolean, default=False)
    key_configured = Column(Boolean, default=False)
    fallback_active = Column(Boolean, default=False)
    description = Column(Text, default="")
