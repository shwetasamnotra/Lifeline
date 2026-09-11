"""
LIFELINE LOSS ENGINE
====================
Calculates the Lifeline Loss Score (0-100) for a community based on
weighted infrastructure and connectivity factors.

Score interpretation:
  0-20  → CONNECTED
  21-40 → LOW RISK
  41-60 → MODERATE
  61-80 → HIGH
  81-100→ CRITICAL ISOLATION
"""

from typing import Dict, Any


# Factor weights must sum to 100
FACTOR_WEIGHTS = {
    "road_connectivity":     25,  # Primary road access
    "bridge_failure":        20,  # Bridge accessibility
    "hospital_access":       15,  # Medical facility access
    "water_disruption":      15,  # Water availability
    "communication":          8,  # Communication status
    "shelter_access":         7,  # Shelter availability
    "alternative_routes":    10,  # Number of alternate routes available
}

SCORE_LABELS = {
    (0, 20):   ("CONNECTED", "success"),
    (21, 40):  ("LOW RISK", "info"),
    (41, 60):  ("MODERATE", "warning"),
    (61, 80):  ("HIGH", "danger"),
    (81, 100): ("CRITICAL ISOLATION", "critical"),
}


def calculate_lifeline_loss(community_data: Dict[str, Any]) -> Dict[str, Any]:
    """
    Calculate the Lifeline Loss Score for a community.
    
    Returns:
        dict with:
            score: float (0-100)
            label: str
            factors: list of {name, contribution, max_possible, details}
            interpretation: str
    """
    factors = []
    total_score = 0.0

    # --- 1. Road Connectivity (max 25 points) ---
    road_factor = community_data.get("road_connectivity", 1.0)
    # 1.0 = fully connected (0 points), 0.0 = no road access (25 points)
    road_contribution = round((1.0 - road_factor) * FACTOR_WEIGHTS["road_connectivity"], 1)
    total_score += road_contribution
    factors.append({
        "name": "Road Connectivity",
        "contribution": road_contribution,
        "max_possible": FACTOR_WEIGHTS["road_connectivity"],
        "details": f"Road access at {int(road_factor * 100)}%",
    })

    # --- 2. Bridge Accessibility (max 20 points) ---
    bridge_accessible = community_data.get("bridge_accessible", True)
    bridge_contribution = 0.0 if bridge_accessible else float(FACTOR_WEIGHTS["bridge_failure"])
    total_score += bridge_contribution
    factors.append({
        "name": "Bridge Failure",
        "contribution": bridge_contribution,
        "max_possible": FACTOR_WEIGHTS["bridge_failure"],
        "details": "Accessible" if bridge_accessible else "Bridge failed — primary crossing severed",
    })

    # --- 3. Hospital Access (max 15 points) ---
    hospital_map = {"AVAILABLE": 0, "LIMITED": 8, "CRITICAL": 12, "NONE": 15}
    hospital_access = community_data.get("hospital_access", "AVAILABLE")
    hospital_contribution = float(hospital_map.get(hospital_access, 0))
    total_score += hospital_contribution
    factors.append({
        "name": "Hospital Access",
        "contribution": hospital_contribution,
        "max_possible": FACTOR_WEIGHTS["hospital_access"],
        "details": f"Medical access: {hospital_access}",
    })

    # --- 4. Water Disruption (max 15 points) ---
    water_map = {"AVAILABLE": 0, "LIMITED": 6, "CRITICAL": 12, "NONE": 15}
    water_access = community_data.get("water_access", "AVAILABLE")
    water_contribution = float(water_map.get(water_access, 0))
    total_score += water_contribution
    factors.append({
        "name": "Water Disruption",
        "contribution": water_contribution,
        "max_possible": FACTOR_WEIGHTS["water_disruption"],
        "details": f"Water supply: {water_access}",
    })

    # --- 5. Communication (max 8 points) ---
    comm_map = {"NORMAL": 0, "DEGRADED": 4, "LOST": 8}
    communication = community_data.get("communication", "NORMAL")
    comm_contribution = float(comm_map.get(communication, 0))
    total_score += comm_contribution
    factors.append({
        "name": "Communication Status",
        "contribution": comm_contribution,
        "max_possible": FACTOR_WEIGHTS["communication"],
        "details": f"Communication: {communication}",
    })

    # --- 6. Shelter Access (max 7 points) ---
    shelter_map = {"AVAILABLE": 0, "LIMITED": 3, "CRITICAL": 5, "NONE": 7}
    shelter_access = community_data.get("shelter_access", "AVAILABLE")
    shelter_contribution = float(shelter_map.get(shelter_access, 0))
    total_score += shelter_contribution
    factors.append({
        "name": "Shelter Access",
        "contribution": shelter_contribution,
        "max_possible": FACTOR_WEIGHTS["shelter_access"],
        "details": f"Shelter: {shelter_access}",
    })

    # --- 7. Alternative Routes (max 10 points) ---
    alt_routes = community_data.get("alternative_routes", 2)
    # 0 routes = 10 points, 1 = 6, 2 = 2, 3+ = 0
    alt_map = {0: 10, 1: 6, 2: 2}
    alt_contribution = float(alt_map.get(alt_routes, 0) if alt_routes < 3 else 0)
    total_score += alt_contribution
    factors.append({
        "name": "Alternative Routes",
        "contribution": alt_contribution,
        "max_possible": FACTOR_WEIGHTS["alternative_routes"],
        "details": f"{alt_routes} alternate route(s) available",
    })

    # Clamp to 0-100
    final_score = round(min(max(total_score, 0.0), 100.0), 1)

    # Determine label
    label = "CONNECTED"
    color = "success"
    for (lo, hi), (lbl, col) in SCORE_LABELS.items():
        if lo <= final_score <= hi:
            label = lbl
            color = col
            break

    return {
        "score": final_score,
        "label": label,
        "color": color,
        "factors": factors,
        "total_possible": 100,
        "interpretation": (
            f"Lifeline Loss Score of {final_score}/100 indicates {label} status. "
            f"{'Immediate relief action required.' if final_score > 60 else 'Continued monitoring recommended.'}"
        ),
    }


def get_community_status_from_score(score: float) -> str:
    if score <= 20:
        return "CONNECTED"
    elif score <= 40:
        return "AT_RISK"
    elif score <= 60:
        return "ISOLATED"
    else:
        return "CRITICALLY_ISOLATED"
