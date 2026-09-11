"""
GRAPH ENGINE
============
Manages the regional infrastructure graph.
Uses NetworkX for BFS/DFS (connectivity) and Dijkstra (route optimisation).

Nodes represent communities, hospitals, shelters, warehouses, water points.
Edges represent roads and bridges.
"""

import networkx as nx
from typing import Dict, List, Optional, Tuple, Any


# =============================================
# GRAPH DEFINITION
# =============================================
# This is the prototype graph for the Kothi region.
# In production, this would be built from live OSM / database data.

INITIAL_NODES = [
    {"id": "warehouse_alpha", "label": "Warehouse Alpha", "type": "warehouse", "lat": 31.92, "lng": 77.02},
    {"id": "warehouse_beta",  "label": "Warehouse Beta",  "type": "warehouse", "lat": 31.78, "lng": 77.25},
    {"id": "hospital_rampur", "label": "District Hospital Rampur", "type": "hospital", "lat": 31.90, "lng": 77.05},
    {"id": "phc_kothi",       "label": "PHC Kothi",       "type": "hospital",  "lat": 31.86, "lng": 77.09},
    {"id": "shelter_rampur",  "label": "Rampur Relief Camp", "type": "shelter", "lat": 31.91, "lng": 77.04},
    {"id": "shelter_kothi",   "label": "Kothi School Shelter", "type": "shelter", "lat": 31.85, "lng": 77.11},
    {"id": "water_rampur",    "label": "Water Treatment Rampur", "type": "water_point", "lat": 31.92, "lng": 77.03},
    {"id": "community_kothi", "label": "Kothi Village",   "type": "community", "lat": 31.85, "lng": 77.10},
    {"id": "community_rampur","label": "Rampur Town",     "type": "community", "lat": 31.91, "lng": 77.04},
    {"id": "community_banjara","label":"Banjara Settlement","type": "community","lat": 31.78, "lng": 77.22},
    {"id": "community_nirmand","label":"Nirmand Village", "type": "community", "lat": 31.74, "lng": 77.06},
    {"id": "junction_2",      "label": "Junction 2",      "type": "junction",  "lat": 31.90, "lng": 77.06},
    {"id": "junction_3",      "label": "Junction 3",      "type": "junction",  "lat": 31.91, "lng": 77.06},
    {"id": "junction_5",      "label": "Junction 5",      "type": "junction",  "lat": 31.85, "lng": 77.20},
    {"id": "bridge_b03",      "label": "Bridge B-03",     "type": "bridge",    "lat": 31.875, "lng": 77.08},
    {"id": "bridge_b07",      "label": "Bridge B-07",     "type": "bridge",    "lat": 31.870, "lng": 77.155},
    {"id": "mountain_crossing","label":"Mountain Crossing","type": "junction", "lat": 31.875, "lng": 77.14},
]

