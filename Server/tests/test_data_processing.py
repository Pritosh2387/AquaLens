import unittest
import numpy as np

from src.data_processing.cleaning import apply_lee_filter, preprocess_optical_data
from src.data_processing.normalization import normalize_sar, normalize_optical
from src.data_processing.spatial_alignment import align_raster_grid, pixel_to_geo_coords, geo_to_pixel_coords
from src.data_processing.temporal_alignment import match_temporal_window
from src.data_processing.feature_extraction import extract_sar_features, extract_optical_features, extract_shape_features


class TestDataProcessing(unittest.TestCase):

    def test_lee_filter(self):
        img = np.random.uniform(-25.0, -5.0, (64, 64)).astype(np.float32)
        filtered = apply_lee_filter(img, size=5)
        self.assertEqual(filtered.shape, (64, 64))

    def test_normalization(self):
        sar = np.random.uniform(-35.0, 5.0, (32, 32)).astype(np.float32)
        norm_sar = normalize_sar(sar)
        self.assertTrue(np.all(norm_sar >= 0.0) and np.all(norm_sar <= 1.0))

    def test_spatial_coords(self):
        bbox = (12.0, 72.0, 13.0, 73.0)
        shape = (100, 100)
        lat, lon = pixel_to_geo_coords((50, 50), shape, bbox)
        self.assertAlmostEqual(lat, 12.5, delta=0.1)
        self.assertAlmostEqual(lon, 72.5, delta=0.1)

        py, px = geo_to_pixel_coords((lat, lon), shape, bbox)
        self.assertIn(py, [49, 50])
        self.assertIn(px, [49, 50])

    def test_temporal_window(self):
        sat_time = "2026-01-01T12:00:00Z"
        obs = [
            {"timestamp": "2026-01-01T12:15:00Z", "id": 1},
            {"timestamp": "2026-01-01T14:00:00Z", "id": 2}
        ]
        matched = match_temporal_window(sat_time, obs, tolerance_minutes=30.0)
        self.assertEqual(len(matched), 1)
        self.assertEqual(matched[0]["id"], 1)

    def test_feature_extraction(self):
        sar_img = np.random.uniform(-25.0, -5.0, (64, 64)).astype(np.float32)
        feats = extract_sar_features(sar_img)
        self.assertIn("sar_mean_db", feats)
        self.assertIn("sar_texture_score", feats)


if __name__ == "__main__":
    unittest.main()
