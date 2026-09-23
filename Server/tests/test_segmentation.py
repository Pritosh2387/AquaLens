import unittest
import torch
import numpy as np

from src.oil_spill_detection.unet import UNet
from src.oil_spill_detection.losses import CombinedSegmentationLoss
from src.oil_spill_detection.postprocessing import postprocess_segmentation_mask


class TestSegmentation(unittest.TestCase):

    def test_unet_forward(self):
        model = UNet(in_channels=1, num_classes=3)
        x = torch.randn(2, 1, 64, 64)
        out = model(x)
        self.assertEqual(out.shape, (2, 3, 64, 64))

    def test_loss(self):
        loss_fn = CombinedSegmentationLoss()
        logits = torch.randn(2, 3, 32, 32)
        targets = torch.randint(0, 3, (2, 32, 32))
        loss = loss_fn(logits, targets)
        self.assertTrue(loss.item() >= 0.0)

    def test_postprocessing(self):
        prob_map = np.zeros((100, 100), dtype=np.float32)
        prob_map[30:60, 40:70] = 0.85
        cleaned_mask, polygons, detected, area = postprocess_segmentation_mask(prob_map, min_area_pixels=10)
        self.assertTrue(detected)
        self.assertTrue(area > 0.0)
        self.assertEqual(len(polygons), 1)


if __name__ == "__main__":
    unittest.main()
