import os
import matplotlib
matplotlib.use("Agg")
import matplotlib.pyplot as plt
import numpy as np
from typing import Dict, Any


def plot_forecast_results(
    scene_id: str,
    forecast_result: Dict[str, Any],
    geo_layers: Dict[str, Any] = None,
    output_dir: str = "outputs/visualizations/forecast"
) -> str:
    """
    Renders multi-horizon (+6h, +12h, +24h, +48h, +72h) spill forecast plume figure.
    """
    os.makedirs(output_dir, exist_ok=True)

    fig, ax = plt.subplots(figsize=(10, 8))
    fig.suptitle(f"Module 9 — Forward Spill Forecast Trajectory [{scene_id}] (Mode: MOCK)", fontsize=13, fontweight="bold")

    raw_particles = forecast_result.get("raw_horizon_particles", {})
    colors = {6: "green", 12: "blue", 24: "orange", 48: "purple", 72: "red"}

    for h, pts in raw_particles.items():
        c = colors.get(h, "black")
        ax.scatter(pts[:, 1], pts[:, 0], color=c, alpha=0.3, s=8, label=f"+{h}h Plume Cloud")

    # Plot Geographic Assets if available
    if geo_layers and "ports" in geo_layers:
        for p in geo_layers["ports"]:
            coords = p.get("geometry", {}).get("coordinates", [72.15, 12.3])
            ax.scatter(coords[0], coords[1], color="black", marker="s", s=80, label=f"Asset: {p.get('name', 'Port')}")

    ax.set_xlabel("Longitude (°E)")
    ax.set_ylabel("Latitude (°N)")
    ax.grid(True, linestyle="--", alpha=0.5)
    ax.legend(loc="upper left")

    save_path = os.path.join(output_dir, f"{scene_id}_forecast_plumes.png")
    plt.savefig(save_path, dpi=150, bbox_inches="tight")
    plt.close(fig)

    return save_path
