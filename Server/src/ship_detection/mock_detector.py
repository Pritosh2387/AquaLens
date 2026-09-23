import cv2
import numpy as np
from typing import List, Dict, Any, Tuple

from src.ship_detection.detector import ShipDetectorBase
from src.data_processing.spatial_alignment import pixel_to_geo_coords


class MockCFARShipDetector(ShipDetectorBase):
    """
    Mock / Baseline CFAR (Constant False Alarm Rate) Physical Ship Detector.
    Detects high backscatter point targets in SAR imagery representing metallic vessel reflections.
    
    TODO [REAL DATA INTEGRATION]:
    Replace or extend with Ultralytics YOLOv8 / RT-DETR fine-tuned on SAR ship detection (HRSID / SSOD datasets).
    """
    def __init__(self, confidence_threshold: float = 0.70, min_peak_db: float = -2.0):
        self.confidence_threshold = confidence_threshold
        self.min_peak_db = min_peak_db

    def detect_ships(
        self,
        sar_raw: np.ndarray,
        bbox_geo: Tuple[float, float, float, float]
    ) -> List[Dict[str, Any]]:
        h, w = sar_raw.shape
        # Threshold bright targets in SAR dB image
        bright_targets = (sar_raw > self.min_peak_db).astype(np.uint8)

        # Connected component analysis for ship targets
        num_labels, labels, stats, centroids = cv2.connectedComponentsWithStats(bright_targets, connectivity=8)

        detected_ships = []
        ship_count = 1

        for i in range(1, num_labels):  # Skip background label 0
            area = stats[i, cv2.CC_STAT_AREA]
            # Ship pixel area filter
            if 2 <= area <= 200:
                xmin = int(stats[i, cv2.CC_STAT_LEFT])
                ymin = int(stats[i, cv2.CC_STAT_TOP])
                width = int(stats[i, cv2.CC_STAT_WIDTH])
                height = int(stats[i, cv2.CC_STAT_HEIGHT])
                xmax = xmin + width
                ymax = ymin + height

                cx, cy = centroids[i]
                lat, lon = pixel_to_geo_coords((cy, cx), (h, w), bbox_geo)

                # Peak intensity score -> confidence
                peak_val = float(np.max(sar_raw[labels == i]))
                conf = float(np.clip(0.70 + 0.03 * (peak_val - self.min_peak_db), 0.75, 0.99))

                detected_ships.append({
                    "ship_id": f"SHIP_SAT_{ship_count:03d}",
                    "mode": "MOCK",
                    "lat": lat,
                    "lon": lon,
                    "confidence": round(conf, 2),
                    "pixel_center": [round(float(cy), 1), round(float(cx), 1)],
                    "pixel_bbox": [ymin, xmin, ymax, xmax]
                })
                ship_count += 1

        return detected_ships
