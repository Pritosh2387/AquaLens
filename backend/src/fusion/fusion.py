import torch
import torch.nn as nn


class MidLevelFusionBlock(nn.Module):
    """
    Fuses deep feature maps from SAR and Optical encoders via channel concatenation
    and 1x1 convolution bottleneck projection.
    """
    def __init__(self, sar_channels: int = 128, optical_channels: int = 128, fused_channels: int = 128):
        super(MidLevelFusionBlock, self).__init__()
        self.fusion_conv = nn.Sequential(
            nn.Conv2d(sar_channels + optical_channels, fused_channels, kernel_size=1, bias=False),
            nn.BatchNorm2d(fused_channels),
            nn.ReLU(inplace=True)
        )
        self.sar_only_proj = nn.Sequential(
            nn.Conv2d(sar_channels, fused_channels, kernel_size=1, bias=False),
            nn.BatchNorm2d(fused_channels),
            nn.ReLU(inplace=True)
        )

    def forward(self, sar_feat: torch.Tensor, opt_feat: torch.Tensor = None, has_optical: bool = True) -> torch.Tensor:
        """
        sar_feat: [B, C_sar, H, W]
        opt_feat: [B, C_opt, H, W]
        has_optical: bool
        """
        if has_optical and opt_feat is not None:
            concatenated = torch.cat([sar_feat, opt_feat], dim=1)
            return self.fusion_conv(concatenated)
        else:
            # Fallback to SAR-only feature representation
            return self.sar_only_proj(sar_feat)