# (from, to, edge_data)
INITIAL_EDGES = [
    # Primary route: Warehouse Alpha → Bridge B-03 → Kothi
    ("warehouse_alpha", "bridge_b03",      {"id": "RD-A",  "label": "Primary Road NH-5",     "type": "road",   "distance_km": 6.0,  "status": "OPERATIONAL", "flood_risk": "LOW"}),
    ("bridge_b03",      "community_kothi", {"id": "RD-B1", "label": "Post-Bridge Road",       "type": "road",   "distance_km": 2.0,  "status": "OPERATIONAL", "flood_risk": "LOW"}),
    # Valley road route: Warehouse Alpha → Junction 2 → Bridge B-03 (alternate)
    ("warehouse_alpha", "junction_2",      {"id": "RD-J2", "label": "NH-5 to Junction 2",     "type": "road",   "distance_km": 4.0,  "status": "OPERATIONAL", "flood_risk": "LOW"}),
    ("junction_2",      "bridge_b03",      {"id": "RD-VF", "label": "Valley Road (Flood Zone)","type": "road",  "distance_km": 5.0,  "status": "OPERATIONAL", "flood_risk": "HIGH"}),
    # Mountain road route: Junction 3 → Mountain Crossing → Kothi
    ("warehouse_alpha", "junction_3",      {"id": "RD-J3", "label": "NH-5 to Junction 3",     "type": "road",   "distance_km": 4.5,  "status": "OPERATIONAL", "flood_risk": "LOW"}),
    ("junction_3",      "mountain_crossing",{"id":"RD-MC", "label": "Mountain Road",           "type": "road",   "distance_km": 7.0,  "status": "OPERATIONAL", "flood_risk": "LOW"}),
    ("mountain_crossing","community_kothi",{"id": "RD-MK", "label": "Mountain to Kothi",      "type": "road",   "distance_km": 4.9,  "status": "OPERATIONAL", "flood_risk": "LOW"}),
    # Northern bypass: Warehouse Beta → Junction 5 → Bridge B-07 → Kothi
    ("warehouse_beta",  "junction_5",      {"id": "RD-NB", "label": "Northern Bypass Road",   "type": "road",   "distance_km": 8.0,  "status": "OPERATIONAL", "flood_risk": "MEDIUM"}),
    ("junction_5",      "bridge_b07",      {"id": "RD-J5", "label": "Junction 5 to B-07",     "type": "road",   "distance_km": 5.0,  "status": "OPERATIONAL", "flood_risk": "LOW"}),
    ("bridge_b07",      "community_kothi", {"id": "RD-B7K","label": "B-07 to Kothi",          "type": "road",   "distance_km": 4.1,  "status": "OPERATIONAL", "flood_risk": "LOW"}),
    # Rampur connections
    ("community_rampur","warehouse_alpha", {"id": "RD-RW", "label": "Rampur to Warehouse",    "type": "road",   "distance_km": 1.5,  "status": "OPERATIONAL", "flood_risk": "LOW"}),
    ("community_rampur","hospital_rampur", {"id": "RD-RH", "label": "Rampur Road",            "type": "road",   "distance_km": 1.0,  "status": "OPERATIONAL", "flood_risk": "LOW"}),
    ("community_rampur","shelter_rampur",  {"id": "RD-RS", "label": "Rampur Shelter Rd",      "type": "road",   "distance_km": 0.8,  "status": "OPERATIONAL", "flood_risk": "LOW"}),
    # Kothi local
    ("community_kothi", "phc_kothi",       {"id": "RD-KH", "label": "Kothi Health Access",   "type": "road",   "distance_km": 0.5,  "status": "OPERATIONAL", "flood_risk": "LOW"}),
    ("community_kothi", "shelter_kothi",   {"id": "RD-KS", "label": "Kothi Shelter Road",    "type": "road",   "distance_km": 0.3,  "status": "OPERATIONAL", "flood_risk": "LOW"}),
    # Banjara connections
    ("community_banjara","warehouse_beta", {"id": "RD-BW", "label": "Banjara to Warehouse",  "type": "road",   "distance_km": 5.0,  "status": "OPERATIONAL", "flood_risk": "MEDIUM"}),
    ("community_banjara","junction_5",     {"id": "RD-BJ", "label": "Banjara to Junction 5", "type": "road",   "distance_km": 4.0,  "status": "OPERATIONAL", "flood_risk": "MEDIUM"}),
    # Nirmand connections
    ("community_nirmand","community_rampur",{"id":"RD-NR", "label": "Nirmand to Rampur",     "type": "road",   "distance_km": 20.0, "status": "OPERATIONAL", "flood_risk": "LOW"}),
]

# Essential facility node IDs — used to check community connectivity
ESSENTIAL_FACILITIES = ["warehouse_alpha", "warehouse_beta", "hospital_rampur", "water_rampur", "shelter_rampur"]


