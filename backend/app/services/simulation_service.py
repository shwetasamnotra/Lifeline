"""
SIMULATION ENGINE
=================
Deterministic state machine for the Kothi Flash Flood scenario.
State is held in memory (singleton) and broadcast via WebSocket.
"""

import asyncio
from typing import Dict, Any, List, Optional, Set
from datetime import datetime, timezone
from app.algorithms.graph_engine import region_graph


class SimulationState:
    """Holds the complete live state of the simulation."""
    
    def __init__(self):
        self.reset()

    def reset(self):
        self.phase = "baseline"
        self.current_step = 0
        self.is_running = False
        self.is_paused = False
        self.elapsed_steps = 0
        
        # Infrastructure status
        self.infra_status: Dict[str, str] = {}
        
        # Community status
        self.community_status: Dict[str, Dict[str, Any]] = {
            "Kothi Village": {
                "status": "AT_RISK",
                "lifeline_loss_score": 25.0,
                "road_connectivity": 0.9,
                "bridge_accessible": True,
                "hospital_access": "AVAILABLE",
                "shelter_access": "AVAILABLE",
                "water_access": "AVAILABLE",
                "communication": "NORMAL",
                "alternative_routes": 2,
                "infrastructure_damage": 0.05,
                "needs": [
                    {"resource": "Water", "priority": "LOW", "quantity": 200},
                    {"resource": "Food", "priority": "LOW", "quantity": 300},
                ],
                "cause_of_isolation": [],
            }
        }
        
        # Route status
        self.route_status: Dict[str, str] = {
            "Route A (Primary)":       "VIABLE",
            "Route B (Valley Road)":   "VIABLE",
            "Route C (Mountain Road)": "VIABLE",
            "Route D (Northern Bypass)": "VIABLE",
        }
        self.route_rejection_reasons: Dict[str, str] = {}
        self.recommended_route: Optional[str] = None
        
        # Mission status
        self.mission_status: Dict[str, str] = {"MISSION-001": "PLANNED"}
        self.mission_route: Dict[str, str] = {"MISSION-001": "Route A (Primary)"}
        
        # Alert log
        self.alerts: List[Dict[str, Any]] = []
        
        # Active disasters
        self.active_disasters: List[str] = []
        
        # Reset graph
        from app.algorithms.graph_engine import RegionGraph
        self._reset_graph()

    def _reset_graph(self):
        """Rebuild the graph to initial state."""
        from app.algorithms.graph_engine import RegionGraph, region_graph
        # Re-initialize all edges to OPERATIONAL
        for u, v, data in region_graph.G.edges(data=True):
            region_graph.G[u][v]["status"] = "OPERATIONAL"
        for node_id, data in region_graph.G.nodes(data=True):
            if "status" in data:
                region_graph.G.nodes[node_id]["status"] = "OPERATIONAL"

    def get_full_state(self) -> Dict[str, Any]:
        return {
            "phase": self.phase,
            "current_step": self.current_step,
            "is_running": self.is_running,
            "is_paused": self.is_paused,
            "infra_status": self.infra_status,
            "community_status": self.community_status,
            "route_status": self.route_status,
            "route_rejection_reasons": self.route_rejection_reasons,
            "recommended_route": self.recommended_route,
            "mission_status": self.mission_status,
            "mission_route": self.mission_route,
            "alerts": self.alerts[-20:],  # last 20
            "active_disasters": self.active_disasters,
            "kpi": self._compute_kpi(),
            "graph_state": region_graph.get_graph_state(),
        }

    def _compute_kpi(self) -> Dict[str, Any]:
        critical_isolated = sum(
            1 for c in self.community_status.values()
            if c.get("status") == "CRITICALLY_ISOLATED"
        )
        at_risk = sum(
            1 for c in self.community_status.values()
            if c.get("status") in ("AT_RISK", "ISOLATED")
        )
        blocked_routes = sum(
            1 for s in self.route_status.values()
            if s in ("BLOCKED", "REJECTED")
        )
        critical_needs = 0
        for cs in self.community_status.values():
            critical_needs += sum(
                1 for n in cs.get("needs", [])
                if n.get("priority") == "CRITICAL"
            )
        return {
            "active_disasters": len(self.active_disasters),
            "communities_at_risk": at_risk + critical_isolated,
            "critically_isolated": critical_isolated,
            "critical_needs": critical_needs,
            "blocked_routes": blocked_routes,
            "active_missions": sum(
                1 for s in self.mission_status.values()
                if s in ("IN_TRANSIT", "REROUTING")
            ),
        }


