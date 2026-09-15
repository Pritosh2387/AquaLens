import torch
import torch.nn as nn
from typing import Tuple, Dict, Any

from src.oil_spill_detection.unet import UpBlock
from src.fusion.encoders import SAREncoder, OpticalEncoder
from src.fusion.fusion import MidLevelFusionBlock


class SAROpticalFusionModel(nn.Module):
    """
    Module 3 Fusion Engine: Multi-sensor satellite segmentation architecture.
    """
    def __init__(
        self,
        in_channels_sar: int = 1,
        in_channels_opt: int = 4,
        num_classes: int = 3,
        base_channels: int = 32
    ):
        super(SAROpticalFusionModel, self).__init__()
        self.num_classes = num_classes

        # Encoders
        self.sar_encoder = SAREncoder(in_channels=in_channels_sar, base_channels=base_channels)
        self.opt_encoder = OpticalEncoder(in_channels=in_channels_opt, base_channels=base_channels)

        # Fusion Block
        self.fusion = MidLevelFusionBlock(
            sar_channels=base_channels * 4,
            optical_channels=base_channels * 4,
            fused_channels=base_channels * 4
        )

        # Decoder with Skip Connections
        self.up1 = UpBlock(base_channels * 4 + base_channels * 2, base_channels * 2, bilinear=True)
        self.up2 = UpBlock(base_channels * 2 + base_channels, base_channels, bilinear=True)

        # Output Segmentation Head
        self.outc = nn.Conv2d(base_channels, num_classes, kernel_size=1)

    def forward(
        self,
        sar_img: torch.Tensor,
        opt_img: torch.Tensor = None,
        has_optical: bool = True
    ) -> torch.Tensor:
        """
        sar_img: [B, 1, H, W]
        opt_img: [B, 4, H, W] (Optional)
        has_optical: bool flag for fallback
        """
        # Encode SAR
        sar_f1, sar_f2, sar_f3 = self.sar_encoder(sar_img)

        # Encode Optical if available
        opt_f3 = None
        if has_optical and opt_img is not None:
            _, _, opt_f3 = self.opt_encoder(opt_img)

        # Mid-level Fusion
        fused_f3 = self.fusion(sar_f3, opt_f3, has_optical=has_optical)

        # Decode
        x = self.up1(fused_f3, sar_f2)
        x = self.up2(x, sar_f1)

        logits = self.outc(x)
        return logits
