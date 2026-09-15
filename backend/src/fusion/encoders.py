import torch
import torch.nn as nn
from typing import Tuple

from src.oil_spill_detection.unet import DoubleConv, DownBlock


class SAREncoder(nn.Module):
    """
    Dedicated SAR Feature Extractor Encoder.
    Input: [B, 1, H, W] -> Deep Feature Map [B, 128, H/4, W/4]
    """
    def __init__(self, in_channels: int = 1, base_channels: int = 32):
        super(SAREncoder, self).__init__()
        self.inc = DoubleConv(in_channels, base_channels)
        self.down1 = DownBlock(base_channels, base_channels * 2)
        self.down2 = DownBlock(base_channels * 2, base_channels * 4)

    def forward(self, x: torch.Tensor) -> Tuple[torch.Tensor, torch.Tensor, torch.Tensor]:
        f1 = self.inc(x)         # [B, 32, H, W]
        f2 = self.down1(f1)      # [B, 64, H/2, W/2]
        f3 = self.down2(f2)      # [B, 128, H/4, W/4]
        return f1, f2, f3


class OpticalEncoder(nn.Module):
    """
    Dedicated Optical Multi-Spectral Feature Extractor Encoder.
    Input: [B, 4, H, W] -> Deep Feature Map [B, 128, H/4, W/4]
    """
    def __init__(self, in_channels: int = 4, base_channels: int = 32):
        super(OpticalEncoder, self).__init__()
        self.inc = DoubleConv(in_channels, base_channels)
        self.down1 = DownBlock(base_channels, base_channels * 2)
        self.down2 = DownBlock(base_channels * 2, base_channels * 4)

    def forward(self, x: torch.Tensor) -> Tuple[torch.Tensor, torch.Tensor, torch.Tensor]:
        f1 = self.inc(x)         # [B, 32, H, W]
        f2 = self.down1(f1)      # [B, 64, H/2, W/2]
        f3 = self.down2(f2)      # [B, 128, H/4, W/4]
        return f1, f2, f3