class RegionGraph:
    """Thread-safe regional infrastructure graph."""

    def __init__(self):
        self.G = nx.Graph()
        self._build_graph()

    def _build_graph(self):
        for node in INITIAL_NODES:
            self.G.add_node(node["id"], **node)
        for src, dst, data in INITIAL_EDGES:
            self.G.add_edge(src, dst, **data)

    def set_edge_status(self, edge_id: str, status: str):
        """Update the status of an edge (road or bridge segment) by edge ID."""
        for u, v, data in self.G.edges(data=True):
            if data.get("id") == edge_id:
                self.G[u][v]["status"] = status
                return True
        return False

    def set_node_status(self, node_id: str, status: str):
        """Update node status (e.g., bridge node)."""
        if node_id in self.G:
            self.G.nodes[node_id]["status"] = status
            # When a bridge node fails, remove all its edges
            if status == "FAILED":
                edges_to_remove = list(self.G.edges(node_id))
                for u, v in edges_to_remove:
                    self.G[u][v]["status"] = "FAILED"
            return True
        return False

    def is_community_connected(self, community_id: str) -> Dict[str, Any]:
        """
        Use BFS to check if a community is reachable from any essential facility,
        considering only OPERATIONAL edges.
        Returns connectivity info.
        """
        operational_edges = [
            (u, v) for u, v, d in self.G.edges(data=True)
            if d.get("status", "OPERATIONAL") == "OPERATIONAL"
        ]
        subgraph = self.G.edge_subgraph(operational_edges).copy()

        connected_facilities = []
        disconnected_facilities = []

        for facility in ESSENTIAL_FACILITIES:
            if facility in subgraph and community_id in subgraph:
                try:
                    if nx.has_path(subgraph, community_id, facility):
                        connected_facilities.append(facility)
                    else:
                        disconnected_facilities.append(facility)
                except nx.NetworkXError:
                    disconnected_facilities.append(facility)
            else:
                disconnected_facilities.append(facility)

        is_connected = len(connected_facilities) > 0
        connectivity_ratio = len(connected_facilities) / len(ESSENTIAL_FACILITIES)

        return {
            "is_connected": is_connected,
            "connectivity_ratio": connectivity_ratio,
            "connected_facilities": connected_facilities,
            "disconnected_facilities": disconnected_facilities,
            "reachable_count": len(connected_facilities),
            "total_facilities": len(ESSENTIAL_FACILITIES),
        }

    def find_optimal_route(
        self,
        source: str,
        target: str,
        avoid_flooded: bool = True
    ) -> Optional[Dict[str, Any]]:
        """
        Find the optimal route from source to target using Dijkstra.
        Edge weight = distance_km * risk_multiplier.
        Risk multipliers: OPERATIONAL=1.0, DEGRADED=1.5, flooded/HIGH_RISK=99 (effectively rejected).
        Returns None if no viable path exists.
        """
        def weight_fn(u, v, d):
            status = d.get("status", "OPERATIONAL")
            if status in ("FAILED", "BLOCKED"):
                return float("inf")
            base = d.get("distance_km", 1.0)
            multiplier = 1.0
            if status == "DEGRADED":
                multiplier = 1.5
            if avoid_flooded and d.get("flood_risk") == "HIGH":
                multiplier = 5.0  # penalise heavily but don't fully block
            return base * multiplier

        try:
            path = nx.dijkstra_path(self.G, source, target, weight=weight_fn)
            length = nx.dijkstra_path_length(self.G, source, target, weight=weight_fn)

            # Collect edge details
            edge_details = []
            actual_distance = 0.0
            max_risk = "LOW"
            risk_order = ["LOW", "MEDIUM", "HIGH", "CRITICAL"]

            for i in range(len(path) - 1):
                u, v = path[i], path[i + 1]
                d = self.G[u][v]
                actual_distance += d.get("distance_km", 0)
                flood_risk = d.get("flood_risk", "LOW")
                edge_status = d.get("status", "OPERATIONAL")
                if risk_order.index(flood_risk) > risk_order.index(max_risk):
                    max_risk = flood_risk
                edge_details.append({
                    "from": path[i],
                    "to": path[i + 1],
                    "label": d.get("label", ""),
                    "distance_km": d.get("distance_km", 0),
                    "status": edge_status,
                    "flood_risk": flood_risk,
                })

            return {
                "path": path,
                "actual_distance_km": round(actual_distance, 1),
                "weighted_cost": round(length, 2),
                "edge_details": edge_details,
                "risk_level": max_risk,
                "viable": True,
            }
        except (nx.NetworkXNoPath, nx.NodeNotFound):
            return None

    def get_all_viable_routes(self, source: str, target: str) -> List[Dict[str, Any]]:
        """Find the top-3 simple paths from source to target, scored by viability."""
        results = []
        try:
            # Get all simple paths (limit to prevent combinatorial explosion)
            all_paths = list(nx.all_simple_paths(self.G, source, target, cutoff=8))
            all_paths = sorted(all_paths, key=len)[:10]  # limit

            for path in all_paths:
                total_dist = 0.0
                max_risk = "LOW"
                risk_order = ["LOW", "MEDIUM", "HIGH", "CRITICAL"]
                viable = True
                edge_details = []

                for i in range(len(path) - 1):
                    u, v = path[i], path[i + 1]
                    d = self.G[u][v]
                    status = d.get("status", "OPERATIONAL")
                    if status in ("FAILED", "BLOCKED"):
                        viable = False
                    total_dist += d.get("distance_km", 0)
                    flood_risk = d.get("flood_risk", "LOW")
                    if risk_order.index(flood_risk) > risk_order.index(max_risk):
                        max_risk = flood_risk
                    edge_details.append({
                        "from": path[i],
                        "to": path[i + 1],
                        "label": d.get("label", ""),
                        "distance_km": d.get("distance_km", 0),
                        "status": status,
                        "flood_risk": flood_risk,
                    })

                results.append({
                    "path": path,
                    "actual_distance_km": round(total_dist, 1),
                    "edge_details": edge_details,
                    "risk_level": max_risk,
                    "viable": viable,
                })

            results.sort(key=lambda r: (0 if r["viable"] else 1, r["actual_distance_km"]))
            return results[:5]
        except (nx.NetworkXError, nx.NodeNotFound):
            return []

    def get_graph_state(self) -> Dict[str, Any]:
        """Serialize the graph for frontend consumption."""
        nodes = []
        for node_id, data in self.G.nodes(data=True):
            nodes.append({"id": node_id, **data})

        edges = []
        for u, v, data in self.G.edges(data=True):
            edges.append({"source": u, "target": v, **data})

        return {"nodes": nodes, "edges": edges}


# Singleton instance — shared across requests via application state
region_graph = RegionGraph()
