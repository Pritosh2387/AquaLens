import os
import matplotlib
matplotlib.use("Agg")
import matplotlib.pyplot as plt
import numpy as np
from typing import Dict, Any, List


def plot_hindcast_results(
    scene_id: str,
    spill_polygons: List[Dict[str, Any]],
    hindcast_result: Dict[str, Any],
    ocean_data: Dict[str, Any],
    output_dir: str = "outputs/visualizations/hindcast"
) -> str:
    """
    Renders a diagnostic hindcast plot:
    - Observed Spill Polygon (T0)
    - Backward Particle Trajectories
    - Estimated Origin Probability Zones (Zone A, Zone B)
    - Ocean Current & Wind Vector Field
    """
    os.makedirs(output_dir, exist_ok=True)

    fig, ax = plt.subplots(figsize=(10, 8))
    fig.suptitle(f"Module 7 — Spill Origin Hindcast Analysis [{scene_id}] (Mode: MOCK)", fontsize=13, fontweight="bold")

    # Plot Backward Trajectories
    trajectories = hindcast_result.get("trajectory_history", [])
    if trajectories:
        traj_stack = np.array(trajectories)  # [num_steps, N, 2]
        num_steps, N, _ = traj_stack.shape
        # Plot sub-sample of particle trajectories
        for p_idx in range(0, N, max(1, N // 40)):
            lats = traj_stack[:, p_idx, 0]
            lons = traj_stack[:, p_idx, 1]
            ax.plot(lons, lats, color="darkorange", alpha=0.3, linewidth=1.0)

    # Plot Origin Centroid & Zones
    centroid = hindcast_result.get("origin_centroid", [12.40, 72.40])
    ax.scatter(centroid[1], centroid[0], color="red", s=150, zorder=5, marker="*", label="Estimated Spill Origin Centroid")

    top_zones = hindcast_result.get("top_origin_zones", [])
    for z in top_zones:
        circle = plt.Circle((z["center_lon"], z["center_lat"]), z["radius_km"] * 0.009,
                            fill=True, color="red", alpha=0.15, label=f"{z['zone_id']} ({int(z['probability']*100)}%)")
        ax.add_patch(circle)

    # Plot Current & Wind Vectors
    u_curr = ocean_data.get("current_u", 0.35)
    v_curr = ocean_data.get("current_v", 0.20)
    u_wind = ocean_data.get("wind_u", 3.5)
    v_wind = ocean_data.get("wind_v", 2.0)

    ax.quiver(centroid[1], centroid[0], u_curr, v_curr, color="blue", scale=5, label=f"Ocean Current ({ocean_data.get('current_speed_ms', 0.4)} m/s)")
    ax.quiver(centroid[1], centroid[0], u_wind * 0.1, v_wind * 0.1, color="cyan", scale=5, label=f"Wind Vector ({ocean_data.get('wind_speed_ms', 4.0)} m/s)")

    ax.set_xlabel("Longitude (°E)")
    ax.set_ylabel("Latitude (°N)")
    ax.grid(True, linestyle="--", alpha=0.5)
    ax.legend(loc="upper right")

    save_path = os.path.join(output_dir, f"{scene_id}_hindcast_origin.png")
    plt.savefig(save_path, dpi=150, bbox_inches="tight")
    plt.close(fig)

    return save_path
