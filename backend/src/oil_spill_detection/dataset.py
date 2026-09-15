import os
import glob
import json
import numpy as np
import torch
from torch.utils.data import Dataset
from typing import Dict, Any, Tuple, Optional

from src.data_processing.normalization import normalize_sar, normalize_optical


class SyntheticOilSpillDataset(Dataset):
    """
    PyTorch Dataset for satellite oil spill segmentation.
    Supports SAR-only (1 channel) or SAR + Optical multi-channel inputs.
    """
    def __init__(
        self,
        data_dir: str = "data/mock",
        include_optical: bool = False,
        transform = None
    ):
        self.data_dir = data_dir
        self.include_optical = include_optical
        self.transform = transform

        self.sar_files = sorted(glob.glob(os.path.join(data_dir, "sar", "*_sar.npy")))
        if not self.sar_files:
            raise FileNotFoundError(f"No SAR files found in '{os.path.join(data_dir, 'sar')}'")

    def __len__(self) -> int:
        return len(self.sar_files)

    def __getitem__(self, idx: int) -> Tuple[torch.Tensor, torch.Tensor, Dict[str, Any]]:
        sar_path = self.sar_files[idx]
        filename = os.path.basename(sar_path)
        scene_id = filename.replace("_sar.npy", "")

        mask_path = os.path.join(self.data_dir, "masks", f"{scene_id}_mask.npy")
        opt_path = os.path.join(self.data_dir, "optical", f"{scene_id}_optical.npy")
        meta_path = os.path.join(self.data_dir, "metadata", f"{scene_id}_meta.json")

        # 1. Load SAR image [H, W] and normalize
        sar_img = np.load(sar_path)
        sar_norm = normalize_sar(sar_img)  # range [0, 1]
        
        channels = [np.expand_dims(sar_norm, axis=0)]  # [1, H, W]

        # 2. Load Optical image [H, W, C] if requested & available
        if self.include_optical and os.path.exists(opt_path):
            opt_img = np.load(opt_path)
            opt_norm = normalize_optical(opt_img)  # [H, W, 4]
            opt_norm = np.transpose(opt_norm, (2, 0, 1))  # [4, H, W]
            channels.append(opt_norm)

        # Concatenate channels into multi-channel tensor [C, H, W]
        img_tensor = torch.from_numpy(np.concatenate(channels, axis=0)).float()

        # 3. Load Ground Truth Mask [H, W]
        if os.path.exists(mask_path):
            mask = np.load(mask_path).astype(np.int64)
        else:
            mask = np.zeros((sar_img.shape[0], sar_img.shape[1]), dtype=np.int64)

        mask_tensor = torch.from_numpy(mask).long()

        # 4. Load Metadata
        metadata = {}
        if os.path.exists(meta_path):
            with open(meta_path, "r", encoding="utf-8") as f:
                metadata = json.load(f)

        metadata["scene_id"] = scene_id

        return img_tensor, mask_tensor, metadata


def custom_collate_fn(batch):
    """
    Custom collate function for DataLoader to handle variable length metadata dicts.
    """
    images = torch.stack([item[0] for item in batch], dim=0)
    masks = torch.stack([item[1] for item in batch], dim=0)
    metadatas = [item[2] for item in batch]
    return images, masks, metadatas

