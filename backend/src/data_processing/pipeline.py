import os
from dataclasses import dataclass, field
import numpy as np
from typing import Dict, Any, List, Optional, Tuple

from src.utils.logging import get_logger
from src.utils.config import load_config
from src.data_processing.loaders import (
    MockSARLoader, MockOpticalLoader, MockAISLoader, MockOceanLoader, MockGeoLoader
)
from src.data_processing.cleaning import preprocess_sar_data, preprocess_optical_data
from src.data_processing.normalization import normalize_sar, normalize_optical
from src.data_processing.spatial_alignment import align_raster_grid, filter_points_by_bbox
from src.data_processing.temporal_alignment import match_temporal_window
from src.data_processing.feature_extraction import (
    extract_sar_features, extract_optical_features, extract_environmental_features
)

logger = get_logger("DataProcessingPipeline")


@dataclass
class SceneData:
    """Standardized representation of a multi-modal satellite scene."""
    scene_id: str
    mode: str
    timestamp: str
    bbox: Tuple[float, float, float, float]
    sar_raw: np.ndarray
    sar_processed: np.ndarray
    optical_raw: Optional[np.ndarray] = None
    optical_processed: Optional[np.ndarray] = None
    cloud_mask: Optional[np.ndarray] = None
    ground_truth_mask: Optional[np.ndarray] = None
    ais_records: List[Dict[str, Any]] = field(default_factory=list)
    ocean_data: Dict[str, Any] = field(default_factory=dict)
    geographic_layers: Dict[str, Any] = field(default_factory=dict)
    features: Dict[str, Any] = field(default_factory=dict)
    has_optical: bool = False


class DataProcessingPipeline:
    """
    Module 1 Engine: Loads, cleans, aligns, normalizes, and extracts features
    from SAR, Optical, AIS, Oceanographic, and Geographic sources.
    """
    
    def __init__(self, config_path: str = "configs/config.yaml"):
        self.cfg = load_config(config_path)
        self.sar_loader = MockSARLoader()
        self.optical_loader = MockOpticalLoader()
        self.ais_loader = MockAISLoader()
        self.ocean_loader = MockOceanLoader()
        self.geo_loader = MockGeoLoader()

    def process_scene(self, scene_id: str) -> SceneData:
        """
        Executes Module 1 pipeline for a target scene ID.
        """
        mock_dir = self.cfg["paths"]["mock_data_dir"]
        sar_path = os.path.join(mock_dir, "sar", f"{scene_id}_sar.npy")
        opt_path = os.path.join(mock_dir, "optical", f"{scene_id}_optical.npy")
        mask_path = os.path.join(mock_dir, "masks", f"{scene_id}_mask.npy")
        ais_path = os.path.join(mock_dir, "ais", f"{scene_id}_ais.json")
        ocean_path = os.path.join(mock_dir, "ocean", f"{scene_id}_ocean.json")
        geo_path = os.path.join(mock_dir, "geographic", "geographic_layers.json")
        meta_path = os.path.join(mock_dir, "metadata", f"{scene_id}_meta.json")

        logger.info(f"[MODULE 1] Processing Scene '{scene_id}' (Mode: MOCK)")

        # 1. Load Raw Data
        sar_raw = self.sar_loader.load(sar_path)
        optical_raw, cloud_mask = self.optical_loader.load(opt_path) if os.path.exists(opt_path) else (None, None)
        gt_mask = np.load(mask_path) if os.path.exists(mask_path) else None
        ais_records = self.ais_loader.load(ais_path)
        ocean_data = self.ocean_loader.load(ocean_path)
        geo_layers = self.geo_loader.load(geo_path)

        timestamp = ocean_data.get("timestamp", "2026-01-01T12:00:00Z")
        bbox = tuple(self.cfg["mock_generator"]["bounding_box"])

        # 2. SAR Cleaning & Normalization
        sar_cleaned = preprocess_sar_data(
            sar_raw,
            speckle_method=self.cfg["preprocessing"]["sar"]["speckle_filter_method"],
            kernel_size=self.cfg["preprocessing"]["sar"]["speckle_filter_kernel"]
        )
        sar_normalized = normalize_sar(
            sar_cleaned,
            db_min=self.cfg["preprocessing"]["sar"]["db_min"],
            db_max=self.cfg["preprocessing"]["sar"]["db_max"]
        )

        # 3. Optical Cleaning & Normalization (Handling missing optical data)
        has_optical = False
        optical_processed = None
        if optical_raw is not None:
            opt_cleaned, cloud_mask = preprocess_optical_data(
                optical_raw,
                cloud_mask=cloud_mask,
                cloud_threshold=self.cfg["preprocessing"]["optical"]["cloud_threshold"]
            )
            optical_processed = normalize_optical(opt_cleaned)
            has_optical = True
            logger.info(f"[MODULE 1] Optical imagery loaded & processed (Channels: {optical_processed.shape[2]})")
        else:
            logger.warning(f"[MODULE 1] Optical imagery unavailable for scene '{scene_id}'. Falling back to SAR-only mode.")

        # 4. Spatial & Temporal Alignment
        ais_aligned = filter_points_by_bbox(ais_records, bbox)
        ais_synced = match_temporal_window(timestamp, ais_aligned, tolerance_minutes=self.cfg["temporal_alignment"]["tolerance_minutes"])

        # 5. Multi-Domain Feature Extraction
        sar_feats = extract_sar_features(sar_raw, mask=gt_mask)
        opt_feats = extract_optical_features(optical_processed, mask=gt_mask) if has_optical else {}
        env_feats = extract_environmental_features(ocean_data)

        combined_features = {**sar_feats, **opt_feats, **env_feats}

        scene_data = SceneData(
            scene_id=scene_id,
            mode="MOCK",
            timestamp=timestamp,
            bbox=bbox,
            sar_raw=sar_raw,
            sar_processed=sar_normalized,
            optical_raw=optical_raw,
            optical_processed=optical_processed,
            cloud_mask=cloud_mask,
            ground_truth_mask=gt_mask,
            ais_records=ais_synced,
            ocean_data=ocean_data,
            geographic_layers=geo_layers,
            features=combined_features,
            has_optical=has_optical
        )

        logger.info(f"[MODULE 1] Scene '{scene_id}' processed successfully. Features extracted: {len(combined_features)}")
        return scene_data
