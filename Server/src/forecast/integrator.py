import numpy as np
from typing import Dict, Any, Tuple, List


def run_forward_particle_integration(
    initial_particles: np.ndarray,
    ocean_data: Dict[str, Any],
    max_horizon_hours: float = 72.0,
    dt_minutes: float = 10.0,
    windage: float = 0.03,
    diffusion: float = 0.001,
    seed: int = 42
) -> Dict[int, np.ndarray]:
    """
    Integrates particles FORWARD in time from observation timestamp T0 to T0 + max_horizon_hours.
    
    Returns:
        horizon_particles_map: Dict mapping horizon_hours (e.g. 6, 12, 24, 48, 72) -> particle positions [N, 2]
    """
    np.random.seed(seed)
    particles = initial_particles.copy()

    u_curr = ocean_data.get("current_u", 0.35)
    v_curr = ocean_data.get("current_v", 0.20)
    u_wind = ocean_data.get("wind_u", 3.5)
    v_wind = ocean_data.get("wind_v", 2.0)

    u_net = u_curr + windage * u_wind
    v_net = v_curr + windage * v_wind

    dt_sec = dt_minutes * 60.0
    mean_lat_rad = np.radians(np.mean(particles[:, 0]))
    m_per_deg_lat = 111000.0
    m_per_deg_lon = 111000.0 * np.cos(mean_lat_rad)

    dlat_advect = (v_net * dt_sec) / m_per_deg_lat
    dlon_advect = (u_net * dt_sec) / m_per_deg_lon

    target_horizons = [6, 12, 24, 48, 72]
    horizon_results = {}

    current_hours = 0.0
    total_steps = int((max_horizon_hours * 3600.0) / dt_sec)
    steps_per_hour = int(3600.0 / dt_sec)

    for step in range(1, total_steps + 1):
        diff_lat = np.random.normal(0, np.sqrt(2 * diffusion * dt_sec) / m_per_deg_lat, size=len(particles))
        diff_lon = np.random.normal(0, np.sqrt(2 * diffusion * dt_sec) / m_per_deg_lon, size=len(particles))

        particles[:, 0] += dlat_advect + diff_lat
        particles[:, 1] += dlon_advect + diff_lon

        current_hours = step / steps_per_hour
        for h in target_horizons:
            if abs(current_hours - h) < (dt_minutes / 120.0) and h not in horizon_results:
                horizon_results[h] = particles.copy()

    return horizon_results
