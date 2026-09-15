import numpy as np
from typing import Dict, Any, List, Tuple

from src.hindcast.particles import initialize_hindcast_particles
from src.forecast.integrator import run_forward_particle_integration
from src.uncertainty.perturbations import sample_perturbed_parameters


def run_monte_carlo_simulations(
    spill_mask: np.ndarray = None,
    spill_polygons: List[Dict[str, Any]] = None,
    ocean_data: Dict[str, Any] = None,
    unc_cfg: Dict[str, Any] = None,
    bbox_geo: Tuple[float, float, float, float] = (12.0, 72.0, 13.0, 73.0),
    seed: int = 42
) -> List[Dict[int, np.ndarray]]:
    """
    Executes N Monte Carlo simulation runs with perturbed environmental conditions and initial states.
    Returns list of simulation horizon particle maps.
    """
    if unc_cfg is None:
        unc_cfg = {}

    num_simulations = unc_cfg.get("num_simulations", 100)
    p_count = unc_cfg.get("particle_count", 100)  # Lightweight particle count per simulation

    simulation_results = []

    for sim_idx in range(num_simulations):
        sim_seed = seed + sim_idx * 17
        
        # Sample perturbed initial particles
        init_particles = initialize_hindcast_particles(
            spill_mask=spill_mask,
            spill_polygons=spill_polygons,
            particle_count=p_count,
            bbox_geo=bbox_geo,
            seed=sim_seed
        )

        # Sample perturbed environmental vector fields
        p_ocean = sample_perturbed_parameters(ocean_data, unc_cfg, seed=sim_seed)

        # Run forward integration
        horizon_map = run_forward_particle_integration(
            initial_particles=init_particles,
            ocean_data=p_ocean,
            max_horizon_hours=72.0,
            dt_minutes=15.0,
            windage=p_ocean["windage"],
            diffusion=unc_cfg.get("diffusion", 0.001),
            seed=sim_seed
        )

        simulation_results.append(horizon_map)

    return simulation_results
