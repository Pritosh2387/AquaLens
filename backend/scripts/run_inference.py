import sys
import os
import json

# Add root directory to sys.path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from src.data_processing.pipeline import DataProcessingPipeline
from src.oil_spill_detection.inference import OilSpillDetector
from src.confidence.inference import OilConfidenceEngine
from src.ship_detection.inference import PhysicalShipDetectorEngine

if __name__ == "__main__":
    scene_id = sys.argv[1] if len(sys.argv) > 1 else "SCENE_001"
    config_path = sys.argv[2] if len(sys.argv) > 2 else "configs/config.yaml"

    dp = DataProcessingPipeline(config_path)
    scene = dp.process_scene(scene_id)

    detector = OilSpillDetector(config_path)
    spill_res = detector.predict(scene.sar_processed)

    conf_engine = OilConfidenceEngine(config_path)
    conf_res = conf_engine.evaluate_confidence(spill_res["spill_probability"], scene.features)

    ship_engine = PhysicalShipDetectorEngine(config_path)
    ships = ship_engine.detect_physical_vessels(scene.sar_raw)

    result = {
        "scene_id": scene_id,
        "mode": "MOCK",
        "spill": spill_res,
        "confidence": conf_res,
        "ships": ships
    }
    print(json.dumps(result, indent=2, default=str))
