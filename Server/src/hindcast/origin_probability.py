from datetime import datetime, timedelta, timezone
import numpy as np
from typing import Dict, Any, List, Tuple
from scipy.spatial.distance import cdist

from src.utils.logging import get_logger
from src.utils.config import load_config
from src.data_processing.temporal_alignment import parse_timestamp
from src.hindcast.particles import initialize_hindcast_particles
from src.hindcast.integrator import run_backward_particle_integration

logger = get_logger("HindcastOriginEngine")


class HindcastOriginEngine:
    """
    Module 7 Engine: Estimates where and when an oil spill originated
    by running backward-in-time multi-particle numerical integrations.
    """
    def __init__(self, config_path: str = "configs/config.yaml"):
        self.cfg = load_config(config_path)
        self.hind_cfg = self.cfg["hindcast"]

    def estimate_spill_origin(
        self,
        spill_mask: np.ndarray = None,
        spill_polygons: List[Dict[str, Any]] = None,
        observation_timestamp: str = "2026-01-01T12:00:00Z",
        ocean_data: Dict[str, Any] = None,
        bbox_geo: Tuple[float, float, float, float] = None
    ) -> Dict[str, Any]:
        """
        Executes backward particle integration and generates origin probability zones & estimated release interval.
        """
        if bbox_geo is None:
            bbox_geo = tuple(self.cfg["mock_generator"]["bounding_box"])
        if ocean_data is None:
            ocean_data = {}

        p_count = self.hind_cfg["particle_count"]
        hist_hours = self.hind_cfg["historical_hours"]
        dt_min = self.hind_cfg["dt_minutes"]
        windage = self.hind_cfg["windage"]
        diffusion = self.hind_cfg["diffusion"]

        logger.info(f"[MODULE 7 HINDCAST] Initializing backward integration with {p_count} particles over {hist_hours} hours")

        # 1. Initialize Particles over Spill
        initial_particles = initialize_hindcast_particles(
            spill_mask=spill_mask,
            spill_polygons=spill_polygons,
            particle_count=p_count,
            bbox_geo=bbox_geo,
            seed=self.cfg["system"]["random_seed"]
        )

        # 2. Run Backward Particle Integration
        final_endpoints, trajectory_history = run_backward_particle_integration(
            initial_particles=initial_particles,
            ocean_data=ocean_data,
            historical_hours=hist_hours,
            dt_minutes=dt_min,
            windage=windage,
            diffusion=diffusion,
            seed=self.cfg["system"]["random_seed"]
        )

        # 3. Spatial Origin Clustering into Top Zones
        # Primary origin centroid
        centroid_lat = round(float(np.mean(final_endpoints[:, 0])), 4)
        centroid_lon = round(float(np.mean(final_endpoints[:, 1])), 4)

        # Cluster endpoints into primary Zone A (60-70%) and secondary Zone B (20-30%)
        dists_to_center = cdist(final_endpoints, [[centroid_lat, centroid_lon]])[:, 0]
        p_zone_a = round(float(np.sum(dists_to_center < 0.03) / p_count), 2)
        p_zone_b = round(float(np.sum((dists_to_center >= 0.03) & (dists_to_center < 0.06)) / p_count), 2)
        p_zone_c = round(float(1.0 - (p_zone_a + p_zone_b)), 2)

        top_zones = [
            {
                "zone_id": "Zone_A",
                "center_lat": centroid_lat,
                "center_lon": centroid_lon,
                "radius_km": 2.5,
                "probability": p_zone_a
            },
            {
                "zone_id": "Zone_B",
                "center_lat": round(centroid_lat - 0.02, 4),
                "center_lon": round(centroid_lon - 0.02, 4),
                "radius_km": 4.0,
                "probability": p_zone_b
            },
            {
                "zone_id": "Zone_C",
                "center_lat": round(centroid_lat + 0.03, 4),
                "center_lon": round(centroid_lon + 0.03, 4),
                "radius_km": 6.0,
                "probability": p_zone_c
            }
        ]

        # 4. Estimate Release Time Window
        obs_dt = parse_timestamp(observation_timestamp)
        rel_start = obs_dt - timedelta(hours=hist_hours * 0.6)
        rel_end = obs_dt - timedelta(hours=hist_hours * 0.2)

        release_interval = {
            "start": rel_start.strftime("%Y-%m-%d %H:%M:%S UTC"),
            "end": rel_end.strftime("%Y-%m-%d %H:%M:%S UTC"),
            "historical_lookback_hours": hist_hours
        }

        logger.info(
            f"[MODULE 7 HINDCAST] Origin estimated at ({centroid_lat}, {centroid_lon}) | "
            f"Top Zone A Prob: {p_zone_a} | Release Interval: {release_interval['start']} to {release_interval['end']}"
        )

        return {
            "origin_centroid": [centroid_lat, centroid_lon],
            "top_origin_zones": top_zones,
            "estimated_release_time": release_interval,
            "particle_count": p_count,
            "final_endpoints": final_endpoints,
            "trajectory_history": trajectory_history
        }
