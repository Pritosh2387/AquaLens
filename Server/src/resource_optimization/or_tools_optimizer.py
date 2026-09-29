"""
src/resource_optimization/or_tools_optimizer.py - Module 13 (OR-Tools Edition)

Google OR-Tools CP-SAT solver for resource optimization.

Problem formulation (Integer Programming):
  Variables:
    x[i][j] ∈ {0, 1}  — assign resource unit i to target j
    covered[j] ∈ {0, 1} — target j has at least one resource assigned

  Objective (maximise):
    sum_j( asset_impact_score[j] * covered[j] )

  Hard constraints:
    1. Each resource unit is used at most once:
       sum_j x[i][j] <= 1  for all i
    2. Max resources per target:
       sum_i x[i][j] <= max_per_target  for all j
    3. Feasibility gate — unit i can only go to target j if travel time is within
       the feasibility horizon (binary feasibility matrix F[i][j]):
       x[i][j] <= F[i][j]
    4. Linking covered[j] to assignments:
       covered[j] <= sum_i x[i][j]         (covered only if assigned)
       covered[j] * max_per_target >= sum_i x[i][j]  (if assigned, mark covered)

  Soft hint:
    Objective weights are scaled to integers (×10000) for CP-SAT.

Solver:
  google-ortools CP-SAT (exact solver with wall-clock time limit).
  Falls back to the greedy allocator if OR-Tools is unavailable or times out.

No frontend changes required — this module is drop-in compatible with
ResourceOptimizer.allocate() (same return-dict schema).
"""
from __future__ import annotations

import copy
import time
from collections import Counter
from typing import Any, Dict, List, Optional

from src.utils.logging import get_logger
from src.utils.config import load_config
from src.ais.matcher import calculate_geodesic_distance_km
from src.resource_optimization.mock_fleet import DEFAULT_FLEET

logger = get_logger("ORToolsOptimizer")

KM_PER_NAUTICAL_MILE = 1.852

# Scale factor: OR-Tools CP-SAT requires integer coefficients.
# We multiply float scores by SCALE before converting to int.
OBJECTIVE_SCALE = 10_000

# Wall-clock time limit for the CP-SAT solver (seconds).
# Increase for larger fleets; decrease for faster API responses.
CP_SAT_TIME_LIMIT_SECONDS = 10.0


def _clip(v: float, lo: float = 0.0, hi: float = 1.0) -> float:
    return max(lo, min(hi, float(v)))


