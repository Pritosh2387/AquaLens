"""
src/resource_optimization/allocator.py - Module 13: Resource Optimization Engine.

Transparent greedy allocation algorithm.
Objective: maximize sum(asset_impact_score * is_covered[asset])
Constraint: sum(resources_used[type]) <= available[type]

Uses existing calculate_geodesic_distance_km for travel-time estimation.
No reinforcement learning, no LP solver - intentionally simple and deterministic.
"""
import copy
from collections import Counter
from typing import Any, Dict, List, Optional

from src.utils.logging import get_logger
from src.utils.config import load_config
from src.ais.matcher import calculate_geodesic_distance_km
from src.resource_optimization.mock_fleet import DEFAULT_FLEET

logger = get_logger("ResourceOptimizer")

KM_PER_NAUTICAL_MILE = 1.852


def _clip(v: float, lo: float = 0.0, hi: float = 1.0) -> float:
    return max(lo, min(hi, float(v)))


class ResourceOptimizer:
    """Module 13 Engine - greedy priority-weighted resource allocation."""

    def __init__(self, config_path: str = "configs/config.yaml"):
        self.cfg = load_config(config_path)
        ro_cfg = self.cfg.get("resource_optimization", {})
        self.max_per_target = int(ro_cfg.get("max_resources_per_target", 2))
        self.feasibility_hours = float(ro_cfg.get("feasibility_horizon_hours", 48.0))
        cfg_resources = ro_cfg.get("resources", None)
        self.fleet_cfg: List[Dict[str, Any]] = cfg_resources if cfg_resources else DEFAULT_FLEET

    def _build_fleet(
        self,
        resource_override: Optional[List[Dict[str, Any]]] = None,
        extra_type: Optional[str] = None,
        extra_count: int = 0,
    ) -> List[Dict[str, Any]]:
        fleet_source = copy.deepcopy(resource_override if resource_override else self.fleet_cfg)
        if extra_type and extra_count > 0:
            for r in fleet_source:
                if r.get("type") == extra_type:
                    r["count"] = int(r.get("count", 0)) + extra_count
                    break
            else:
                fleet_source.append({
                    "type": extra_type, "count": extra_count,
                    "speed_knots": 8, "capacity_tons": 50,
                    "range_km": 200, "home_lat": 12.1, "home_lon": 72.1
                })
        units = []
        for r in fleet_source:
            for i in range(int(r.get("count", 0))):
                units.append({
                    "resource_id": "{}_{}".format(r["type"].upper(), str(i + 1).zfill(2)),
                    "resource_type": r["type"],
                    "speed_knots": float(r.get("speed_knots", 8)),
                    "capacity_tons": float(r.get("capacity_tons", 10)),
                    "range_km": float(r.get("range_km", 200)),
                    "home_lat": float(r.get("home_lat", 12.0)),
                    "home_lon": float(r.get("home_lon", 72.0)),
                })
        return units

    def _travel_hours(self, unit: Dict[str, Any], target_lat: float, target_lon: float) -> float:
        dist_km = calculate_geodesic_distance_km(
            (unit["home_lat"], unit["home_lon"]),
            (target_lat, target_lon),
        )
        speed_kph = unit["speed_knots"] * KM_PER_NAUTICAL_MILE
        if speed_kph < 0.1:
            speed_kph = 5.0 * KM_PER_NAUTICAL_MILE
        return round(dist_km / speed_kph, 3)

    def allocate(
        self,
        mod11: Dict[str, Any],
        mod9: Dict[str, Any],
        mod7: Dict[str, Any],
        resource_override: Optional[List[Dict[str, Any]]] = None,
        extra_resource_type: Optional[str] = None,
        extra_resource_count: int = 0,
        travel_time_delay_hours: float = 0.0,
    ) -> Dict[str, Any]:
        """Greedy allocation of response resources to impact targets."""
        units = self._build_fleet(resource_override, extra_resource_type, extra_resource_count)
        total_available = len(units)

        m11_assets = mod11.get("assets", [])

        h6_center = mod9.get("horizons", {}).get("6h", {}).get("center_coords", None)
        origin = mod7.get("origin_centroid", None)

        targets = []
        for a in m11_assets:
            if h6_center:
                tlat, tlon = h6_center[0], h6_center[1]
            elif origin:
                tlat, tlon = origin[0], origin[1]
            else:
                tlat, tlon = 12.5, 72.5
            targets.append({
                "asset": a.get("asset", "Unknown"),
                "asset_type": a.get("asset_type", "Geographic Asset"),
                "asset_impact_score": float(a.get("asset_impact_score", 0.0)),
                "target_lat": tlat,
                "target_lon": tlon,
            })

        targets.sort(key=lambda t: t["asset_impact_score"], reverse=True)

        target_assignment_count = {t["asset"]: 0 for t in targets}
        allocations = []
        available_units = list(units)

        for target in targets:
            if not available_units:
                break
            if target_assignment_count[target["asset"]] >= self.max_per_target:
                continue

            scored = []
            for unit in available_units:
                travel_h = self._travel_hours(unit, target["target_lat"], target["target_lon"])
                travel_h += travel_time_delay_hours
                feasibility = _clip(1.0 - travel_h / max(self.feasibility_hours, 1.0))
                dscore = round(target["asset_impact_score"] * feasibility, 4)
                scored.append((dscore, travel_h, unit))

            scored.sort(key=lambda x: x[0], reverse=True)

            for dscore, travel_h, unit in scored:
                if dscore <= 0.0:
                    break
                allocations.append({
                    "resource_id": unit["resource_id"],
                    "resource_type": unit["resource_type"],
                    "target_asset": target["asset"],
                    "target_coords": [target["target_lat"], target["target_lon"]],
                    "estimated_arrival_hours": round(travel_h, 2),
                    "deployment_score": dscore,
                    "coverage_area_km2": round(unit["capacity_tons"] * 0.5, 2),
                })
                available_units.remove(unit)
                target_assignment_count[target["asset"]] += 1
                break

        high_impact = [t for t in targets if t["asset_impact_score"] >= 0.25]
        covered_assets = {a["target_asset"] for a in allocations}
        covered_high = sum(1 for t in high_impact if t["asset"] in covered_assets)
        coverage_frac = round(covered_high / max(len(high_impact), 1), 4)

        unalloc_counter = Counter(u["resource_type"] for u in available_units)
        unallocated = [{"resource_type": k, "count": v} for k, v in unalloc_counter.items()]

        logger.info(
            "[MODULE 13 RESOURCE] Allocated %d/%d resources. Coverage: %.2f",
            len(allocations), total_available, coverage_frac
        )

        return {
            "optimization_method": "greedy_priority_weighted",
            "total_resources_available": total_available,
            "total_resources_deployed": len(allocations),
            "assets_targeted": len(covered_assets),
            "estimated_coverage_fraction": coverage_frac,
            "allocations": allocations,
            "unallocated_resources": unallocated,
            "disclaimer": (
                "Resource allocation uses a greedy heuristic on synthetic mock data. "
                "It is NOT an operationally validated deployment plan."
            ),
        }
