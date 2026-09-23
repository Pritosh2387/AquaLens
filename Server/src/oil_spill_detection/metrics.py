import torch
import numpy as np
from typing import Dict


def compute_segmentation_metrics(
    predictions: torch.Tensor,
    targets: torch.Tensor,
    target_class: int = 1,
    smooth: float = 1e-6
) -> Dict[str, float]:
    """
    Computes IoU, Dice, Precision, Recall, F1 Score, and FPR for a specific target class.
    
    predictions: [B, H, W] or [H, W] (class indices or binary mask)
    targets: [B, H, W] or [H, W] (ground truth class indices)
    """
    if isinstance(predictions, torch.Tensor):
        predictions = predictions.detach().cpu().numpy()
    if isinstance(targets, torch.Tensor):
        targets = targets.detach().cpu().numpy()

    pred_binary = (predictions == target_class).astype(np.uint8)
    gt_binary = (targets == target_class).astype(np.uint8)

    tp = np.sum((pred_binary == 1) & (gt_binary == 1))
    fp = np.sum((pred_binary == 1) & (gt_binary == 0))
    fn = np.sum((pred_binary == 0) & (gt_binary == 1))
    tn = np.sum((pred_binary == 0) & (gt_binary == 0))

    iou = (tp + smooth) / (tp + fp + fn + smooth)
    dice = (2.0 * tp + smooth) / (2.0 * tp + fp + fn + smooth)
    precision = (tp + smooth) / (tp + fp + smooth)
    recall = (tp + smooth) / (tp + fn + smooth)
    f1 = (2.0 * precision * recall) / (precision + recall + smooth)
    fpr = (fp + smooth) / (fp + tn + smooth)

    return {
        "iou": round(float(iou), 4),
        "dice": round(float(dice), 4),
        "precision": round(float(precision), 4),
        "recall": round(float(recall), 4),
        "f1": round(float(f1), 4),
        "false_positive_rate": round(float(fpr), 4)
    }