class SimulationEngine:
    """Deterministic step-based simulation of the Kothi Flash Flood scenario."""

    def __init__(self):
        self.state = SimulationState()
        self.listeners: Set[Any] = set()  # WebSocket connections
        self._auto_task: Optional[asyncio.Task] = None

    def add_listener(self, ws):
        self.listeners.add(ws)

    def remove_listener(self, ws):
        self.listeners.discard(ws)

    async def broadcast(self, event_type: str, payload: Dict[str, Any]):
        """Send update to all connected WebSocket clients."""
        import json
        message = json.dumps({
            "type": event_type,
            "timestamp": datetime.now(timezone.utc).isoformat(),
            "payload": payload,
        })
        dead = set()
        for ws in self.listeners:
            try:
                await ws.send_text(message)
            except Exception:
                dead.add(ws)
        for ws in dead:
            self.listeners.discard(ws)

    def _apply_state_changes(self, changes: Dict[str, Any]):
        """Apply the state_changes from a SimulationEvent to the live state."""
        # Phase update
        if "phase" in changes:
            self.state.phase = changes["phase"]

        # Infrastructure status update
        if "infra_update" in changes:
            iu = changes["infra_update"]
            self.state.infra_status[iu["name"]] = iu["status"]
            # Update graph edges related to this infra
            infra_name_to_edge_ids = {
                "Bridge B-03 (Kothi River)": ["RD-A", "RD-B1", "RD-J2"],
                "Valley Road (Flood Zone)": ["RD-VF"],
                "Mountain Alternate Road": ["RD-MC", "RD-MK"],
            }
            edge_ids = infra_name_to_edge_ids.get(iu["name"], [])
            for eid in edge_ids:
                region_graph.set_edge_status(eid, iu["status"])

        # Disaster update
        if "disaster_update" in changes:
            du = changes["disaster_update"]
            disaster_name = f"disaster_{du.get('id', 1)}"
            if disaster_name not in self.state.active_disasters:
                self.state.active_disasters.append(disaster_name)

        # Community update
        if "community_update" in changes:
            cu = changes["community_update"]
            name = cu.pop("name")
            self.state.community_status[name] = {
                **self.state.community_status.get(name, {}),
                **cu,
            }

        # Route updates
        if "route_updates" in changes:
            for ru in changes["route_updates"]:
                rname = ru["name"]
                self.state.route_status[rname] = ru["status"]
                if "rejection_reason" in ru:
                    self.state.route_rejection_reasons[rname] = ru["rejection_reason"]
                if ru["status"] == "RECOMMENDED":
                    self.state.recommended_route = rname

        # Mission update
        if "mission_update" in changes:
            mu = changes["mission_update"]
            self.state.mission_status[mu["mission_code"]] = mu["status"]
            if "route_name" in mu:
                self.state.mission_route[mu["mission_code"]] = mu["route_name"]

        # New alert
        if "new_alert" in changes:
            alert_data = changes["new_alert"]
            alert_data["id"] = len(self.state.alerts) + 1
            alert_data["created_at"] = datetime.now(timezone.utc).isoformat()
            self.state.alerts.append(alert_data)

    async def step(self) -> Optional[Dict[str, Any]]:
        """Execute the next simulation event. Returns event info or None if complete."""
        from sqlalchemy import select
        from app.database import AsyncSessionLocal
        from app.models.models import SimulationEvent

        async with AsyncSessionLocal() as db:
            result = await db.execute(
                select(SimulationEvent)
                .where(SimulationEvent.scenario_id == "kothi_flash_flood")
                .where(SimulationEvent.step_index == self.state.current_step)
            )
            event = result.scalar_one_or_none()

        if event is None:
            self.state.is_running = False
            return None

        # Apply state changes
        self._apply_state_changes(event.state_changes)

        event_payload = {
            "step_index": event.step_index,
            "time_label": event.time_label,
            "event_type": event.event_type,
            "title": event.title,
            "description": event.description,
            "severity": event.severity,
            "state": self.state.get_full_state(),
        }

        # Advance step counter
        self.state.current_step += 1

        # Broadcast to all connected clients
        await self.broadcast("SIMULATION_STEP", event_payload)

        return event_payload

    async def start(self):
        self.state.is_running = True
        self.state.is_paused = False
        await self.broadcast("SIMULATION_STARTED", self.state.get_full_state())

    async def pause(self):
        self.state.is_paused = True
        self.state.is_running = False
        await self.broadcast("SIMULATION_PAUSED", self.state.get_full_state())

    async def reset(self):
        if self._auto_task:
            self._auto_task.cancel()
            self._auto_task = None
        self.state.reset()
        await self.broadcast("SIMULATION_RESET", self.state.get_full_state())

    def get_state(self) -> Dict[str, Any]:
        return self.state.get_full_state()


# Singleton
simulation_engine = SimulationEngine()
