import numpy as np
from typing import List, Dict, Any, Tuple

from src.utils.logging import get_logger
from src.utils.config import load_config
from src.ship_detection.mock_detector import MockCFARShipDetector

logger = get_logger("PhysicalShipDetectorEngine")


class PhysicalShipDetectorEngine:
    """
    Module 5 Physical Ship Detection Engine:
    Detects physical vessels directly from satellite imagery.
    Does NOT combine AIS and satellite detection inside this module,
    providing clean inputs for future AIS dark-vessel analysis.
    """
    def __init__(self, config_path: str = "configs/config.yaml"):
        self.cfg = load_config(config_path)
        conf_thresh = self.cfg["ship_detection"]["confidence_threshold"]
        self.detector = MockCFARShipDetector(confidence_threshold=conf_thresh)

    def detect_physical_vessels(
        self,
        sar_raw: np.ndarray,
        bbox_geo: Tuple[float, float, float, float] = None
    ) -> List[Dict[str, Any]]:
        if bbox_geo is None:
            bbox_geo = tuple(self.cfg["mock_generator"]["bounding_box"])

        ships = self.detector.detect_ships(sar_raw, bbox_geo)
        logger.info(f"[MODULE 5 SHIP DETECTOR] Physically observed vessels detected in satellite image: {len(ships)}")
        return ships
