from app.models.models import (
    Disaster, Community, Infrastructure, Resource, Route,
    ReliefMission, Alert, HistoricalEvent, SimulationEvent, DataSource
)
from app.database import AsyncSessionLocal
from datetime import datetime, timezone


async def seed_database():
    """Seed the database with demonstration data for the Kothi Flash Flood scenario."""
    async with AsyncSessionLocal() as db:
        # Check if already seeded
        from sqlalchemy import select
        result = await db.execute(select(Community).limit(1))
        if result.scalar():
            return  # Already seeded

        # =============================================
        # DISASTERS
        # =============================================
        disasters = [
            Disaster(
                name="Kothi Flash Flood",
                disaster_type="flood",
                severity="HIGH",
                status="ACTIVE",
                lat=31.85,
                lng=77.10,
                radius_km=8.0,
                affected_population=2800,
                description="Flash flood triggered by heavy monsoon rainfall in the Kothi valley region.",
                is_simulated=True,
                metadata_={"intensity": "HIGH", "rainfall_mm": 180}
            ),
            Disaster(
                name="Shimla Landslide Risk",
                disaster_type="landslide",
                severity="MODERATE",
                status="MONITORING",
                lat=31.10,
                lng=77.17,
                radius_km=5.0,
                affected_population=1200,
                description="Potential landslide zones identified near NH-5 due to soil saturation.",
                is_simulated=True,
                metadata_={"soil_saturation": 0.82}
            ),
        ]
        db.add_all(disasters)

        # =============================================
        # INFRASTRUCTURE
        # =============================================
        infra = [
            # Warehouses
            Infrastructure(
                name="Warehouse Alpha", infra_type="warehouse", status="OPERATIONAL",
                lat=31.92, lng=77.02, capacity=10000, current_load=7700, is_simulated=True
            ),
            Infrastructure(
                name="Warehouse Beta", infra_type="warehouse", status="OPERATIONAL",
                lat=31.78, lng=77.25, capacity=8000, current_load=3600, is_simulated=True
            ),
            # Hospitals
            Infrastructure(
                name="District Hospital Rampur", infra_type="hospital", status="OPERATIONAL",
                lat=31.90, lng=77.05, capacity=200, current_load=85, is_simulated=True
            ),
            Infrastructure(
                name="Primary Health Centre Kothi", infra_type="hospital", status="DEGRADED",
                lat=31.86, lng=77.09, capacity=30, current_load=28, is_simulated=True
            ),
            # Shelters
            Infrastructure(
                name="Rampur Relief Camp", infra_type="shelter", status="OPERATIONAL",
                lat=31.91, lng=77.04, capacity=500, current_load=120, is_simulated=True
            ),
            Infrastructure(
                name="Kothi School Shelter", infra_type="shelter", status="OPERATIONAL",
                lat=31.85, lng=77.11, capacity=150, current_load=30, is_simulated=True
            ),
            # Water Points
            Infrastructure(
                name="Water Treatment Rampur", infra_type="water_point", status="OPERATIONAL",
                lat=31.92, lng=77.03, capacity=50000, current_load=0, is_simulated=True
            ),
            # Bridges - Bridge B-03 is the key one that fails
            Infrastructure(
                name="Bridge B-03 (Kothi River)", infra_type="bridge", status="OPERATIONAL",
                lat=31.875, lng=77.08, lat_end=31.860, lng_end=77.095,
                capacity=10, current_load=3, is_simulated=True,
                metadata_={"bridge_id": "B-03", "type": "suspension", "age_years": 35}
            ),
            Infrastructure(
                name="Bridge B-07 (Alternate Crossing)", infra_type="bridge", status="OPERATIONAL",
                lat=31.870, lng=77.15, lat_end=31.855, lng_end=77.16,
                capacity=8, current_load=0, is_simulated=True,
                metadata_={"bridge_id": "B-07", "type": "concrete", "age_years": 12}
            ),
            # Roads
            Infrastructure(
                name="Primary Road NH-5 Segment", infra_type="road", status="OPERATIONAL",
                lat=31.92, lng=77.02, lat_end=31.875, lng_end=77.08,
                capacity=100, current_load=20, is_simulated=True,
                metadata_={"road_id": "RD-A", "surface": "paved"}
            ),
            Infrastructure(
                name="Valley Road (Flood Zone)", infra_type="road", status="OPERATIONAL",
                lat=31.875, lng=77.08, lat_end=31.85, lng_end=77.10,
                capacity=60, current_load=10, is_simulated=True,
                metadata_={"road_id": "RD-B", "surface": "paved", "flood_risk": "HIGH"}
            ),
            Infrastructure(
                name="Mountain Alternate Road", infra_type="road", status="OPERATIONAL",
                lat=31.90, lng=77.12, lat_end=31.85, lng_end=77.10,
                capacity=40, current_load=5, is_simulated=True,
                metadata_={"road_id": "RD-C", "surface": "gravel", "flood_risk": "LOW"}
            ),
            Infrastructure(
                name="Northern Bypass Road", infra_type="road", status="OPERATIONAL",
                lat=31.95, lng=77.15, lat_end=31.85, lng_end=77.10,
                capacity=30, current_load=0, is_simulated=True,
                metadata_={"road_id": "RD-D", "surface": "gravel", "flood_risk": "MEDIUM"}
            ),
        ]
        db.add_all(infra)
        await db.flush()

        # =============================================
        # COMMUNITIES
        # =============================================
        communities = [
            Community(
                name="Kothi Village",
                lat=31.85, lng=77.10,
                population=2800,
                status="AT_RISK",
                lifeline_loss_score=25.0,
                road_connectivity=0.9,
                bridge_accessible=True,
                hospital_access="AVAILABLE",
                shelter_access="AVAILABLE",
                water_access="AVAILABLE",
                communication="NORMAL",
                alternative_routes=2,
                infrastructure_damage=0.05,
                is_simulated=True,
                needs=[
                    {"resource": "Water", "priority": "LOW", "quantity": 200},
                    {"resource": "Food", "priority": "LOW", "quantity": 300},
                ],
                cause_of_isolation=[]
            ),
            Community(
                name="Rampur Town",
                lat=31.91, lng=77.04,
                population=12000,
                status="CONNECTED",
                lifeline_loss_score=8.0,
                road_connectivity=1.0,
                bridge_accessible=True,
                hospital_access="AVAILABLE",
                shelter_access="AVAILABLE",
                water_access="AVAILABLE",
                communication="NORMAL",
                alternative_routes=4,
                infrastructure_damage=0.0,
                is_simulated=True,
                needs=[],
                cause_of_isolation=[]
            ),
            Community(
                name="Banjara Settlement",
                lat=31.78, lng=77.22,
                population=450,
                status="AT_RISK",
                lifeline_loss_score=42.0,
                road_connectivity=0.6,
                bridge_accessible=True,
                hospital_access="LIMITED",
                shelter_access="AVAILABLE",
                water_access="AVAILABLE",
                communication="DEGRADED",
                alternative_routes=1,
                infrastructure_damage=0.25,
                is_simulated=True,
                needs=[
                    {"resource": "Medicine", "priority": "HIGH", "quantity": 100},
                    {"resource": "Food", "priority": "MEDIUM", "quantity": 500},
                ],
                cause_of_isolation=["Limited road access", "Communication degraded"]
            ),
            Community(
                name="Nirmand Village",
                lat=31.74, lng=77.06,
                population=800,
                status="CONNECTED",
                lifeline_loss_score=15.0,
                road_connectivity=0.95,
                bridge_accessible=True,
                hospital_access="AVAILABLE",
                shelter_access="AVAILABLE",
                water_access="AVAILABLE",
                communication="NORMAL",
                alternative_routes=3,
                infrastructure_damage=0.02,
                is_simulated=True,
                needs=[],
                cause_of_isolation=[]
            ),
        ]
        db.add_all(communities)
        await db.flush()

        # =============================================
        # RESOURCES
        # =============================================
        resources = [
            Resource(warehouse_id=1, resource_type="Water", quantity=4500, unit="litres"),
            Resource(warehouse_id=1, resource_type="Food", quantity=6000, unit="kg"),
            Resource(warehouse_id=1, resource_type="Medicine", quantity=1200, unit="kits"),
            Resource(warehouse_id=1, resource_type="FirstAid", quantity=800, unit="kits"),
            Resource(warehouse_id=1, resource_type="Blankets", quantity=1500, unit="units"),
            Resource(warehouse_id=1, resource_type="ShelterKit", quantity=200, unit="units"),
            Resource(warehouse_id=2, resource_type="Water", quantity=3000, unit="litres"),
            Resource(warehouse_id=2, resource_type="Food", quantity=4000, unit="kg"),
            Resource(warehouse_id=2, resource_type="Medicine", quantity=600, unit="kits"),
            Resource(warehouse_id=2, resource_type="Blankets", quantity=900, unit="units"),
        ]
        db.add_all(resources)

        # =============================================
        # ROUTES (initial pre-simulation state)
        # =============================================
        routes = [
            Route(
                name="Route A (Primary)",
                from_node="Warehouse Alpha",
                to_node="Kothi Village",
                distance_km=12.0,
                status="VIABLE",
                risk_level="LOW",
                confidence=0.90,
                waypoints=[
                    {"lat": 31.92, "lng": 77.02, "label": "Warehouse Alpha"},
                    {"lat": 31.875, "lng": 77.08, "label": "Bridge B-03"},
                    {"lat": 31.85, "lng": 77.10, "label": "Kothi Village"},
                ],
                is_simulated=True
            ),
            Route(
                name="Route B (Valley Road)",
                from_node="Warehouse Alpha",
                to_node="Kothi Village",
                distance_km=15.0,
                status="VIABLE",
                risk_level="MEDIUM",
                confidence=0.70,
                waypoints=[
                    {"lat": 31.92, "lng": 77.02, "label": "Warehouse Alpha"},
                    {"lat": 31.90, "lng": 77.06, "label": "Junction 2"},
                    {"lat": 31.875, "lng": 77.08, "label": "Valley Road Entry"},
                    {"lat": 31.85, "lng": 77.10, "label": "Kothi Village"},
                ],
                is_simulated=True
            ),
            Route(
                name="Route C (Mountain Road)",
                from_node="Warehouse Alpha",
                to_node="Kothi Village",
                distance_km=18.4,
                status="VIABLE",
                risk_level="LOW",
                confidence=0.82,
                waypoints=[
                    {"lat": 31.92, "lng": 77.02, "label": "Warehouse Alpha"},
                    {"lat": 31.91, "lng": 77.06, "label": "Junction 3"},
                    {"lat": 31.90, "lng": 77.12, "label": "Mountain Road"},
                    {"lat": 31.875, "lng": 77.14, "label": "High Crossing"},
                    {"lat": 31.85, "lng": 77.10, "label": "Kothi Village"},
                ],
                is_simulated=True
            ),
            Route(
                name="Route D (Northern Bypass)",
                from_node="Warehouse Beta",
                to_node="Kothi Village",
                distance_km=22.1,
                status="VIABLE",
                risk_level="MEDIUM",
                confidence=0.75,
                waypoints=[
                    {"lat": 31.78, "lng": 77.25, "label": "Warehouse Beta"},
                    {"lat": 31.85, "lng": 77.20, "label": "Junction 5"},
                    {"lat": 31.87, "lng": 77.155, "label": "Bridge B-07"},
                    {"lat": 31.85, "lng": 77.10, "label": "Kothi Village"},
                ],
                is_simulated=True
            ),
        ]
        db.add_all(routes)
        await db.flush()

        # =============================================
        # RELIEF MISSIONS
        # =============================================
        missions = [
            ReliefMission(
                mission_code="MISSION-001",
                from_warehouse="Warehouse Alpha",
                to_community="Kothi Village",
                cargo=[
                    {"resource": "Water", "quantity": 1500},
                    {"resource": "Medicine", "quantity": 200},
                ],
                route_name="Route A (Primary)",
                status="PLANNED",
                priority=1,
                is_simulated=True
            ),
        ]
        db.add_all(missions)

        # =============================================
        # INITIAL ALERTS
        # =============================================
        alerts = [
            Alert(
                severity="WARNING",
                title="Heavy Rainfall Detected",
                message="Open-Meteo data indicates 180mm rainfall in Kothi valley. Flash flood risk elevated.",
                location="Kothi Valley",
                component="Weather Monitoring",
                recommended_action="Monitor river levels and prepare pre-positioning of relief materials.",
                is_simulated=True
            ),
            Alert(
                severity="INFO",
                title="Banjara Settlement — Limited Access",
                message="Road connectivity to Banjara Settlement at 60%. Communication degraded.",
                location="Banjara Settlement",
                component="Connectivity Graph",
                recommended_action="Deploy communication equipment. Stage relief at nearest junction.",
                is_simulated=True
            ),
        ]
        db.add_all(alerts)

        # =============================================
        # SIMULATION EVENTS (Kothi Flash Flood scenario)
        # =============================================
        sim_events = [
            SimulationEvent(
                scenario_id="kothi_flash_flood",
                step_index=0,
                time_label="14:30",
                event_type="BASELINE",
                title="Normal Operations",
                description="All infrastructure operational. Kothi Village connected. Lifeline Loss: 25.",
                severity="INFO",
                state_changes={"phase": "baseline"}
            ),
            SimulationEvent(
                scenario_id="kothi_flash_flood",
                step_index=1,
                time_label="14:32",
                event_type="HAZARD_DETECTED",
                title="Heavy Rainfall Detected",
                description="Open-Meteo feed reports 180mm cumulative rainfall. Flash flood risk HIGH in Kothi valley.",
                severity="WARNING",
                state_changes={
                    "phase": "rainfall",
                    "disaster_update": {"id": 1, "severity": "HIGH", "status": "ACTIVE"},
                    "new_alert": {
                        "severity": "WARNING",
                        "title": "Heavy Rainfall Alert",
                        "message": "180mm rainfall detected. Flash flood imminent in Kothi valley.",
                        "location": "Kothi Valley",
                        "component": "Weather System",
                        "recommended_action": "Evacuate low-lying areas. Pre-position relief."
                    }
                }
            ),
            SimulationEvent(
                scenario_id="kothi_flash_flood",
                step_index=2,
                time_label="14:33",
                event_type="INFRASTRUCTURE_FAILURE",
                title="Bridge B-03 — FAILURE",
                description="Structural failure of Bridge B-03 confirmed. Primary access route severed.",
                severity="CRITICAL",
                state_changes={
                    "phase": "bridge_failure",
                    "infra_update": {"name": "Bridge B-03 (Kothi River)", "status": "FAILED"},
                    "route_updates": [
                        {"name": "Route A (Primary)", "status": "REJECTED", "rejection_reason": "Bridge B-03 failed", "risk_level": "CRITICAL"},
                    ],
                    "new_alert": {
                        "severity": "CRITICAL",
                        "title": "Bridge B-03 — STRUCTURAL FAILURE",
                        "message": "Bridge B-03 over Kothi River has failed. Primary road access to Kothi Village severed.",
                        "location": "Bridge B-03, Kothi River",
                        "component": "Bridge Infrastructure",
                        "recommended_action": "Activate alternate route planning. Deploy emergency response."
                    }
                }
            ),
            SimulationEvent(
                scenario_id="kothi_flash_flood",
                step_index=3,
                time_label="14:34",
                event_type="ROAD_BLOCKED",
                title="Valley Road — FLOODED",
                description="Valley Road (RD-B) inundated. Route B no longer viable.",
                severity="HIGH",
                state_changes={
                    "phase": "road_blocked",
                    "infra_update": {"name": "Valley Road (Flood Zone)", "status": "BLOCKED"},
                    "route_updates": [
                        {"name": "Route B (Valley Road)", "status": "REJECTED", "rejection_reason": "Road flooded", "risk_level": "HIGH"},
                    ],
                    "new_alert": {
                        "severity": "HIGH",
                        "title": "Valley Road — FLOODED",
                        "message": "Valley Road inundated by flash flood. Route B blocked.",
                        "location": "Valley Road, Kothi",
                        "component": "Road Infrastructure",
                        "recommended_action": "Reroute all relief convoys via mountain roads."
                    }
                }
            ),
            SimulationEvent(
                scenario_id="kothi_flash_flood",
                step_index=4,
                time_label="14:34",
                event_type="ISOLATION_DETECTED",
                title="Kothi Village — ISOLATED",
                description="Graph connectivity analysis confirms Kothi Village has lost connection to all primary facilities.",
                severity="CRITICAL",
                state_changes={
                    "phase": "isolation",
                    "community_update": {
                        "name": "Kothi Village",
                        "status": "CRITICALLY_ISOLATED",
                        "lifeline_loss_score": 87.0,
                        "road_connectivity": 0.1,
                        "bridge_accessible": False,
                        "hospital_access": "LIMITED",
                        "water_access": "CRITICAL",
                        "communication": "DEGRADED",
                        "alternative_routes": 0,
                        "infrastructure_damage": 0.65,
                        "needs": [
                            {"resource": "Water", "priority": "CRITICAL", "quantity": 1500},
                            {"resource": "Medicine", "priority": "CRITICAL", "quantity": 400},
                            {"resource": "Food", "priority": "HIGH", "quantity": 2000},
                            {"resource": "FirstAid", "priority": "HIGH", "quantity": 300},
                            {"resource": "Blankets", "priority": "MEDIUM", "quantity": 500},
                        ],
                        "cause_of_isolation": [
                            "Primary Bridge B-03 failure",
                            "Valley Road flooded",
                            "Reduced hospital accessibility",
                            "Water supply disrupted"
                        ]
                    },
                    "new_alert": {
                        "severity": "CRITICAL",
                        "title": "ISOLATION CONFIRMED — Kothi Village",
                        "message": "Graph analysis confirms Kothi Village is CRITICALLY ISOLATED. Lifeline Loss: 87/100. Population at risk: 2,800.",
                        "location": "Kothi Village",
                        "component": "Isolation Detection Engine",
                        "recommended_action": "Initiate emergency relief mission immediately."
                    }
                }
            ),
            SimulationEvent(
                scenario_id="kothi_flash_flood",
                step_index=5,
                time_label="14:35",
                event_type="NEEDS_IDENTIFIED",
                title="Critical Needs Identified",
                description="System has prioritized community needs: Water (CRITICAL), Medicine (CRITICAL), Food (HIGH).",
                severity="HIGH",
                state_changes={"phase": "needs_identified"}
            ),
            SimulationEvent(
                scenario_id="kothi_flash_flood",
                step_index=6,
                time_label="14:36",
                event_type="RESOURCE_MATCHED",
                title="Relief Resources Matched",
                description="Warehouse Alpha: Water 4500L (need: 1500), Medicine 1200 kits (need: 400), Food 6000kg (need: 2000). MATCH FOUND.",
                severity="INFO",
                state_changes={"phase": "resource_matched"}
            ),
            SimulationEvent(
                scenario_id="kothi_flash_flood",
                step_index=7,
                time_label="14:37",
                event_type="ROUTE_RECOMMENDED",
                title="Route C — CURRENTLY VIABLE",
                description="Routes A (bridge failure) and B (flooded) rejected. Route C via Mountain Road: 18.4km, risk: LOW, confidence: 82%. Verify conditions before deployment.",
                severity="INFO",
                state_changes={
                    "phase": "route_recommended",
                    "route_updates": [
                        {"name": "Route C (Mountain Road)", "status": "RECOMMENDED", "risk_level": "LOW"},
                    ],
                    "mission_update": {
                        "mission_code": "MISSION-001",
                        "route_name": "Route C (Mountain Road)",
                        "status": "IN_TRANSIT"
                    },
                    "new_alert": {
                        "severity": "INFO",
                        "title": "MISSION-001 — Route C Recommended",
                        "message": "Route C (18.4km, Mountain Road) selected as currently viable. Convoy dispatched from Warehouse Alpha.",
                        "location": "Warehouse Alpha → Kothi Village",
                        "component": "Route Optimisation Engine",
                        "recommended_action": "Verify conditions at Mountain Road entry before deployment."
                    }
                }
            ),
            SimulationEvent(
                scenario_id="kothi_flash_flood",
                step_index=8,
                time_label="14:38",
                event_type="ROUTE_INTERRUPTED",
                title="NEW FLOODING — Route C Blocked",
                description="Secondary flood surge detected. Mountain Road entry flooded. Route C no longer viable. Recalculating...",
                severity="CRITICAL",
                state_changes={
                    "phase": "rerouting",
                    "infra_update": {"name": "Mountain Alternate Road", "status": "BLOCKED"},
                    "route_updates": [
                        {"name": "Route C (Mountain Road)", "status": "BLOCKED", "rejection_reason": "New flooding", "risk_level": "CRITICAL"},
                        {"name": "Route D (Northern Bypass)", "status": "RECOMMENDED", "risk_level": "MEDIUM"},
                    ],
                    "mission_update": {
                        "mission_code": "MISSION-001",
                        "route_name": "Route D (Northern Bypass)",
                        "status": "REROUTING"
                    },
                    "new_alert": {
                        "severity": "CRITICAL",
                        "title": "⚠ ROUTE CHANGE — Route C Inaccessible",
                        "message": "Route C blocked by new flooding. System recalculating. NEW RECOMMENDED ROUTE: Route D (Northern Bypass, 22.1km via Warehouse Beta).",
                        "location": "Mountain Road Entry",
                        "component": "Live Rerouting Engine",
                        "recommended_action": "Redirect convoy to Route D via Northern Bypass. Confirm Bridge B-07 status."
                    }
                }
            ),
            SimulationEvent(
                scenario_id="kothi_flash_flood",
                step_index=9,
                time_label="14:39",
                event_type="MISSION_UPDATED",
                title="MISSION-001 — Rerouted to Route D",
                description="Convoy rerouted via Route D (Northern Bypass, 22.1km). Estimated arrival recalculated. Mission status: IN TRANSIT via new route.",
                severity="INFO",
                state_changes={
                    "phase": "rerouted",
                    "mission_update": {
                        "mission_code": "MISSION-001",
                        "route_name": "Route D (Northern Bypass)",
                        "status": "IN_TRANSIT"
                    }
                }
            ),
        ]
        db.add_all(sim_events)

        # =============================================
        # HISTORICAL EVENTS
        # =============================================
        historical = [
            HistoricalEvent(
                name="Uttarakhand Flash Floods",
                disaster_type="flood",
                year=2013,
                region="Uttarakhand",
                country="India",
                affected_population=100000,
                deaths=5700,
                displaced=200000,
                infrastructure_damage_desc="Over 4,200 km of roads damaged. Dozens of bridges washed away. Char Dham route disrupted for months.",
                accessibility_challenges="Remote Himalayan terrain made aerial assessment the only option for several districts. Ground access restored only after weeks of engineering work.",
                response_challenges="Lack of real-time connectivity maps meant rescuers could not identify which villages were isolated. Resources were not pre-positioned based on isolation risk.",
                source="NDMA India (National Disaster Management Authority) — Report 2013. Data is verified historical information.",
                lat=30.73, lng=78.90
            ),
            HistoricalEvent(
                name="Kerala Floods",
                disaster_type="flood",
                year=2018,
                region="Kerala",
                country="India",
                affected_population=5400000,
                deaths=483,
                displaced=1400000,
                infrastructure_damage_desc="Over 10,000 km of roads damaged. 134 bridges damaged. Multiple districts isolated for several days.",
                accessibility_challenges="Landslides cut off hill districts. Last-mile connectivity to tribal settlements was severely impaired.",
                response_challenges="Resource allocation was hampered by incomplete isolation mapping. Some communities waited 72+ hours for relief despite warehouses being 30km away.",
                source="Kerala State Disaster Management Authority (KSDMA) — 2018 Flood Report.",
                lat=10.85, lng=76.27
            ),
            HistoricalEvent(
                name="Assam Floods",
                disaster_type="flood",
                year=2022,
                region="Assam",
                country="India",
                affected_population=5500000,
                deaths=192,
                displaced=800000,
                infrastructure_damage_desc="Roads in Brahmaputra floodplain extensively damaged. NH-27 breached in multiple locations.",
                accessibility_challenges="Over 60 revenue circles isolated. Animal reserves and low-lying areas submerged.",
                response_challenges="Relief distribution delayed due to difficulty identifying isolated sub-districts. Communication blackouts in remote areas.",
                source="Assam State Disaster Management Authority (ASDMA) — 2022 Flood Response Report.",
                lat=26.14, lng=91.74
            ),
            HistoricalEvent(
                name="Sikkim Glacial Lake Outburst Flood (GLOF)",
                disaster_type="flood",
                year=2023,
                region="Sikkim",
                country="India",
                affected_population=80000,
                deaths=77,
                displaced=8000,
                infrastructure_damage_desc="Teesta River caused extensive damage. Chungthang dam severely impacted. NH-10 disrupted.",
                accessibility_challenges="North Sikkim districts completely cut off for extended periods. Aerial operations were the sole access method.",
                response_challenges="Absence of real-time connectivity and route viability data significantly impaired early rescue operations.",
                source="National Disaster Response Force (NDRF) — Operation Report 2023. NDMA India.",
                lat=27.53, lng=88.43
            ),
        ]
        db.add_all(historical)

        # =============================================
        # DATA SOURCES
        # =============================================
        data_sources = [
            DataSource(
                name="Open-Meteo Weather API",
                source_type="LIVE",
                url="https://api.open-meteo.com/v1",
                status="CONNECTED",
                requires_key=False,
                key_configured=True,
                fallback_active=False,
                description="Free weather API. No API key required. Provides precipitation, temperature, and forecast data."
            ),
            DataSource(
                name="USGS Earthquake Feed",
                source_type="LIVE",
                url="https://earthquake.usgs.gov/fdsnws/event/1",
                status="CONNECTED",
                requires_key=False,
                key_configured=True,
                fallback_active=False,
                description="USGS real-time earthquake event feed. No API key required."
            ),
            DataSource(
                name="GDACS Global Alerts",
                source_type="LIVE",
                url="https://www.gdacs.org",
                status="OFFLINE",
                requires_key=False,
                key_configured=True,
                fallback_active=True,
                description="Global Disaster Alert and Coordination System. Public RSS/API feed."
            ),
            DataSource(
                name="OpenStreetMap Tiles",
                source_type="LIVE",
                url="https://tile.openstreetmap.org",
                status="CONNECTED",
                requires_key=False,
                key_configured=True,
                fallback_active=False,
                description="OpenStreetMap base map tiles. No API key required."
            ),
            DataSource(
                name="Routing Engine (Internal)",
                source_type="SIMULATED",
                url="internal://graph-engine",
                status="CONNECTED",
                requires_key=False,
                key_configured=True,
                fallback_active=False,
                description="Internal Dijkstra/A* graph routing. No external API required."
            ),
            DataSource(
                name="Simulation Engine",
                source_type="SIMULATED",
                url="internal://simulation",
                status="CONNECTED",
                requires_key=False,
                key_configured=True,
                fallback_active=False,
                description="Deterministic simulation state machine for the Kothi Flash Flood scenario."
            ),
        ]
        db.add_all(data_sources)

        await db.commit()
