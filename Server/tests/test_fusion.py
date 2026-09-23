import unittest
import torch
import numpy as np

from src.fusion.model import SAROpticalFusionModel
from src.fusion.inference import SensorFusionEngine


class TestFusion(unittest.TestCase):

    def test_fusion_model_with_optical(self):
        model = SAROpticalFusionModel(in_channels_sar=1, in_channels_opt=4, num_classes=3)
        sar = torch.randn(2, 1, 64, 64)
        opt = torch.randn(2, 4, 64, 64)
        out = model(sar, opt, has_optical=True)
        self.assertEqual(out.shape, (2, 3, 64, 64))

    def test_fusion_model_missing_optical_fallback(self):
        model = SAROpticalFusionModel(in_channels_sar=1, in_channels_opt=4, num_classes=3)
        sar = torch.randn(2, 1, 64, 64)
        # Missing optical -> has_optical=False
        out = model(sar, opt_img=None, has_optical=False)
        self.assertEqual(out.shape, (2, 3, 64, 64))


if __name__ == "__main__":
    unittest.main()
