import torch
import torch.nn as nn
import torch.nn.functional as F
from typing import List


class DoubleConv(nn.Module):
    """(Convolution => BatchNorm => ReLU) * 2"""
    def __init__(self, in_channels: int, out_channels: int):
        super(DoubleConv, self).__init__()
        self.double_conv = nn.Sequential(
            nn.Conv2d(in_channels, out_channels, kernel_size=3, padding=1, bias=False),
            nn.BatchNorm2d(out_channels),
            nn.ReLU(inplace=True),
            nn.Conv2d(out_channels, out_channels, kernel_size=3, padding=1, bias=False),
            nn.BatchNorm2d(out_channels),
            nn.ReLU(inplace=True)
        )

    def forward(self, x: torch.Tensor) -> torch.Tensor:
        return self.double_conv(x)


class DownBlock(nn.Module):
    """Downscaling with MaxPool then DoubleConv"""
    def __init__(self, in_channels: int, out_channels: int):
        super(DownBlock, self).__init__()
        self.maxpool_conv = nn.Sequential(
            nn.MaxPool2d(2),
            DoubleConv(in_channels, out_channels)
        )

    def forward(self, x: torch.Tensor) -> torch.Tensor:
        return self.maxpool_conv(x)


class UpBlock(nn.Module):
    """Upscaling then DoubleConv with Skip Connection"""
    def __init__(self, in_channels: int, out_channels: int, bilinear: bool = True):
        super(UpBlock, self).__init__()

        if bilinear:
            self.up = nn.Upsample(scale_factor=2, mode='bilinear', align_corners=True)
            self.conv = DoubleConv(in_channels, out_channels)
        else:
            self.up = nn.ConvTranspose2d(in_channels // 2, in_channels // 2, kernel_size=2, stride=2)
            self.conv = DoubleConv(in_channels, out_channels)

    def forward(self, x1: torch.Tensor, x2: torch.Tensor) -> torch.Tensor:
        x1 = self.up(x1)
        
        # Spatial padding matching if input sizes differ slightly
        diffY = x2.size()[2] - x1.size()[2]
        diffX = x2.size()[3] - x1.size()[3]
        x1 = F.pad(x1, [diffX // 2, diffX - diffX // 2, diffY // 2, diffY - diffY // 2])

        # Concatenate skip connection
        x = torch.cat([x2, x1], dim=1)
        return self.conv(x)


class UNet(nn.Module):
    """
    Standard modular U-Net segmentation baseline architecture.
    Supports modular extension for U-Net++, SegFormer, or Transformer backbones.
    """
    def __init__(
        self,
        in_channels: int = 1,
        num_classes: int = 2,
        features: List[int] = [32, 64, 128, 256],
        bilinear: bool = True
    ):
        super(UNet, self).__init__()
        self.in_channels = in_channels
        self.num_classes = num_classes

        # Encoder
        self.inc = DoubleConv(in_channels, features[0])
        self.down1 = DownBlock(features[0], features[1])
        self.down2 = DownBlock(features[1], features[2])
        self.down3 = DownBlock(features[2], features[3])

        # Bottleneck
        self.bottleneck = DownBlock(features[3], features[3] * 2)

        # Decoder
        self.up1 = UpBlock(features[3] * 2 + features[3], features[3], bilinear)
        self.up2 = UpBlock(features[3] + features[2], features[2], bilinear)
        self.up3 = UpBlock(features[2] + features[1], features[1], bilinear)
        self.up4 = UpBlock(features[1] + features[0], features[0], bilinear)

        # Final Segmentation Head
        self.outc = nn.Conv2d(features[0], num_classes, kernel_size=1)

    def forward(self, x: torch.Tensor) -> torch.Tensor:
        x1 = self.inc(x)
        x2 = self.down1(x1)
        x3 = self.down2(x2)
        x4 = self.down3(x3)

        x5 = self.bottleneck(x4)

        x = self.up1(x5, x4)
        x = self.up2(x, x3)
        x = self.up3(x, x2)
        x = self.up4(x, x1)

        logits = self.outc(x)
        return logits
