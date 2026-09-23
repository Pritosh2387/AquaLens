import numpy as np
from typing import Dict, Any, Tuple


def sample_perturbed_parameters(
    ocean_data: Dict[str, Any],
    unc_cfg: Dict[str, Any],
    seed: int = None
) -> Dict[str, Any]:
    """
    Samples perturbed environmental conditions (wind, current, windage, diffusion) for a Monte Carlo run.
    """
    if seed is not None:
        np.random.seed(seed)

    u_curr = ocean_data.get("current_u", 0.35)
    v_curr = ocean_data.get("current_v", 0.20)
    u_wind = ocean_data.get("wind_u", 3.5)
    v_wind = ocean_data.get("wind_v", 2.0)

    c_unc = unc_cfg.get("current_uncertainty", 0.10)
    w_unc = unc_cfg.get("wind_uncertainty", 0.15)
    windage_unc = unc_cfg.get("windage_uncertainty", 0.005)

    p_curr_u = float(u_curr + np.random.normal(0, c_unc))
    p_curr_v = float(v_curr + np.random.normal(0, c_unc))
    p_wind_u = float(u_wind + np.random.normal(0, w_unc))
    p_wind_v = float(v_wind + np.random.normal(0, w_unc))

    base_windage = unc_cfg.get("windage", 0.03)
    p_windage = float(np.clip(base_windage + np.random.normal(0, windage_unc), 0.01, 0.06))

    return {
        "current_u": p_curr_u,
        "current_v": p_curr_v,
        "wind_u": p_wind_u,
        "wind_v": p_wind_v,
        "windage": p_windage
    }
