"""
src/whatif/simulator.py - Module 14: What-If Response Simulation Engine.

Compares four scenarios (+ optional alternative) using the existing
ResourceOptimizer in-process.

Scenarios:
  optimized          - M13 baseline allocation (no delay, no extras)
  delayed            - M13 with travel_time_delay_hours added
  no_action          - zero coverage
  additional_resources - M13 with extra fleet units
  alternative        - caller-supplied coverage fraction (optional)
"""
import copy
from typing import Any, Dict, List, Optional

from src.utils.logging import get_logger
from src.utils.config import load_config
from src.resource_optimization.allocator import ResourceOptimizer

logger = get_logger("WhatIfSimulator")


def _scenario_result(
    label: str,
    alloc_result: Dict[str, Any],
    priority_score: float,
    optimized_deployed: int,
) -> Dict[str, Any]:
    cov = alloc_result.get("estimated_coverage_fraction", 0.0)
    deployed = alloc_result.get("total_resources_deployed", 0)
    assets_covered = alloc_result.get("assets_targeted", 0)
    cost_idx = round(deployed / max(optimized_deployed, 1), 4)
    return {
        "label": label,
        "coverage_fraction": round(cov, 4),
        "assets_covered": int(assets_covered),
        "estimated_impact_reduction": round(cov * priority_score, 2),
        "total_deployment_cost_index": cost_idx,
        "additional_resources_needed": max(0, optimized_deployed - deployed),
    }


class WhatIfSimulator:
    """Module 14 Engine - scenario comparison using ResourceOptimizer."""

    def __init__(self, config_path: str = "configs/config.yaml"):
        self.cfg = load_config(config_path)
        self.optimizer = ResourceOptimizer(config_path)

    def simulate(
        self,
        mod11: Dict[str, Any],
        mod12: Dict[str, Any],
        mod9: Dict[str, Any],
        mod7: Dict[str, Any],
        delay_hours: float = 6.0,
        additional_resource_type: str = "skimmer",
        additional_resource_count: int = 2,
        alternative_allocation: Optional[List[Dict[str, Any]]] = None,
    ) -> Dict[str, Any]:
        """Run all scenarios and return comparison results."""
        priority_score = float(mod12.get("priority_score", 50.0))

        opt_result = self.optimizer.allocate(
            mod11=mod11, mod9=mod9, mod7=mod7,
            travel_time_delay_hours=0.0,
        )
        optimized_deployed = opt_result.get("total_resources_deployed", 1)

        delayed_result = self.optimizer.allocate(
            mod11=mod11, mod9=mod9, mod7=mod7,
            travel_time_delay_hours=float(delay_hours),
        )

        extra_result = self.optimizer.allocate(
            mod11=mod11, mod9=mod9, mod7=mod7,
            extra_resource_type=additional_resource_type,
            extra_resource_count=int(additional_resource_count),
            travel_time_delay_hours=0.0,
        )

        scenarios: Dict[str, Any] = {
            "optimized": _scenario_result(
                "Optimised Response", opt_result, priority_score, optimized_deployed
            ),
            "delayed": _scenario_result(
                "Delayed Response (+{}h)".format(delay_hours),
                delayed_result, priority_score, optimized_deployed
            ),
            "no_action": {
                "label": "No Action (Baseline)",
                "coverage_fraction": 0.0,
                "assets_covered": 0,
                "estimated_impact_reduction": 0.0,
                "total_deployment_cost_index": 0.0,
                "additional_resources_needed": optimized_deployed,
            },
            "additional_resources": _scenario_result(
                "Additional {}x {}".format(additional_resource_count, additional_resource_type),
                extra_result, priority_score, optimized_deployed
            ),
        }

        if alternative_allocation is not None:
            m11_assets = mod11.get("assets", [])
            high_impact = [a for a in m11_assets if a.get("asset_impact_score", 0.0) >= 0.25]
            covered = {a.get("target_asset", a.get("asset", "")) for a in alternative_allocation}
            alt_high_covered = sum(1 for a in high_impact if a.get("asset", "") in covered)
            alt_cov = round(alt_high_covered / max(len(high_impact), 1), 4)
            scenarios["alternative"] = {
                "label": "Alternative Allocation (User-Supplied)",
                "coverage_fraction": alt_cov,
                "assets_covered": len(covered),
                "estimated_impact_reduction": round(alt_cov * priority_score, 2),
                "total_deployment_cost_index": round(len(alternative_allocation) / max(optimized_deployed, 1), 4),
                "additional_resources_needed": max(0, optimized_deployed - len(alternative_allocation)),
            }

        recommended = max(
            scenarios.keys(),
            key=lambda k: scenarios[k].get("estimated_impact_reduction", 0.0),
        )

        logger.info(
            "[MODULE 14 WHATIF] Scenarios computed. Recommended: %s (reduction=%.1f)",
            recommended, scenarios[recommended].get("estimated_impact_reduction", 0)
        )

        return {
            "reference_priority_score": priority_score,
            "scenarios": scenarios,
            "recommended_scenario": recommended,
            "disclaimer": (
                "Scenario results are computed from prototype heuristics on synthetic mock data. "
                "They are NOT operationally validated plans."
            ),
        }
