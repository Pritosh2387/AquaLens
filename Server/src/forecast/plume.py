import numpy as np
from typing import Dict, Any, List, Tuple
from shapely.geometry import MultiPoint, Polygon, mapping

from src.utils.logging import get_logger
from src.utils.config import load_config
from src.hindcast.particles import initialize_hindcast_particles
from src.forecast.integrator import run_forward_particle_integration

logger = get_logger("ForwardForecastEngine")


class ForwardForecastEngine:
    """
    Module 9 Engine: Simulates forward movement of the oil spill over 6h, 12h, 24h, 48h, 72h horizons
    using physics-based particle advection.
    """
    def __init__(self, config_path: str = "configs/config.yaml"):
        self.cfg = load_config(config_path)
        self.fore_cfg = self.cfg["forecast"]

    def forecast_spill_movement(
        self,
        spill_mask: np.ndarray = None,
        spill_polygons: List[Dict[str, Any]] = None,
        ocean_data: Dict[str, Any] = None,
        bbox_geo: Tuple[float, float, float, float] = None
    ) -> Dict[str, Any]:
        """
        Runs forward particle simulation across 6h, 12h, 24h, 48h, 72h horizons.
        """
        if bbox_geo is None:
            bbox_geo = tuple(self.cfg["mock_generator"]["bounding_box"])
        if ocean_data is None:
            ocean_data = {}

        p_count = self.fore_cfg["particle_count"]
        dt_min = self.fore_cfg["dt_minutes"]
        horizons = self.fore_cfg["horizons_hours"]
        windage = self.fore_cfg["windage"]
        diffusion = self.fore_cfg["diffusion"]

        logger.info(f"[MODULE 9 FORECAST] Running forward simulation ({p_count} particles) for horizons {horizons} hours")

        # 1. Initialize particles from current spill geometry
        initial_particles = initialize_hindcast_particles(
            spill_mask=spill_mask,
            spill_polygons=spill_polygons,
            particle_count=p_count,
            bbox_geo=bbox_geo,
            seed=self.cfg["system"]["random_seed"]
        )

        # 2. Run Forward Particle Integration
        horizon_particles_map = run_forward_particle_integration(
            initial_particles=initial_particles,
            ocean_data=ocean_data,
            max_horizon_hours=max(horizons),
            dt_minutes=dt_min,
            windage=windage,
            diffusion=diffusion,
            seed=self.cfg["system"]["random_seed"]
        )

        forecast_results = {}
        for h in horizons:
            pts = horizon_particles_map.get(h, initial_particles)
            
            # Compute Convex Hull or Bounding Polygon around forward particle cloud
            try:
                # pts format [lat, lon] -> Shapely format [lon, lat]
                shapely_pts = MultiPoint([[p[1], p[0]] for p in pts])
                hull = shapely_pts.convex_hull
                poly_geom = mapping(hull)
            except Exception:
                poly_geom = {"type": "Polygon", "coordinates": []}

            center_lat = round(float(np.mean(pts[:, 0])), 4)
            center_lon = round(float(np.mean(pts[:, 1])), 4)

            forecast_results[f"{h}h"] = {
                "horizon_hours": h,
                "particle_count": len(pts),
                "center_coords": [center_lat, center_lon],
                "predicted_polygon": poly_geom
            }

        logger.info(f"[MODULE 9 FORECAST] Multi-horizon forecast complete across {len(forecast_results)} horizons")

        return {
            "horizons": forecast_results,
            "raw_horizon_particles": horizon_particles_map,
            "particle_count": p_count
        }
