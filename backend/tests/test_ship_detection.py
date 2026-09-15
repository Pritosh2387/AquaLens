import unittest
import numpy as np

from src.ship_detection.mock_detector import MockCFARShipDetector
from src.ship_detection.inference import PhysicalShipDetectorEngine


class TestShipDetection(unittest.TestCase):

    def test_cfar_ship_detector(self):
        sar_raw = np.full((100, 100), -15.0, dtype=np.float32)
        # Add synthetic vessel bright peak (+10 dB)
        sar_raw[40:45, 40:45] = 10.0
        
        detector = MockCFARShipDetector(min_peak_db=-2.0)
        ships = detector.detect_ships(sar_raw, (12.0, 72.0, 13.0, 73.0))

        self.assertEqual(len(ships), 1)
        self.assertIn("lat", ships[0])
        self.assertIn("lon", ships[0])
        self.assertIn("pixel_bbox", ships[0])


if __name__ == "__main__":
    unittest.main()
