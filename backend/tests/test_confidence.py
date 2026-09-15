import unittest

from src.confidence.features import compile_confidence_feature_vector
from src.confidence.scoring import calculate_weighted_confidence
from src.confidence.inference import OilConfidenceEngine


class TestConfidence(unittest.TestCase):

    def test_feature_compiler(self):
        m1_feats = {"sar_texture_score": 0.45, "wind_speed_ms": 6.5}
        shape_feats = {"shape_score": 0.85, "compactness": 0.15}
        vec = compile_confidence_feature_vector(0.92, m1_feats, shape_feats, has_optical=True)
        self.assertEqual(vec["model_probability"], 0.92)
        self.assertIn("lookalike_probability", vec)

    def test_scoring_high_confidence(self):
        feats = {
            "model_probability": 0.98,
            "shape_score": 0.90,
            "sar_texture_score": 0.85,
            "optical_agreement": 0.90,
            "wind_condition": 0.90,
            "wave_condition": 0.90,
            "lookalike_probability": 0.02
        }
        conf, prob, state, req = calculate_weighted_confidence(feats)
        self.assertEqual(state, "HIGH CONFIDENCE")
        self.assertFalse(req)

    def test_scoring_low_confidence_lookalike(self):
        feats = {
            "model_probability": 0.40,
            "shape_score": 0.20,
            "sar_texture_score": 0.30,
            "optical_agreement": 0.30,
            "wind_condition": 0.30,
            "wave_condition": 0.30,
            "lookalike_probability": 0.80
        }
        conf, prob, state, req = calculate_weighted_confidence(feats)
        self.assertEqual(state, "LOW CONFIDENCE / POSSIBLE LOOK-ALIKE")
        self.assertTrue(req)


if __name__ == "__main__":
    unittest.main()
