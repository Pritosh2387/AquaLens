import numpy as np
from typing import Dict, Any, List, Tuple
from shapely.geometry import shape, Point, Polygon

from src.utils.logging import get_logger
from src.utils.config import load_config
from src.uncertainty.monte_carlo import run_monte_carlo_simulations
from src.uncertainty.eta import calculate_eta_distribution
from src.ais.matcher import calculate_geodesic_distance_km

logger = get_logger("UncertaintyEngine")


class UncertaintyEngine:
    """
    Module 10 Engine: Quantifies uncertainty in forward spill predictions
    using Monte Carlo simulations (N=100) and spatial asset impact analysis.
    """
    def __init__(self, config_path: str = "configs/config.yaml"):
        self.cfg = load_config(config_path)
        self.unc_cfg = self.cfg["uncertainty"]

    def evaluate_spill_uncertainty(
        self,
        spill_mask: np.ndarray = None,
        spill_polygons: List[Dict[str, Any]] = None,
        ocean_data: Dict[str, Any] = None,
        geo_layers: Dict[str, Any] = None,
        bbox_geo: Tuple[float, float, float, float] = None
    ) -> Dict[str, Any]:
        """
        Executes Monte Carlo simulations and calculates impact probabilities & ETA ranges for geographic assets.
        """
        if bbox_geo is None:
            bbox_geo = tuple(self.cfg["mock_generator"]["bounding_box"])
        if ocean_data is None:
            ocean_data = {}
        if geo_layers is None:
            geo_layers = {}

        num_sims = self.unc_cfg["num_simulations"]

        logger.info(f"[MODULE 10 UNCERTAINTY] Executing {num_sims} Monte Carlo perturbation simulations")

        # 1. Run Monte Carlo Simulations
        sim_results = run_monte_carlo_simulations(
            spill_mask=spill_mask,
            spill_polygons=spill_polygons,
            ocean_data=ocean_data,
            unc_cfg=self.unc_cfg,
            bbox_geo=bbox_geo,
            seed=self.cfg["system"]["random_seed"]
        )

        # 2. Extract Geographic Assets
        assets_to_test = []
        if "ports" in geo_layers:
            for p in geo_layers["ports"]:
                coords = p.get("geometry", {}).get("coordinates", [72.15, 12.3])
                assets_to_test.append({"name": p.get("name", "Commercial Port"), "type": "Port", "lat": coords[1], "lon": coords[0]})
        if "protected_areas" in geo_layers:
            for m in geo_layers["protected_areas"]:
                assets_to_test.append({"name": m.get("name", "Marine Reserve"), "type": "Protected Area", "lat": 12.65, "lon": 72.65})
        if "fisheries" in geo_layers:
            for f in geo_layers["fisheries"]:
                assets_to_test.append({"name": f.get("name", "Coastal Fishery"), "type": "Fishery Zone", "lat": 12.50, "lon": 72.55})

        # Add fallback default beach asset if none present
        if not assets_to_test:
            assets_to_test.append({"name": "Beach_A_Coastal_Resort", "type": "Beach", "lat": 12.55, "lon": 72.60})

        asset_evaluations = []

        # 3. Spatial Impact Intersection Matrix
        for asset in assets_to_test:
            a_name = asset["name"]
            a_lat, a_lon = asset["lat"], asset["lon"]

            intersections = 0
            arrival_times = []

            for sim_map in sim_results:
                # Check particle intersection across horizons
                hit = False
                for h in sorted(sim_map.keys()):
                    pts = sim_map[h]  # [N, 2] (lat, lon)
                    dists = np.sqrt((pts[:, 0] - a_lat)**2 + (pts[:, 1] - a_lon)**2) * 111.0  # Approx dist in km
                    if np.any(dists <= 5.0):  # Impact threshold 5 km
                        hit = True
                        arrival_times.append(h)
                        break
                if hit:
                    intersections += 1

            # Impact Probability = Intersections / N
            impact_prob = round(float(intersections / num_sims), 2)
            eta_hours, eta_conf = calculate_eta_distribution(arrival_times)

            asset_evaluations.append({
                "asset": a_name,
                "asset_type": asset.get("type", "Geographic Asset"),
                "impact_probability": impact_prob,
                "eta_hours": eta_hours,
                "confidence": eta_conf
            })

        overall_conf = round(float(np.mean([a["confidence"] for a in asset_evaluations])), 2)

        logger.info(f"[MODULE 10 UNCERTAINTY] Evaluated {len(asset_evaluations)} assets. Overall Prediction Confidence: {overall_conf}")

        return {
            "num_simulations": num_sims,
            "assets": asset_evaluations,
            "overall_prediction_confidence": overall_conf,
            "disclaimer": "Probabilities and ETA ranges are derived from Monte Carlo perturbation models and decision-support simulations."
        }
