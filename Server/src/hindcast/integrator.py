import numpy as np
from typing import Dict, Any, Tuple, List


def run_backward_particle_integration(
    initial_particles: np.ndarray,
    ocean_data: Dict[str, Any],
    historical_hours: float = 6.0,
    dt_minutes: float = 10.0,
    windage: float = 0.03,
    diffusion: float = 0.001,
    seed: int = 42
) -> Tuple[np.ndarray, List[np.ndarray]]:
    """
    Integrates particles BACKWARD in time from observation timestamp T0 to T0 - historical_hours.
    
    Physics modeled:
    - Reverse ocean current velocity vector (-u_curr, -v_curr)
    - Reverse windage drift vector (-k_wind * u_wind, -k_wind * v_wind)
    - Stochastic Brownian diffusion random walk
    
    Returns:
        final_endpoints: numpy array [N, 2] (lat, lon) at origin time T0 - historical_hours
        trajectory_history: List of numpy arrays [N, 2] at each timestep
    """
    np.random.seed(seed)
    particles = initial_particles.copy()

    # Environmental velocities in m/s
    u_curr = ocean_data.get("current_u", 0.35)
    v_curr = ocean_data.get("current_v", 0.20)
    u_wind = ocean_data.get("wind_u", 3.5)
    v_wind = ocean_data.get("wind_v", 2.0)

    # Net advection velocity (m/s)
    u_net = u_curr + windage * u_wind
    v_net = v_curr + windage * v_wind

    dt_sec = dt_minutes * 60.0
    num_steps = int((historical_hours * 3600.0) / dt_sec)

    # Conversion factor from meters to degrees lat/lon
    # 1 deg lat ~ 111,000 m; 1 deg lon ~ 111,000 * cos(lat) m
    mean_lat_rad = np.radians(np.mean(particles[:, 0]))
    m_per_deg_lat = 111000.0
    m_per_deg_lon = 111000.0 * np.cos(mean_lat_rad)

    # Reverse advection displacement per timestep (degrees)
    dlat_advect = -(v_net * dt_sec) / m_per_deg_lat
    dlon_advect = -(u_net * dt_sec) / m_per_deg_lon

    trajectory_history = [particles.copy()]

    for _ in range(num_steps):
        # Add stochastic Brownian diffusion
        diff_lat = np.random.normal(0, np.sqrt(2 * diffusion * dt_sec) / m_per_deg_lat, size=len(particles))
        diff_lon = np.random.normal(0, np.sqrt(2 * diffusion * dt_sec) / m_per_deg_lon, size=len(particles))

        particles[:, 0] += dlat_advect + diff_lat
        particles[:, 1] += dlon_advect + diff_lon

        trajectory_history.append(particles.copy())

    return particles, trajectory_history
