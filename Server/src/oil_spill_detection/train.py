import os
import json
import torch
import numpy as np
from torch.utils.data import DataLoader, random_split
from typing import Dict, Any, Tuple

from src.utils.logging import get_logger
from src.utils.config import load_config
from src.utils.seed import set_seed
from src.oil_spill_detection.unet import UNet
from src.oil_spill_detection.dataset import SyntheticOilSpillDataset, custom_collate_fn
from src.oil_spill_detection.losses import CombinedSegmentationLoss
from src.oil_spill_detection.metrics import compute_segmentation_metrics

logger = get_logger("TrainSegmentation")


def train_unet_model(config_path: str = "configs/config.yaml") -> Tuple[UNet, Dict[str, Any]]:
    """
    Trains U-Net model on synthetic dataset and saves model checkpoint and evaluation metrics.
    """
    cfg = load_config(config_path)
    seed = cfg["system"]["random_seed"]
    set_seed(seed)

    device = torch.device(cfg["system"]["device"] if torch.cuda.is_available() else "cpu")
    mock_dir = cfg["paths"]["mock_data_dir"]
    models_dir = cfg["paths"]["models_dir"]
    os.makedirs(models_dir, exist_ok=True)

    train_cfg = cfg["oil_spill_detection"]["training"]
    in_channels = cfg["oil_spill_detection"]["in_channels"]
    num_classes = cfg["oil_spill_detection"]["num_classes"]

    logger.info(f"[MODULE 2 TRAINING] Initializing U-Net Training on Device: {device}")
    logger.info("NOTE: Model is trained on synthetic data for pipeline validation.")

    # 1. Dataset & Train/Val Split
    full_dataset = SyntheticOilSpillDataset(data_dir=mock_dir, include_optical=False)
    val_size = max(1, int(len(full_dataset) * train_cfg["val_split"]))
    train_size = len(full_dataset) - val_size

    train_ds, val_ds = random_split(full_dataset, [train_size, val_size])

    train_loader = DataLoader(train_ds, batch_size=train_cfg["batch_size"], shuffle=True, collate_fn=custom_collate_fn)
    val_loader = DataLoader(val_ds, batch_size=train_cfg["batch_size"], shuffle=False, collate_fn=custom_collate_fn)

    logger.info(f"[MODULE 2 TRAINING] Dataset loaded. Train samples: {train_size}, Val samples: {val_size}")

    # 2. Model, Loss & Optimizer Initialization
    model = UNet(
        in_channels=in_channels,
        num_classes=num_classes,
        features=cfg["oil_spill_detection"]["unet"]["features"],
        bilinear=cfg["oil_spill_detection"]["unet"]["bilinear"]
    ).to(device)

    criterion = CombinedSegmentationLoss(
        ce_weight=cfg["oil_spill_detection"]["loss"]["ce_weight"],
        dice_weight=cfg["oil_spill_detection"]["loss"]["dice_weight"]
    )

    optimizer = torch.optim.AdamW(
        model.parameters(),
        lr=train_cfg["learning_rate"],
        weight_decay=train_cfg["weight_decay"]
    )

    best_val_loss = float("inf")
    best_metrics = {}
    history = {"train_loss": [], "val_loss": [], "val_iou": [], "val_dice": []}

    # 3. Training Loop
    epochs = train_cfg["epochs"]
    for epoch in range(1, epochs + 1):
        model.train()
        train_loss = 0.0

        for images, masks, _ in train_loader:
            images = images.to(device)
            masks = masks.to(device)

            optimizer.zero_grad()
            logits = model(images)
            loss = criterion(logits, masks)
            loss.backward()
            optimizer.step()

            train_loss += loss.item() * images.size(0)

        train_loss /= len(train_loader.dataset)

        # Validation Step
        model.eval()
        val_loss = 0.0
        all_preds = []
        all_targets = []

        with torch.no_grad():
            for images, masks, _ in val_loader:
                images = images.to(device)
                masks = masks.to(device)

                logits = model(images)
                loss = criterion(logits, masks)
                val_loss += loss.item() * images.size(0)

                preds = torch.argmax(logits, dim=1)
                all_preds.append(preds.cpu())
                all_targets.append(masks.cpu())

        val_loss /= len(val_loader.dataset)

        all_preds_cat = torch.cat(all_preds, dim=0)
        all_targets_cat = torch.cat(all_targets, dim=0)
        val_metrics = compute_segmentation_metrics(all_preds_cat, all_targets_cat, target_class=1)

        history["train_loss"].append(round(train_loss, 4))
        history["val_loss"].append(round(val_loss, 4))
        history["val_iou"].append(val_metrics["iou"])
        history["val_dice"].append(val_metrics["dice"])

        logger.info(
            f"Epoch [{epoch}/{epochs}] - Train Loss: {train_loss:.4f} | Val Loss: {val_loss:.4f} | "
            f"Val IoU: {val_metrics['iou']:.4f} | Val Dice: {val_metrics['dice']:.4f}"
        )

        # Save Best Model Checkpoint
        if val_loss < best_val_loss:
            best_val_loss = val_loss
            best_metrics = val_metrics
            checkpoint_path = os.path.join(models_dir, "unet_oil_spill.pth")
            torch.save({
                "epoch": epoch,
                "model_state_dict": model.state_dict(),
                "optimizer_state_dict": optimizer.state_dict(),
                "val_loss": val_loss,
                "metrics": val_metrics,
                "config": cfg["oil_spill_detection"]
            }, checkpoint_path)

    # Save metrics JSON
    metrics_summary = {
        "mode": "MOCK",
        "best_val_loss": round(best_val_loss, 4),
        "best_metrics": best_metrics,
        "history": history
    }
    with open(os.path.join(models_dir, "training_metrics.json"), "w", encoding="utf-8") as f:
        json.dump(metrics_summary, f, indent=2)

    logger.info(f"[MODULE 2 TRAINING] Best Model saved to '{os.path.join(models_dir, 'unet_oil_spill.pth')}'")
    logger.info(f"Final Validation Metrics: IoU={best_metrics.get('iou')}, Dice={best_metrics.get('dice')}, F1={best_metrics.get('f1')}")

    return model, metrics_summary


if __name__ == "__main__":
    train_unet_model()
