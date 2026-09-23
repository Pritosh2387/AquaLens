import torch
import torch.nn.functional as F
import numpy as np
from typing import Dict, Any, Optional

from src.utils.logging import get_logger
from src.utils.config import load_config
from src.fusion.model import SAROpticalFusionModel

logger = get_logger("FusionInference")


class SensorFusionEngine:
    """
    Module 3 Fusion Engine Manager: Performs multi-sensor fusion inference
    and computes sensor contribution metrics.
    """
    def __init__(self, config_path: str = "configs/config.yaml"):
        self.cfg = load_config(config_path)
        self.device = torch.device(self.cfg["system"]["device"] if torch.cuda.is_available() else "cpu")
        
        self.model = SAROpticalFusionModel(
            in_channels_sar=self.cfg["fusion"]["in_channels_sar"],
            in_channels_opt=self.cfg["fusion"]["in_channels_optical"],
            num_classes=self.cfg["oil_spill_detection"]["num_classes"]
        ).to(self.device)

        self.model.eval()

    def predict_fusion(
        self,
        sar_norm: np.ndarray,
        optical_norm: Optional[np.ndarray] = None,
        has_optical: bool = True
    ) -> Dict[str, Any]:
        """
        Runs sensor fusion inference.
        """
        sar_t = torch.from_numpy(sar_norm).unsqueeze(0).unsqueeze(0).float().to(self.device)
        
        opt_t = None
        if has_optical and optical_norm is not None:
            # optical_norm shape [H, W, C] -> [1, C, H, W]
            opt_t = torch.from_numpy(np.transpose(optical_norm, (2, 0, 1))).unsqueeze(0).float().to(self.device)
        else:
            has_optical = False

        with torch.no_grad():
            logits = self.model(sar_t, opt_t, has_optical=has_optical)
            probs = F.softmax(logits, dim=1)[0, 1].cpu().numpy()

        spill_prob = float(np.max(probs))

        # Sensor Contribution Analysis (Diagnostic/Demo values)
        # TODO [REAL DATA INTEGRATION]: Replace stub contribution values with SHAP or Integrated Gradients
        if has_optical:
            sar_contrib = 0.58
            opt_contrib = 0.27
            env_contrib = 0.15
        else:
            sar_contrib = 0.85
            opt_contrib = 0.00
            env_contrib = 0.15

        logger.info(
            f"[MODULE 3 FUSION] Mode: {'SAR+Optical' if has_optical else 'SAR-Only'} | "
            f"Spill Prob: {spill_prob:.4f} | SAR Contrib: {sar_contrib:.2f} | Opt Contrib: {opt_contrib:.2f}"
        )

        return {
            "spill_probability": round(spill_prob, 4),
            "has_optical_used": has_optical,
            "sensor_contributions": {
                "sar_contribution": sar_contrib,
                "optical_contribution": opt_contrib,
                "environmental_contribution": env_contrib,
                "note": "Contributions are diagnostic demo values (TODO: Replace with SHAP/Integrated Gradients)"
            },
            "fusion_probability_map": probs
        }
