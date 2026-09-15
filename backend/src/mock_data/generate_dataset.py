import os
import json
import numpy as np
from typing import Dict, Any

from src.utils.logging import get_logger
from src.utils.config import load_config
from src.utils.seed import set_seed
from src.mock_data.oil_spill_generator import generate_synthetic_slick_mask
from src.mock_data.ship_generator import generate_synthetic_ships
from src.mock_data.sar_generator import generate_synthetic_sar
from src.mock_data.optical_generator import generate_synthetic_optical
from src.mock_data.ais_generator import generate_synthetic_ais
from src.mock_data.ocean_generator import generate_synthetic_oceanographic
from src.mock_data.geographic_generator import generate_synthetic_geographic

logger = get_logger("MockDataGenerator")


def generate_mock_dataset(config_path: str = "configs/config.yaml") -> str:
    """
    Generates a deterministic synthetic dataset saved under data/mock/
    """
    cfg = load_config(config_path)
    seed = cfg["system"]["random_seed"]
    set_seed(seed)

    mock_cfg = cfg["mock_generator"]
    num_samples = mock_cfg["num_samples"]
    img_size = tuple(mock_cfg["image_size"])
    bbox = tuple(mock_cfg["bounding_box"])
    output_dir = cfg["paths"]["mock_data_dir"]

    # Subdirectories
    sar_dir = os.path.join(output_dir, "sar")
    opt_dir = os.path.join(output_dir, "optical")
    mask_dir = os.path.join(output_dir, "masks")
    ais_dir = os.path.join(output_dir, "ais")
    ocean_dir = os.path.join(output_dir, "ocean")
    geo_dir = os.path.join(output_dir, "geographic")
    meta_dir = os.path.join(output_dir, "metadata")

    for d in [sar_dir, opt_dir, mask_dir, ais_dir, ocean_dir, geo_dir, meta_dir]:
        os.makedirs(d, exist_ok=True)

    logger.info(f"[MOCK DATA] Generating {num_samples} synthetic scenes in '{output_dir}'")
    logger.info("NOTE: Synthetic data is strictly for development, testing, and pipeline validation.")

    # Generate static geographic layer once
    geo_data = generate_synthetic_geographic(bbox_geo=bbox, seed=seed)
    with open(os.path.join(geo_dir, "geographic_layers.json"), "w", encoding="utf-8") as f:
        json.dump(geo_data, f, indent=2)

    for idx in range(1, num_samples + 1):
        scene_id = f"SCENE_{idx:03d}"
        sample_seed = seed + idx
        timestamp_str = f"2026-01-01T{10 + (idx % 10):02d}:00:00Z"

        # 1. Mask & Slick metadata
        num_slicks = np.random.randint(0, mock_cfg["max_slicks_per_scene"] + 1) if np.random.rand() < mock_cfg["spill_probability"] else 0
        mask, slick_meta = generate_synthetic_slick_mask(
            shape=img_size,
            num_slicks=num_slicks,
            include_lookalikes=(np.random.rand() < mock_cfg["lookalike_frequency"]),
            seed=sample_seed
        )

        # 2. Physical Ships
        num_ships = np.random.randint(1, mock_cfg["max_ships_per_scene"] + 1) if np.random.rand() < mock_cfg["ship_frequency"] else 0
        ships = generate_synthetic_ships(shape=img_size, num_ships=num_ships, bbox_geo=bbox, seed=sample_seed)

        # 3. SAR Image
        sar_image = generate_synthetic_sar(mask=mask, ships=ships, noise_level=mock_cfg["noise_level"], seed=sample_seed)

        # 4. Optical Image & Cloud Mask
        optical_image, cloud_mask = generate_synthetic_optical(mask=mask, seed=sample_seed)

        # 5. AIS Data
        ais_records = generate_synthetic_ais(satellite_ships=ships, timestamp_str=timestamp_str, bbox_geo=bbox, seed=sample_seed)

        # 6. Oceanographic Data
        ocean_data = generate_synthetic_oceanographic(timestamp_str=timestamp_str, bbox_geo=bbox, seed=sample_seed)

        # Save files
        np.save(os.path.join(sar_dir, f"{scene_id}_sar.npy"), sar_image)
        np.save(os.path.join(opt_dir, f"{scene_id}_optical.npy"), optical_image)
        np.save(os.path.join(opt_dir, f"{scene_id}_cloud_mask.npy"), cloud_mask)
        np.save(os.path.join(mask_dir, f"{scene_id}_mask.npy"), mask)

        with open(os.path.join(ais_dir, f"{scene_id}_ais.json"), "w", encoding="utf-8") as f:
            json.dump(ais_records, f, indent=2)

        with open(os.path.join(ocean_dir, f"{scene_id}_ocean.json"), "w", encoding="utf-8") as f:
            json.dump(ocean_data, f, indent=2)

        scene_meta = {
            "scene_id": scene_id,
            "mode": "MOCK",
            "timestamp": timestamp_str,
            "bbox": list(bbox),
            "image_size": list(img_size),
            "spill_detected_ground_truth": bool(np.any(mask == 1)),
            "slicks": slick_meta,
            "physical_ships": ships,
            "cloud_coverage_pct": round(float(np.mean(cloud_mask) * 100), 2)
        }
        with open(os.path.join(meta_dir, f"{scene_id}_meta.json"), "w", encoding="utf-8") as f:
            json.dump(scene_meta, f, indent=2)

    logger.info(f"[MOCK DATA] Dataset generation completed successfully! Total scenes: {num_samples}")
    return output_dir


if __name__ == "__main__":
    generate_mock_dataset()