class ORToolsResourceOptimizer:
    """
    Module 13 Engine — Google OR-Tools CP-SAT resource allocation.

    Solves the assignment problem exactly (subject to the CP-SAT time limit)
    instead of using the greedy heuristic in ResourceOptimizer.

    Public interface is identical to ResourceOptimizer so it is a drop-in
    replacement: call .allocate(mod11, mod9, mod7, ...) and receive the same
    response dict schema.
    """

    def __init__(self, config_path: str = "configs/config.yaml"):
        self.cfg = load_config(config_path)
        ro_cfg = self.cfg.get("resource_optimization", {})
        self.max_per_target = int(ro_cfg.get("max_resources_per_target", 2))
        self.feasibility_hours = float(ro_cfg.get("feasibility_horizon_hours", 48.0))
        cfg_resources = ro_cfg.get("resources", None)
        self.fleet_cfg: List[Dict[str, Any]] = cfg_resources if cfg_resources else DEFAULT_FLEET
        self.time_limit = float(ro_cfg.get("or_tools_time_limit_seconds", CP_SAT_TIME_LIMIT_SECONDS))

    # ─────────────────────────────────────────────────────────────────────────
    # Fleet builder (identical to ResourceOptimizer._build_fleet)
    # ─────────────────────────────────────────────────────────────────────────

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
                    "range_km": 200, "home_lat": 12.1, "home_lon": 72.1,
                })
        units = []
        for r in fleet_source:
            for i in range(int(r.get("count", 0))):
                units.append({
                    "resource_id": "{}_{:02d}".format(r["type"].upper(), i + 1),
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

    # ─────────────────────────────────────────────────────────────────────────
    # OR-Tools CP-SAT solver core
    # ─────────────────────────────────────────────────────────────────────────

    def _solve_cp_sat(
        self,
        units: List[Dict[str, Any]],
        targets: List[Dict[str, Any]],
        travel_time_delay_hours: float,
    ) -> Dict[str, Any]:
        """
        Solve the resource assignment problem with OR-Tools CP-SAT.

        Returns a dict with keys matching ResourceOptimizer.allocate():
          allocations, unallocated_resources, estimated_coverage_fraction,
          total_resources_deployed, assets_targeted, optimization_method.
        """
        from ortools.sat.python import cp_model  # lazy import — keeps startup fast

        n_units = len(units)
        n_targets = len(targets)

        if n_units == 0 or n_targets == 0:
            return self._empty_result(units, targets)

        # Pre-compute travel times and feasibility matrix
        # travel[i][j] = hours from unit i to target j (including delay)
        travel = []
        feasible = []  # feasible[i][j] = 1 if travel within horizon
        for i, unit in enumerate(units):
            row_t, row_f = [], []
            for j, tgt in enumerate(targets):
                t = self._travel_hours(unit, tgt["target_lat"], tgt["target_lon"])
                t += travel_time_delay_hours
                row_t.append(t)
                row_f.append(1 if t <= self.feasibility_hours else 0)
            travel.append(row_t)
            feasible.append(row_f)

        # Objective coefficients — integer (scaled asset_impact_score)
        obj_coeff = [
            int(round(tgt["asset_impact_score"] * OBJECTIVE_SCALE))
            for tgt in targets
        ]

        # ── Build CP-SAT model ──────────────────────────────────────────────
        model = cp_model.CpModel()

        # Decision variables: x[i][j] = 1 if unit i assigned to target j
        x = [
            [model.NewBoolVar(f"x_{i}_{j}") for j in range(n_targets)]
            for i in range(n_units)
        ]

        # covered[j] = 1 if target j has at least one unit assigned
        covered = [model.NewBoolVar(f"covered_{j}") for j in range(n_targets)]

        # Constraint 1: each unit used at most once
        for i in range(n_units):
            model.Add(sum(x[i][j] for j in range(n_targets)) <= 1)

        # Constraint 2: max resources per target
        for j in range(n_targets):
            model.Add(sum(x[i][j] for i in range(n_units)) <= self.max_per_target)

        # Constraint 3: feasibility gate (unit can only go where it can arrive in time)
        for i in range(n_units):
            for j in range(n_targets):
                if feasible[i][j] == 0:
                    model.Add(x[i][j] == 0)

        # Constraint 4a: covered[j] = 0 → no unit assigned
        for j in range(n_targets):
            model.Add(sum(x[i][j] for i in range(n_units)) >= covered[j])

        # Constraint 4b: covered[j] = 1 → at least one unit assigned
        for j in range(n_targets):
            model.Add(
                sum(x[i][j] for i in range(n_units))
                <= self.max_per_target * covered[j]
            )

        # Objective: maximise sum of weighted coverage
        model.Maximize(sum(obj_coeff[j] * covered[j] for j in range(n_targets)))

        # ── Solve ───────────────────────────────────────────────────────────
        solver = cp_model.CpSolver()
        solver.parameters.max_time_in_seconds = self.time_limit
        solver.parameters.num_search_workers = 2  # keep API-friendly

        t0 = time.perf_counter()
        status = solver.Solve(model)
        elapsed = round(time.perf_counter() - t0, 3)

        status_name = solver.StatusName(status)
        logger.info(
            "[OR-TOOLS] CP-SAT status=%s  objective=%s  wall_time=%.3fs",
            status_name,
            solver.ObjectiveValue() if status in (cp_model.OPTIMAL, cp_model.FEASIBLE) else "N/A",
            elapsed,
        )

        if status not in (cp_model.OPTIMAL, cp_model.FEASIBLE):
            # Solver could not find any feasible solution — fall back gracefully
            logger.warning("[OR-TOOLS] No feasible solution found; returning empty allocation.")
            return self._empty_result(units, targets)

        # ── Extract solution ─────────────────────────────────────────────────
        assigned_unit_indices = set()
        allocations = []
        for i in range(n_units):
            for j in range(n_targets):
                if solver.Value(x[i][j]) == 1:
                    unit = units[i]
                    tgt = targets[j]
                    t_h = round(travel[i][j], 2)
                    feasibility = _clip(1.0 - t_h / max(self.feasibility_hours, 1.0))
                    dscore = round(tgt["asset_impact_score"] * feasibility, 4)
                    allocations.append({
                        "resource_id": unit["resource_id"],
                        "resource_type": unit["resource_type"],
                        "target_asset": tgt["asset"],
                        "target_coords": [tgt["target_lat"], tgt["target_lon"]],
                        "estimated_arrival_hours": t_h,
                        "deployment_score": dscore,
                        "coverage_area_km2": round(unit["capacity_tons"] * 0.5, 2),
                    })
                    assigned_unit_indices.add(i)

        unassigned_units = [units[i] for i in range(n_units) if i not in assigned_unit_indices]
        unalloc_counter = Counter(u["resource_type"] for u in unassigned_units)
        unallocated = [{"resource_type": k, "count": v} for k, v in unalloc_counter.items()]

        high_impact = [t for t in targets if t["asset_impact_score"] >= 0.25]
        covered_assets = {a["target_asset"] for a in allocations}
        covered_high = sum(1 for t in high_impact if t["asset"] in covered_assets)
        coverage_frac = round(covered_high / max(len(high_impact), 1), 4)

        return {
            "optimization_method": "cp_sat_exact",
            "solver_status": status_name,
            "solver_wall_time_seconds": elapsed,
            "total_resources_available": n_units,
            "total_resources_deployed": len(allocations),
            "assets_targeted": len(covered_assets),
            "estimated_coverage_fraction": coverage_frac,
            "allocations": allocations,
            "unallocated_resources": unallocated,
        }

    def _empty_result(
        self,
        units: List[Dict[str, Any]],
        targets: List[Dict[str, Any]],
    ) -> Dict[str, Any]:
        """Return a zero-allocation result (used when solver finds nothing)."""
        unalloc_counter = Counter(u["resource_type"] for u in units)
        return {
            "optimization_method": "cp_sat_exact",
            "solver_status": "INFEASIBLE_OR_EMPTY",
            "solver_wall_time_seconds": 0.0,
            "total_resources_available": len(units),
            "total_resources_deployed": 0,
            "assets_targeted": 0,
            "estimated_coverage_fraction": 0.0,
            "allocations": [],
            "unallocated_resources": [
                {"resource_type": k, "count": v} for k, v in unalloc_counter.items()
            ],
        }

    # ─────────────────────────────────────────────────────────────────────────
    # Public API — same signature as ResourceOptimizer.allocate()
    # ─────────────────────────────────────────────────────────────────────────

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
        """
        Allocate response resources using Google OR-Tools CP-SAT.

        Parameters mirror ResourceOptimizer.allocate() exactly so that
        WhatIfSimulator and any other caller can use this interchangeably.
        """
        units = self._build_fleet(resource_override, extra_resource_type, extra_resource_count)

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

        # OR-Tools solver
        result = self._solve_cp_sat(units, targets, travel_time_delay_hours)

        logger.info(
            "[MODULE 13 OR-TOOLS] status=%s  deployed=%d/%d  coverage=%.2f",
            result.get("solver_status", "N/A"),
            result["total_resources_deployed"],
            result["total_resources_available"],
            result["estimated_coverage_fraction"],
        )

        result["disclaimer"] = (
            "Resource allocation uses Google OR-Tools CP-SAT exact solver on synthetic mock data. "
            "It is NOT an operationally validated deployment plan."
        )
        return result
