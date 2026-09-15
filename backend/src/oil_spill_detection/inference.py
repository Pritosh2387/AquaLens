import os
import torch
import torch.nn.functional as F
import numpy as np
from typing import Dict, Any, Tuple

from src.utils.logging import get_logger
from src.utils.config import load_config
from src.oil_spill_detection.unet import UNet
from src.oil_spill_detection.postprocessing import postprocess_segmentation_mask

logger = get_logger("OilSpillInference")


class OilSpillDetector:
    """
    Module 2 Segmentation Engine: Runs trained U-Net inference on SAR imagery
    and extracts slick polygons, probabilities, and surface area.
    """
    def __init__(self, config_path: str = "configs/config.yaml", model_path: str = None):
        self.cfg = load_config(config_path)
        self.device = torch.device(self.cfg["system"]["device"] if torch.cuda.is_available() else "cpu")
        
        in_channels = self.cfg["oil_spill_detection"]["in_channels"]
        num_classes = self.cfg["oil_spill_detection"]["num_classes"]

        self.model = UNet(
            in_channels=in_channels,
            num_classes=num_classes,
            features=self.cfg["oil_spill_detection"]["unet"]["features"],
            bilinear=self.cfg["oil_spill_detection"]["unet"]["bilinear"]
        ).to(self.device)

        if model_path is None:
            model_path = os.path.join(self.cfg["paths"]["models_dir"], "unet_oil_spill.pth")

        if os.path.exists(model_path):
            checkpoint = torch.load(model_path, map_location=self.device)
            self.model.load_state_dict(checkpoint["model_state_dict"])
            logger.info(f"[MODULE 2] Loaded trained U-Net checkpoint from '{model_path}'")
        else:
            logger.warning(f"[MODULE 2] Checkpoint not found at '{model_path}'. Running with initialized weights.")

        self.model.eval()

    def predict(self, sar_normalized: np.ndarray, bbox_geo: Tuple[float, float, float, float] = None) -> Dict[str, Any]:
        """
        Runs U-Net segmentation inference on processed SAR image tensor [H, W].
        Returns probability map and postprocessed slick geometries.
        """
        if bbox_geo is None:
            bbox_geo = tuple(self.cfg["mock_generator"]["bounding_box"])

        h, w = sar_normalized.shape
        # Prepare tensor [1, 1, H, W]
        img_tensor = torch.from_numpy(sar_normalized).unsqueeze(0).unsqueeze(0).float().to(self.device)

        with torch.no_grad():
            logits = self.model(img_tensor)
            probs = F.softmax(logits, dim=1)[0, 1].cpu().numpy()  # Class 1 (Oil Spill) probability map

        # Postprocess probability map
        post_cfg = self.cfg["oil_spill_detection"]["postprocessing"]
        cleaned_mask, polygons, spill_detected, total_area_km2 = postprocess_segmentation_mask(
            probs,
            prob_threshold=post_cfg["prob_threshold"],
            min_area_pixels=post_cfg["min_area_pixels"],
            morph_kernel_size=post_cfg["morph_kernel_size"],
            bbox_geo=bbox_geo,
            pixel_size_m=self.cfg["mock_generator"]["spatial_resolution_m"]
        )

        max_spill_prob = float(np.max(probs)) if spill_detected else float(np.mean(probs))

        logger.info(f"[MODULE 2 INFERENCE] Spill Detected: {spill_detected} | Max Prob: {max_spill_prob:.4f} | Area: {total_area_km2} km²")

        return {
            "spill_detected": spill_detected,
            "spill_probability": round(max_spill_prob, 4),
            "spill_area_km2": total_area_km2,
            "slicks_found": len(polygons),
            "polygons": polygons,
            "probability_map": probs,
            "segmentation_mask": cleaned_mask
        }
