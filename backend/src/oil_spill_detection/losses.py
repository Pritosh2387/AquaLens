import torch
import torch.nn as nn
import torch.nn.functional as F


class DiceLoss(nn.Module):
    """Multi-class Dice Loss for image segmentation."""
    def __init__(self, smooth: float = 1e-5):
        super(DiceLoss, self).__init__()
        self.smooth = smooth

    def forward(self, logits: torch.Tensor, targets: torch.Tensor) -> torch.Tensor:
        """
        logits: [B, C, H, W]
        targets: [B, H, W]
        """
        num_classes = logits.shape[1]
        probs = F.softmax(logits, dim=1)
        targets_one_hot = F.one_hot(targets, num_classes=num_classes).permute(0, 3, 1, 2).float()

        dice_loss = 0.0
        # Compute Dice loss per class (focusing on non-background classes)
        for c in range(1, num_classes):
            intersection = torch.sum(probs[:, c] * targets_one_hot[:, c])
            cardinality = torch.sum(probs[:, c] + targets_one_hot[:, c])
            dice = (2.0 * intersection + self.smooth) / (cardinality + self.smooth)
            dice_loss += (1.0 - dice)

        return dice_loss / (num_classes - 1 if num_classes > 1 else 1)


class CombinedSegmentationLoss(nn.Module):
    """
    Combined Cross-Entropy + Dice Loss for balanced pixel-level segmentation.
    Loss = ce_weight * CE_Loss + dice_weight * Dice_Loss
    """
    def __init__(self, ce_weight: float = 0.5, dice_weight: float = 0.5):
        super(CombinedSegmentationLoss, self).__init__()
        self.ce_weight = ce_weight
        self.dice_weight = dice_weight
        self.ce_loss = nn.CrossEntropyLoss()
        self.dice_loss = DiceLoss()

    def forward(self, logits: torch.Tensor, targets: torch.Tensor) -> torch.Tensor:
        ce = self.ce_loss(logits, targets)
        dice = self.dice_loss(logits, targets)
        return self.ce_weight * ce + self.dice_weight * dice
