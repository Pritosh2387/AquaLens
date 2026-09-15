import os
import matplotlib
matplotlib.use("Agg")  # Non-interactive backend
import matplotlib.pyplot as plt
import numpy as np
from typing import Dict, Any, List, Optional


def visualize_pipeline_results(
    scene_id: str,
    sar_raw: np.ndarray,
    sar_processed: np.ndarray,
    optical_processed: Optional[np.ndarray],
    gt_mask: Optional[np.ndarray],
    prob_map: np.ndarray,
    pred_mask: np.ndarray,
    spill_polygons: List[Dict[str, Any]],
    ship_detections: List[Dict[str, Any]],
    confidence_result: Dict[str, Any],
    output_dir: str = "outputs/visualizations"
) -> str:
    """
    Renders a comprehensive multi-panel visual figure illustrating all pipeline stages:
    1. Raw SAR
    2. Processed SAR (dB scale / normalized)
    3. Optical RGB (if available)
    4. Ground Truth Mask
    5. Oil Spill Probability Map
    6. Thresholded Mask & Polygon Outlines
    7. Physical Ship Detections Overlaid
    8. Confidence & Verification State Overlay
    """
    os.makedirs(output_dir, exist_ok=True)

    fig, axes = plt.subplots(2, 3, figsize=(15, 10))
    fig.suptitle(
        f"Pipeline Output — Scene: {scene_id} [MODE: {confidence_result.get('mode', 'MOCK')}]\n"
        f"Spill Detected: {confidence_result.get('spill_detected')} | Confidence: {confidence_result.get('confidence')} | "
        f"State: {confidence_result.get('verification_state')}",
        fontsize=14, fontweight="bold"
    )

    # Panel 1: Raw SAR
    ax1 = axes[0, 0]
    im1 = ax1.imshow(sar_raw, cmap="gray")
    ax1.set_title("1. Raw SAR Backscatter (dB)")
    plt.colorbar(im1, ax=ax1, fraction=0.046, pad=0.04)

    # Panel 2: Processed & Filtered SAR
    ax2 = axes[0, 1]
    im2 = ax2.imshow(sar_processed, cmap="gray")
    ax2.set_title("2. Preprocessed SAR (Lee Filter)")
    plt.colorbar(im2, ax=ax2, fraction=0.046, pad=0.04)

    # Panel 3: Optical RGB or Missing Placeholder
    ax3 = axes[0, 2]
    if optical_processed is not None and optical_processed.shape[2] >= 3:
        # Bands 2, 1, 0 -> Red, Green, Blue
        rgb = np.stack([optical_processed[:, :, 2], optical_processed[:, :, 1], optical_processed[:, :, 0]], axis=-1)
        rgb_norm = (rgb - np.min(rgb)) / (np.max(rgb) - np.min(rgb) + 1e-8)
        ax3.imshow(rgb_norm)
        ax3.set_title("3. Optical RGB (Sentinel-2 Mock)")
    else:
        ax3.imshow(np.zeros_like(sar_processed), cmap="viridis")
        ax3.text(0.5, 0.5, "Optical Unavailable\n(SAR-Only Fallback)", color="white",
                 ha="center", va="center", transform=ax3.transAxes, fontsize=12, fontweight="bold")
        ax3.set_title("3. Optical Image")

    # Panel 4: Ground Truth Mask
    ax4 = axes[1, 0]
    if gt_mask is not None:
        im4 = ax4.imshow(gt_mask, cmap="tab10", vmin=0, vmax=2)
        ax4.set_title("4. Ground Truth Mask (0:Sea, 1:Oil, 2:Lookalike)")
        plt.colorbar(im4, ax=ax4, fraction=0.046, pad=0.04)
    else:
        ax4.imshow(np.zeros_like(sar_processed), cmap="gray")
        ax4.set_title("4. Ground Truth Mask (N/A)")

    # Panel 5: Predicted Probability Map
    ax5 = axes[1, 1]
    im5 = ax5.imshow(prob_map, cmap="plasma", vmin=0.0, vmax=1.0)
    ax5.set_title("5. U-Net Oil Probability Map")
    plt.colorbar(im5, ax=ax5, fraction=0.046, pad=0.04)

    # Panel 6: Detected Polygons & Ships Overlaid on SAR
    ax6 = axes[1, 2]
    ax6.imshow(sar_processed, cmap="gray")
    ax6.set_title("6. Detections Overlay (Spills & Vessels)")

    # Overlay Ships as red boxes
    for ship in ship_detections:
        bbox = ship.get("pixel_bbox")
        if bbox:
            ymin, xmin, ymax, xmax = bbox
            rect = plt.Rectangle((xmin, ymin), xmax - xmin, ymax - ymin,
                                 fill=False, edgecolor="red", linewidth=2, label="Physical Vessel")
            ax6.add_patch(rect)
            ax6.text(xmin, max(0, ymin - 3), f"{ship.get('ship_id', 'SHIP')}",
                     color="red", fontsize=8, fontweight="bold")

    # Overlay Spill Mask contour in cyan
    if pred_mask is not None and np.any(pred_mask == 1):
        ax6.contour(pred_mask, colors="cyan", linewidths=1.5, levels=[0.5])

    for ax in axes.flat:
        ax.axis("off")

    plt.tight_layout()
    save_path = os.path.join(output_dir, f"{scene_id}_pipeline_result.png")
    plt.savefig(save_path, dpi=150, bbox_inches="tight")
    plt.close(fig)

    return save_path
