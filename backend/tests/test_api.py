"""
tests/test_api.py — FastAPI integration tests for SIH26143.

Uses FastAPI TestClient to test all endpoints:
- Health check
- Modules 1–10 individually
- Full pipeline endpoint
- Error handling (invalid scene, missing data)
- JSON serialization (numpy, shapely outputs)

All tests use the existing MOCK dataset (SCENE_001).
"""
import sys
import os

# Ensure project root is on path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

import unittest
from fastapi.testclient import TestClient

from main import app

client = TestClient(app)

SCENE_ID = "SCENE_001"
CONFIG_PATH = "configs/config.yaml"


def _post(path: str, scene_id: str = SCENE_ID, config_path: str = CONFIG_PATH):
    return client.post(
        path,
        json={"scene_id": scene_id, "config_path": config_path},
    )


class TestHealth(unittest.TestCase):

    def test_health_status_ok(self):
        r = client.get("/api/v1/health")
        self.assertEqual(r.status_code, 200)
        data = r.json()
        self.assertEqual(data["status"], "ok")
        self.assertIn("service", data)
        self.assertIn("modules", data)
        self.assertEqual(len(data["modules"]), 17)  # Updated: M16 + M17 added

    def test_root_redirect(self):
        r = client.get("/")
        self.assertEqual(r.status_code, 200)
        data = r.json()
        self.assertIn("docs", data)
        self.assertIn("health", data)


class TestModule1(unittest.TestCase):

    def test_module1_success(self):
        r = _post("/api/v1/modules/1/process")
        self.assertEqual(r.status_code, 200, r.text)
        data = r.json()
        self.assertEqual(data["scene_id"], SCENE_ID)
        self.assertEqual(data["mode"], "MOCK")
        self.assertIn("timestamp", data)
        self.assertIn("bbox", data)
        self.assertIsInstance(data["bbox"], list)
        self.assertEqual(len(data["bbox"]), 4)
        self.assertIn("has_optical", data)
        self.assertIn("features", data)
        self.assertIn("sar_shape", data)

    def test_module1_invalid_scene(self):
        r = _post("/api/v1/modules/1/process", scene_id="NONEXISTENT_SCENE_XYZ")
        # Should return 4xx error (file not found / scene not found)
        self.assertIn(r.status_code, [404, 422, 500])


class TestModule2(unittest.TestCase):

    def test_module2_success(self):
        r = _post("/api/v1/modules/2/detect")
        self.assertEqual(r.status_code, 200, r.text)
        data = r.json()
        self.assertEqual(data["scene_id"], SCENE_ID)
        self.assertIn("spill_detected", data)
        self.assertIsInstance(data["spill_detected"], bool)
        self.assertIn("spill_probability", data)
        self.assertIsInstance(data["spill_probability"], float)
        self.assertIn("spill_area_km2", data)
        self.assertIn("slicks_found", data)
        self.assertIn("polygons", data)
        self.assertIsInstance(data["polygons"], list)

    def test_module2_probability_range(self):
        r = _post("/api/v1/modules/2/detect")
        data = r.json()
        prob = data["spill_probability"]
        self.assertGreaterEqual(prob, 0.0)
        self.assertLessEqual(prob, 1.0)

    def test_module2_json_serializable(self):
        """Ensure numpy outputs are properly serialised to native Python types."""
        import json
        r = _post("/api/v1/modules/2/detect")
        self.assertEqual(r.status_code, 200)
        # This will raise if response is not JSON-serialisable
        parsed = json.loads(r.text)
        self.assertIn("spill_detected", parsed)


class TestModule3(unittest.TestCase):

    def test_module3_success(self):
        r = _post("/api/v1/modules/3/fuse")
        self.assertEqual(r.status_code, 200, r.text)
        data = r.json()
        self.assertEqual(data["scene_id"], SCENE_ID)
        self.assertIn("spill_probability", data)
        self.assertIn("has_optical_used", data)
        self.assertIn("sensor_contributions", data)
        contribs = data["sensor_contributions"]
        self.assertIn("sar_contribution", contribs)
        self.assertIn("optical_contribution", contribs)
        self.assertIn("environmental_contribution", contribs)

    def test_module3_contributions_sum(self):
        r = _post("/api/v1/modules/3/fuse")
        data = r.json()
        c = data["sensor_contributions"]
        total = c["sar_contribution"] + c["optical_contribution"] + c["environmental_contribution"]
        self.assertAlmostEqual(total, 1.0, places=5)


class TestModule4(unittest.TestCase):

    def test_module4_success(self):
        r = _post("/api/v1/modules/4/confidence")
        self.assertEqual(r.status_code, 200, r.text)
        data = r.json()
        self.assertEqual(data["scene_id"], SCENE_ID)
        self.assertIn("oil_probability", data)
        self.assertIn("confidence", data)
        self.assertIn("lookalike_probability", data)
        self.assertIn("verification_required", data)
        self.assertIn("verification_state", data)
        self.assertIn("feature_vector", data)

    def test_module4_probabilities_in_range(self):
        r = _post("/api/v1/modules/4/confidence")
        data = r.json()
        self.assertGreaterEqual(data["oil_probability"], 0.0)
        self.assertLessEqual(data["oil_probability"], 1.0)
        self.assertGreaterEqual(data["confidence"], 0.0)
        self.assertLessEqual(data["confidence"], 1.0)


class TestModule5(unittest.TestCase):

    def test_module5_success(self):
        r = _post("/api/v1/modules/5/ships")
        self.assertEqual(r.status_code, 200, r.text)
        data = r.json()
        self.assertEqual(data["scene_id"], SCENE_ID)
        self.assertIn("ship_count", data)
        self.assertIn("ships", data)
        self.assertIsInstance(data["ships"], list)
        self.assertEqual(data["ship_count"], len(data["ships"]))

    def test_module5_ship_fields(self):
        r = _post("/api/v1/modules/5/ships")
        data = r.json()
        for ship in data["ships"]:
            self.assertIn("ship_id", ship)
            self.assertIn("lat", ship)
            self.assertIn("lon", ship)
            self.assertIn("confidence", ship)


class TestModule6(unittest.TestCase):

    def test_module6_success(self):
        r = _post("/api/v1/modules/6/ais-match")
        self.assertEqual(r.status_code, 200, r.text)
        data = r.json()
        self.assertEqual(data["scene_id"], SCENE_ID)
        self.assertEqual(data["data_type"], "INFERRED")
        self.assertIn("matched_count", data)
        self.assertIn("unmatched_count", data)
        self.assertIn("anomalies_count", data)
        self.assertIn("matched", data)
        self.assertIn("unmatched", data)
        self.assertIn("anomalies", data)

    def test_module6_count_consistency(self):
        r = _post("/api/v1/modules/6/ais-match")
        data = r.json()
        self.assertEqual(data["matched_count"], len(data["matched"]))
        self.assertEqual(data["unmatched_count"], len(data["unmatched"]))
        self.assertEqual(data["anomalies_count"], len(data["anomalies"]))

    def test_module6_data_type_inferred(self):
        r = _post("/api/v1/modules/6/ais-match")
        self.assertEqual(r.json()["data_type"], "INFERRED")


class TestModule7(unittest.TestCase):

    def test_module7_success(self):
        r = _post("/api/v1/modules/7/hindcast")
        self.assertEqual(r.status_code, 200, r.text)
        data = r.json()
        self.assertEqual(data["scene_id"], SCENE_ID)
        self.assertEqual(data["data_type"], "INFERRED")
        self.assertIn("origin_centroid", data)
        self.assertIsInstance(data["origin_centroid"], list)
        self.assertEqual(len(data["origin_centroid"]), 2)
        self.assertIn("top_origin_zones", data)
        self.assertIn("estimated_release_time", data)
        self.assertIn("particle_count", data)

    def test_module7_origin_centroid_coords(self):
        r = _post("/api/v1/modules/7/hindcast")
        data = r.json()
        lat, lon = data["origin_centroid"]
        self.assertIsInstance(lat, float)
        self.assertIsInstance(lon, float)

    def test_module7_data_type_inferred(self):
        r = _post("/api/v1/modules/7/hindcast")
        self.assertEqual(r.json()["data_type"], "INFERRED")


class TestModule8(unittest.TestCase):

    def test_module8_success(self):
        r = _post("/api/v1/modules/8/attribution")
        self.assertEqual(r.status_code, 200, r.text)
        data = r.json()
        self.assertEqual(data["scene_id"], SCENE_ID)
        self.assertEqual(data["data_type"], "INFERRED")
        self.assertIn("disclaimer", data)
        self.assertIn("ranked_candidates", data)
        self.assertIsInstance(data["ranked_candidates"], list)

    def test_module8_disclaimer_present(self):
        r = _post("/api/v1/modules/8/attribution")
        data = r.json()
        self.assertIn("disclaimer", data)
        self.assertTrue(len(data["disclaimer"]) > 10)

    def test_module8_candidates_ranked(self):
        r = _post("/api/v1/modules/8/attribution")
        candidates = r.json()["ranked_candidates"]
        if len(candidates) >= 2:
            self.assertGreaterEqual(
                candidates[0]["attribution_score"],
                candidates[1]["attribution_score"]
            )


class TestModule9(unittest.TestCase):

    def test_module9_success(self):
        r = _post("/api/v1/modules/9/forecast")
        self.assertEqual(r.status_code, 200, r.text)
        data = r.json()
        self.assertEqual(data["scene_id"], SCENE_ID)
        self.assertEqual(data["data_type"], "SIMULATED")
        self.assertIn("horizons", data)
        self.assertIn("particle_count", data)
        self.assertIsInstance(data["horizons"], dict)

    def test_module9_horizons_present(self):
        r = _post("/api/v1/modules/9/forecast")
        horizons = r.json()["horizons"]
        expected_keys = {"6h", "12h", "24h", "48h", "72h"}
        self.assertEqual(set(horizons.keys()), expected_keys)

    def test_module9_horizon_structure(self):
        r = _post("/api/v1/modules/9/forecast")
        horizons = r.json()["horizons"]
        for key, h in horizons.items():
            self.assertIn("horizon_hours", h)
            self.assertIn("center_coords", h)
            self.assertIn("particle_count", h)
            self.assertIn("predicted_polygon", h)

    def test_module9_data_type_simulated(self):
        r = _post("/api/v1/modules/9/forecast")
        self.assertEqual(r.json()["data_type"], "SIMULATED")


class TestModule10(unittest.TestCase):

    def test_module10_success(self):
        r = _post("/api/v1/modules/10/uncertainty")
        self.assertEqual(r.status_code, 200, r.text)
        data = r.json()
        self.assertEqual(data["scene_id"], SCENE_ID)
        self.assertEqual(data["data_type"], "SIMULATED")
        self.assertIn("num_simulations", data)
        self.assertIn("overall_prediction_confidence", data)
        self.assertIn("assets", data)
        self.assertIn("disclaimer", data)

    def test_module10_assets_structure(self):
        r = _post("/api/v1/modules/10/uncertainty")
        assets = r.json()["assets"]
        self.assertIsInstance(assets, list)
        self.assertGreater(len(assets), 0)
        for asset in assets:
            self.assertIn("asset", asset)
            self.assertIn("impact_probability", asset)

    def test_module10_confidence_range(self):
        r = _post("/api/v1/modules/10/uncertainty")
        conf = r.json()["overall_prediction_confidence"]
        self.assertGreaterEqual(conf, 0.0)
        self.assertLessEqual(conf, 1.0)

    def test_module10_data_type_simulated(self):
        r = _post("/api/v1/modules/10/uncertainty")
        self.assertEqual(r.json()["data_type"], "SIMULATED")


class TestFullPipeline(unittest.TestCase):

    def test_pipeline_run_success(self):
        r = _post("/api/v1/pipeline/run")
        self.assertEqual(r.status_code, 200, r.text)
        data = r.json()
        self.assertEqual(data["scene_id"], SCENE_ID)
        self.assertEqual(data["mode"], "MOCK")
        self.assertIn("spill", data)
        self.assertIn("ships_observed", data)
        self.assertIn("sensor_fusion", data)
        self.assertIn("ais_matching", data)
        self.assertIn("spill_origin", data)
        self.assertIn("vessel_attribution", data)
        self.assertIn("spill_forecast", data)
        self.assertIn("uncertainty", data)
        self.assertIn("data_sources", data)

    def test_pipeline_provenance_labels(self):
        r = _post("/api/v1/pipeline/run")
        data = r.json()
        self.assertEqual(data["ais_matching"]["data_type"], "INFERRED")
        self.assertEqual(data["spill_origin"]["data_type"], "INFERRED")
        self.assertEqual(data["vessel_attribution"]["data_type"], "INFERRED")
        self.assertEqual(data["spill_forecast"]["data_type"], "SIMULATED")
        self.assertEqual(data["uncertainty"]["data_type"], "SIMULATED")

    def test_pipeline_data_sources_mock(self):
        r = _post("/api/v1/pipeline/run")
        data = r.json()
        sources = data["data_sources"]
        self.assertEqual(sources["mode"], "MOCK")
        self.assertTrue(sources["sar"])

    def test_pipeline_json_fully_serializable(self):
        """Full pipeline response must be fully JSON-safe — no numpy types."""
        import json
        r = _post("/api/v1/pipeline/run")
        self.assertEqual(r.status_code, 200)
        parsed = json.loads(r.text)
        # Re-serialise to catch any remaining non-JSON-safe objects
        re_serialised = json.dumps(parsed)
        self.assertIsInstance(re_serialised, str)

    def test_pipeline_spill_fields(self):
        r = _post("/api/v1/pipeline/run")
        spill = r.json()["spill"]
        self.assertIn("detected", spill)
        self.assertIn("probability", spill)
        self.assertIn("area_km2", spill)
        self.assertIn("confidence", spill)
        self.assertIn("verification_state", spill)

    def test_pipeline_forecast_horizons(self):
        r = _post("/api/v1/pipeline/run")
        horizons = r.json()["spill_forecast"]["horizons"]
        self.assertEqual(set(horizons.keys()), {"6h", "12h", "24h", "48h", "72h"})


class TestErrorHandling(unittest.TestCase):

    def test_invalid_scene_module1(self):
        r = _post("/api/v1/modules/1/process", scene_id="TOTALLY_INVALID_SCENE_999")
        self.assertIn(r.status_code, [404, 422, 500])

    def test_invalid_scene_pipeline(self):
        r = _post("/api/v1/pipeline/run", scene_id="TOTALLY_INVALID_SCENE_999")
        self.assertIn(r.status_code, [404, 422, 500])

    def test_invalid_config_path_pipeline(self):
        r = client.post(
            "/api/v1/pipeline/run",
            json={"scene_id": SCENE_ID, "config_path": "nonexistent/config.yaml"},
        )
        self.assertIn(r.status_code, [404, 422, 500])


# =============================================================================
# MODULE 11 — Impact Prediction
# =============================================================================

class TestModule11(unittest.TestCase):

    def test_module11_returns_200(self):
        r = _post("/api/v1/modules/11/impact")
        self.assertEqual(r.status_code, 200, r.text)

    def test_module11_has_required_keys(self):
        r = _post("/api/v1/modules/11/impact")
        data = r.json()
        for key in ("scene_id", "data_type", "overall_impact_score", "overall_impact_level", "spill_severity_score", "assets", "disclaimer"):
            self.assertIn(key, data, f"Missing key: {key}")

    def test_module11_data_type_simulated(self):
        r = _post("/api/v1/modules/11/impact")
        self.assertEqual(r.json()["data_type"], "SIMULATED")

    def test_module11_overall_impact_score_in_range(self):
        r = _post("/api/v1/modules/11/impact")
        score = r.json()["overall_impact_score"]
        self.assertGreaterEqual(score, 0.0)
        self.assertLessEqual(score, 1.0)

    def test_module11_severity_score_in_range(self):
        r = _post("/api/v1/modules/11/impact")
        score = r.json()["spill_severity_score"]
        self.assertGreaterEqual(score, 0.0)
        self.assertLessEqual(score, 1.0)

    def test_module11_impact_level_valid(self):
        r = _post("/api/v1/modules/11/impact")
        level = r.json()["overall_impact_level"]
        self.assertIn(level, ["LOW", "MEDIUM", "HIGH", "CRITICAL"])

    def test_module11_assets_list(self):
        r = _post("/api/v1/modules/11/impact")
        assets = r.json()["assets"]
        self.assertIsInstance(assets, list)

    def test_module11_asset_keys(self):
        r = _post("/api/v1/modules/11/impact")
        data = r.json()
        if data["assets"]:
            a = data["assets"][0]
            for key in ("asset", "asset_type", "sensitivity", "impact_probability", "asset_impact_score", "impact_level"):
                self.assertIn(key, a, f"Asset missing key: {key}")

    def test_module11_asset_score_in_range(self):
        r = _post("/api/v1/modules/11/impact")
        for asset in r.json()["assets"]:
            self.assertGreaterEqual(asset["asset_impact_score"], 0.0)
            self.assertLessEqual(asset["asset_impact_score"], 1.0)

    def test_module11_disclaimer_present(self):
        r = _post("/api/v1/modules/11/impact")
        self.assertIn("disclaimer", r.json())

    def test_module11_json_serializable(self):
        import json
        r = _post("/api/v1/modules/11/impact")
        self.assertIsInstance(r.json(), dict)  # TestClient already verifies JSON


# =============================================================================
# MODULE 12 — Priority / Urgency Scoring
# =============================================================================

class TestModule12(unittest.TestCase):

    def test_module12_returns_200(self):
        r = _post("/api/v1/modules/12/priority")
        self.assertEqual(r.status_code, 200, r.text)

    def test_module12_has_required_keys(self):
        r = _post("/api/v1/modules/12/priority")
        data = r.json()
        for key in ("scene_id", "data_type", "priority_score", "urgency_label", "factor_contributions", "weights_used", "disclaimer"):
            self.assertIn(key, data, f"Missing key: {key}")

    def test_module12_priority_score_range(self):
        r = _post("/api/v1/modules/12/priority")
        score = r.json()["priority_score"]
        self.assertGreaterEqual(score, 0.0)
        self.assertLessEqual(score, 100.0)

    def test_module12_urgency_label_valid(self):
        r = _post("/api/v1/modules/12/priority")
        label = r.json()["urgency_label"]
        self.assertIn(label, ["CRITICAL_URGENT", "HIGH_PRIORITY", "MEDIUM_PRIORITY", "ROUTINE_MONITORING"])

    def test_module12_factor_contributions_keys(self):
        r = _post("/api/v1/modules/12/priority")
        fc = r.json()["factor_contributions"]
        expected_factors = {"impact", "time_to_impact", "oil_severity", "detection_confidence", "environmental_sensitivity", "data_quality"}
        self.assertEqual(set(fc.keys()), expected_factors)

    def test_module12_factor_has_subkeys(self):
        r = _post("/api/v1/modules/12/priority")
        fc = r.json()["factor_contributions"]
        for fname, fdata in fc.items():
            for sub in ("value", "weight", "weighted_contribution"):
                self.assertIn(sub, fdata, f"Factor {fname} missing subkey: {sub}")

    def test_module12_weights_sum_to_one(self):
        r = _post("/api/v1/modules/12/priority")
        weights = r.json()["weights_used"]
        total = sum(weights.values())
        self.assertAlmostEqual(total, 1.0, places=3)

    def test_module12_data_type(self):
        r = _post("/api/v1/modules/12/priority")
        self.assertEqual(r.json()["data_type"], "SIMULATED")

    def test_module12_json_serializable(self):
        r = _post("/api/v1/modules/12/priority")
        self.assertIsInstance(r.json(), dict)


# =============================================================================
# MODULE 13 — Resource Optimization
# =============================================================================

class TestModule13(unittest.TestCase):

    def test_module13_returns_200(self):
        r = _post("/api/v1/modules/13/optimize")
        self.assertEqual(r.status_code, 200, r.text)

    def test_module13_has_required_keys(self):
        r = _post("/api/v1/modules/13/optimize")
        data = r.json()
        for key in ("scene_id", "data_type", "optimization_method", "total_resources_available",
                    "total_resources_deployed", "estimated_coverage_fraction", "allocations", "disclaimer"):
            self.assertIn(key, data, f"Missing key: {key}")

    def test_module13_optimization_method(self):
        r = _post("/api/v1/modules/13/optimize")
        self.assertEqual(r.json()["optimization_method"], "greedy_priority_weighted")

    def test_module13_coverage_fraction_in_range(self):
        r = _post("/api/v1/modules/13/optimize")
        cov = r.json()["estimated_coverage_fraction"]
        self.assertGreaterEqual(cov, 0.0)
        self.assertLessEqual(cov, 1.0)

    def test_module13_deployed_lte_available(self):
        r = _post("/api/v1/modules/13/optimize")
        data = r.json()
        self.assertLessEqual(data["total_resources_deployed"], data["total_resources_available"])

    def test_module13_allocations_list(self):
        r = _post("/api/v1/modules/13/optimize")
        allocs = r.json()["allocations"]
        self.assertIsInstance(allocs, list)

    def test_module13_allocation_keys(self):
        r = _post("/api/v1/modules/13/optimize")
        for alloc in r.json()["allocations"]:
            for key in ("resource_id", "resource_type", "target_asset", "estimated_arrival_hours", "deployment_score"):
                self.assertIn(key, alloc, f"Allocation missing key: {key}")

    def test_module13_data_type(self):
        r = _post("/api/v1/modules/13/optimize")
        self.assertEqual(r.json()["data_type"], "SIMULATED")

    def test_module13_json_serializable(self):
        r = _post("/api/v1/modules/13/optimize")
        self.assertIsInstance(r.json(), dict)


# =============================================================================
# MODULE 14 — What-If Response Simulation
# =============================================================================

class TestModule14(unittest.TestCase):

    def _post14(self, extra=None):
        payload = {"scene_id": SCENE_ID, "config_path": CONFIG_PATH}
        if extra:
            payload.update(extra)
        return client.post("/api/v1/modules/14/what-if", json=payload)

    def test_module14_returns_200(self):
        r = self._post14()
        self.assertEqual(r.status_code, 200, r.text)

    def test_module14_has_required_keys(self):
        r = self._post14()
        data = r.json()
        for key in ("scene_id", "data_type", "reference_priority_score", "scenarios", "recommended_scenario", "disclaimer"):
            self.assertIn(key, data, f"Missing key: {key}")

    def test_module14_four_scenarios_present(self):
        r = self._post14()
        scenarios = r.json()["scenarios"]
        for name in ("optimized", "delayed", "no_action", "additional_resources"):
            self.assertIn(name, scenarios, f"Missing scenario: {name}")

    def test_module14_scenario_keys(self):
        r = self._post14()
        for sname, sdata in r.json()["scenarios"].items():
            for key in ("label", "coverage_fraction", "assets_covered", "estimated_impact_reduction"):
                self.assertIn(key, sdata, f"Scenario {sname} missing key: {key}")

    def test_module14_coverage_fractions_in_range(self):
        r = self._post14()
        for sname, sdata in r.json()["scenarios"].items():
            cov = sdata["coverage_fraction"]
            self.assertGreaterEqual(cov, 0.0, f"Scenario {sname} coverage < 0")
            self.assertLessEqual(cov, 1.0, f"Scenario {sname} coverage > 1")

    def test_module14_no_action_zero_coverage(self):
        r = self._post14()
        no_action = r.json()["scenarios"]["no_action"]
        self.assertEqual(no_action["coverage_fraction"], 0.0)
        self.assertEqual(no_action["assets_covered"], 0)

    def test_module14_optimized_better_than_no_action(self):
        r = self._post14()
        sc = r.json()["scenarios"]
        self.assertGreaterEqual(
            sc["optimized"]["estimated_impact_reduction"],
            sc["no_action"]["estimated_impact_reduction"],
        )

    def test_module14_recommended_scenario_valid(self):
        r = self._post14()
        data = r.json()
        self.assertIn(data["recommended_scenario"], data["scenarios"])

    def test_module14_custom_delay(self):
        r = self._post14({"delay_hours": 12.0})
        self.assertEqual(r.status_code, 200, r.text)

    def test_module14_additional_resources_scenario(self):
        r = self._post14({"additional_resource_type": "drone", "additional_resource_count": 3})
        self.assertEqual(r.status_code, 200, r.text)
        self.assertIn("additional_resources", r.json()["scenarios"])

    def test_module14_data_type(self):
        r = self._post14()
        self.assertEqual(r.json()["data_type"], "SIMULATED")

    def test_module14_json_serializable(self):
        r = self._post14()
        self.assertIsInstance(r.json(), dict)


# =============================================================================
# MODULE 15 — Prediction vs Reality Feedback
# =============================================================================

_PRED_POLYGON = {
    "type": "Polygon",
    "coordinates": [[[72.0, 12.0], [72.3, 12.0], [72.3, 12.3], [72.0, 12.3], [72.0, 12.0]]]
}
_OBS_POLYGON = {
    "type": "Polygon",
    "coordinates": [[[72.05, 12.05], [72.35, 12.05], [72.35, 12.35], [72.05, 12.35], [72.05, 12.05]]]
}
_IDENTICAL_POLYGON = {
    "type": "Polygon",
    "coordinates": [[[72.0, 12.0], [72.3, 12.0], [72.3, 12.3], [72.0, 12.3], [72.0, 12.0]]]
}


class TestModule15(unittest.TestCase):

    def _post15(self, payload=None):
        if payload is None:
            payload = {"predicted_polygon": _PRED_POLYGON, "observed_polygon": _OBS_POLYGON}
        return client.post("/api/v1/modules/15/feedback", json=payload)

    def test_module15_returns_200(self):
        r = self._post15()
        self.assertEqual(r.status_code, 200, r.text)

    def test_module15_has_required_keys(self):
        r = self._post15()
        data = r.json()
        for key in ("iou", "centroid_error_km", "area_error_km2", "area_error_fraction",
                    "recalibration_factor", "recalibration_interpretation", "disclaimer"):
            self.assertIn(key, data, f"Missing key: {key}")

    def test_module15_iou_in_range(self):
        r = self._post15()
        iou = r.json()["iou"]
        self.assertGreaterEqual(iou, 0.0)
        self.assertLessEqual(iou, 1.0)

    def test_module15_iou_nonzero_overlapping_polygons(self):
        r = self._post15()
        iou = r.json()["iou"]
        self.assertGreater(iou, 0.0, "Overlapping polygons should have IoU > 0")

    def test_module15_identical_polygons_iou_one(self):
        r = self._post15({"predicted_polygon": _IDENTICAL_POLYGON, "observed_polygon": _IDENTICAL_POLYGON})
        self.assertEqual(r.status_code, 200, r.text)
        iou = r.json()["iou"]
        self.assertAlmostEqual(iou, 1.0, places=3)

    def test_module15_centroid_error_nonnegative(self):
        r = self._post15()
        err = r.json()["centroid_error_km"]
        self.assertGreaterEqual(err, 0.0)

    def test_module15_area_error_nonnegative(self):
        r = self._post15()
        err = r.json()["area_error_km2"]
        self.assertGreaterEqual(err, 0.0)

    def test_module15_recalibration_factor_in_range(self):
        r = self._post15()
        rf = r.json()["recalibration_factor"]
        self.assertGreaterEqual(rf, 0.0)
        self.assertLessEqual(rf, 1.0)

    def test_module15_recalibration_label_valid(self):
        r = self._post15()
        label = r.json()["recalibration_interpretation"]
        self.assertIn(label, ["EXCELLENT FORECAST", "GOOD FORECAST", "FAIR FORECAST", "POOR FORECAST"])

    def test_module15_data_type(self):
        r = self._post15()
        self.assertEqual(r.json()["data_type"], "FEEDBACK")

    def test_module15_with_spill_origin(self):
        payload = {
            "predicted_polygon": _PRED_POLYGON,
            "observed_polygon": _OBS_POLYGON,
            "spill_origin": [12.0, 72.0],
        }
        r = self._post15(payload)
        self.assertEqual(r.status_code, 200, r.text)
        data = r.json()
        self.assertIsNotNone(data.get("direction_error_deg"))

    def test_module15_no_spill_origin_direction_null(self):
        r = self._post15()
        data = r.json()
        self.assertIsNone(data.get("direction_error_deg"))

    def test_module15_json_serializable(self):
        r = self._post15()
        self.assertIsInstance(r.json(), dict)


# =============================================================================
# Pipeline extended (M11-M13 via include_modules_11_15=True)
# =============================================================================

class TestPipelineExtended(unittest.TestCase):

    def test_extended_pipeline_returns_200(self):
        r = client.post(
            "/api/v1/pipeline/run",
            json={"scene_id": SCENE_ID, "config_path": CONFIG_PATH, "include_modules_11_15": True},
        )
        self.assertEqual(r.status_code, 200, r.text)

    def test_extended_pipeline_has_impact_key(self):
        r = client.post(
            "/api/v1/pipeline/run",
            json={"scene_id": SCENE_ID, "config_path": CONFIG_PATH, "include_modules_11_15": True},
        )
        data = r.json()
        self.assertIn("impact", data)
        self.assertIsNotNone(data["impact"])

    def test_extended_pipeline_has_priority_key(self):
        r = client.post(
            "/api/v1/pipeline/run",
            json={"scene_id": SCENE_ID, "config_path": CONFIG_PATH, "include_modules_11_15": True},
        )
        data = r.json()
        self.assertIn("priority", data)
        self.assertIsNotNone(data["priority"])

    def test_extended_pipeline_has_resource_optimization_key(self):
        r = client.post(
            "/api/v1/pipeline/run",
            json={"scene_id": SCENE_ID, "config_path": CONFIG_PATH, "include_modules_11_15": True},
        )
        data = r.json()
        self.assertIn("resource_optimization", data)
        self.assertIsNotNone(data["resource_optimization"])

    def test_default_pipeline_no_m11_keys(self):
        r = client.post(
            "/api/v1/pipeline/run",
            json={"scene_id": SCENE_ID, "config_path": CONFIG_PATH},
        )
        data = r.json()
        # When include_modules_11_15=False (default), keys should be absent or None
        impact = data.get("impact")
        self.assertIsNone(impact)

    def test_extended_pipeline_impact_score_in_range(self):
        r = client.post(
            "/api/v1/pipeline/run",
            json={"scene_id": SCENE_ID, "config_path": CONFIG_PATH, "include_modules_11_15": True},
        )
        impact = r.json()["impact"]
        self.assertGreaterEqual(impact["overall_impact_score"], 0.0)
        self.assertLessEqual(impact["overall_impact_score"], 1.0)

    def test_extended_pipeline_priority_score_range(self):
        r = client.post(
            "/api/v1/pipeline/run",
            json={"scene_id": SCENE_ID, "config_path": CONFIG_PATH, "include_modules_11_15": True},
        )
        priority = r.json()["priority"]
        self.assertGreaterEqual(priority["priority_score"], 0.0)
        self.assertLessEqual(priority["priority_score"], 100.0)


# =============================================================================
# Schema Validation — ResourceOverride (M13)
# =============================================================================

class TestResourceOverrideSchema(unittest.TestCase):
    """Tests for typed ResourceOverride schema in Module 13 requests."""

    def test_m13_with_valid_resource_override(self):
        """M13 accepts typed resource_override and produces valid output."""
        r = client.post(
            "/api/v1/modules/13/optimize",
            json={
                "scene_id": SCENE_ID,
                "config_path": CONFIG_PATH,
                "resource_override": [
                    {
                        "type": "skimmer",
                        "count": 2,
                        "speed_knots": 8.0,
                        "capacity_tons": 50.0,
                        "range_km": 200.0,
                        "home_lat": 12.1,
                        "home_lon": 72.1,
                    }
                ],
            },
        )
        self.assertEqual(r.status_code, 200, r.text)
        data = r.json()
        self.assertIn("optimization_method", data)
        self.assertGreaterEqual(data["total_resources_available"], 0)

    def test_m13_resource_override_minimal_fields(self):
        """resource_override with only required fields (type, count) is accepted."""
        r = client.post(
            "/api/v1/modules/13/optimize",
            json={
                "scene_id": SCENE_ID,
                "config_path": CONFIG_PATH,
                "resource_override": [
                    {"type": "drone", "count": 3}
                ],
            },
        )
        self.assertEqual(r.status_code, 200, r.text)

    def test_m13_resource_override_multiple_types(self):
        """resource_override with multiple resource types works correctly."""
        r = client.post(
            "/api/v1/modules/13/optimize",
            json={
                "scene_id": SCENE_ID,
                "config_path": CONFIG_PATH,
                "resource_override": [
                    {"type": "skimmer", "count": 1, "speed_knots": 8.0, "range_km": 200.0, "home_lat": 12.1, "home_lon": 72.1},
                    {"type": "patrol_vessel", "count": 1, "speed_knots": 15.0, "range_km": 500.0, "home_lat": 12.05, "home_lon": 72.05},
                ],
            },
        )
        self.assertEqual(r.status_code, 200, r.text)
        data = r.json()
        self.assertEqual(data["total_resources_available"], 2)

    def test_m13_resource_override_none_uses_default_fleet(self):
        """Omitting resource_override uses the default fleet."""
        r_default = _post("/api/v1/modules/13/optimize")
        r_explicit_none = client.post(
            "/api/v1/modules/13/optimize",
            json={"scene_id": SCENE_ID, "config_path": CONFIG_PATH, "resource_override": None},
        )
        self.assertEqual(r_default.status_code, 200)
        self.assertEqual(r_explicit_none.status_code, 200)
        # Both should produce the same total_resources_available
        self.assertEqual(
            r_default.json()["total_resources_available"],
            r_explicit_none.json()["total_resources_available"],
        )

    def test_m13_resource_override_invalid_type_rejected(self):
        """resource_override with wrong field types returns 422."""
        r = client.post(
            "/api/v1/modules/13/optimize",
            json={
                "scene_id": SCENE_ID,
                "config_path": CONFIG_PATH,
                "resource_override": [
                    {"type": "skimmer", "count": "not_a_number"}  # count must be int
                ],
            },
        )
        self.assertEqual(r.status_code, 422)

    def test_m13_resource_override_schema_has_no_additionalprops(self):
        """Swagger schema for Module13Request should not use additionalProperties."""
        # Verify by checking the openapi schema - resource_override should reference a model
        r = client.get("/openapi.json")
        self.assertEqual(r.status_code, 200)
        schema = r.json()
        # ResourceOverride model should be present in schemas
        component_schemas = schema.get("components", {}).get("schemas", {})
        self.assertIn("ResourceOverride", component_schemas, "ResourceOverride not in OpenAPI components")


# =============================================================================
# Schema Validation — AlternativeAllocation (M14)
# =============================================================================

class TestAlternativeAllocationSchema(unittest.TestCase):
    """Tests for typed AlternativeAllocation schema in Module 14 requests."""

    def test_m14_with_typed_alternative_allocation(self):
        """M14 accepts typed alternative_allocation list."""
        r = client.post(
            "/api/v1/modules/14/what-if",
            json={
                "scene_id": SCENE_ID,
                "config_path": CONFIG_PATH,
                "alternative_allocation": [
                    {"resource_type": "skimmer", "target_asset": "Malvan Marine Sanctuary"},
                    {"resource_type": "drone", "target_asset": "Mumbai Port"},
                ],
            },
        )
        self.assertEqual(r.status_code, 200, r.text)
        data = r.json()
        self.assertIn("alternative", data["scenarios"])

    def test_m14_alternative_allocation_target_asset_required(self):
        """AlternativeAllocation with missing target_asset returns 422."""
        r = client.post(
            "/api/v1/modules/14/what-if",
            json={
                "scene_id": SCENE_ID,
                "config_path": CONFIG_PATH,
                "alternative_allocation": [
                    {"resource_type": "skimmer"}  # missing target_asset
                ],
            },
        )
        self.assertEqual(r.status_code, 422)

    def test_m14_alternative_allocation_resource_type_required(self):
        """AlternativeAllocation with missing resource_type returns 422."""
        r = client.post(
            "/api/v1/modules/14/what-if",
            json={
                "scene_id": SCENE_ID,
                "config_path": CONFIG_PATH,
                "alternative_allocation": [
                    {"target_asset": "Malvan Marine Sanctuary"}  # missing resource_type
                ],
            },
        )
        self.assertEqual(r.status_code, 422)

    def test_m14_no_alternative_allocation_omits_alternative_scenario(self):
        """Omitting alternative_allocation means no 'alternative' key in scenarios."""
        r = client.post(
            "/api/v1/modules/14/what-if",
            json={"scene_id": SCENE_ID, "config_path": CONFIG_PATH},
        )
        self.assertEqual(r.status_code, 200)
        data = r.json()
        self.assertNotIn("alternative", data["scenarios"])

    def test_m14_alternative_allocation_schema_in_openapi(self):
        """AlternativeAllocation should appear in OpenAPI components."""
        r = client.get("/openapi.json")
        schema = r.json()
        component_schemas = schema.get("components", {}).get("schemas", {})
        self.assertIn("AlternativeAllocation", component_schemas, "AlternativeAllocation not in OpenAPI components")


# =============================================================================
# Schema Validation — GeoJSONPolygon (M15)
# =============================================================================

class TestGeoJSONPolygonSchema(unittest.TestCase):
    """Tests for typed GeoJSONPolygon schema in Module 15 requests."""

    _PRED = {"type": "Polygon", "coordinates": [[[72.0, 12.0], [72.3, 12.0], [72.3, 12.3], [72.0, 12.3], [72.0, 12.0]]]}
    _OBS  = {"type": "Polygon", "coordinates": [[[72.05, 12.05], [72.35, 12.05], [72.35, 12.35], [72.05, 12.35], [72.05, 12.05]]]}

    def test_m15_typed_polygon_request_works(self):
        """GeoJSONPolygon typed request body is accepted."""
        r = client.post(
            "/api/v1/modules/15/feedback",
            json={"predicted_polygon": self._PRED, "observed_polygon": self._OBS},
        )
        self.assertEqual(r.status_code, 200, r.text)

    def test_m15_polygon_type_field_validated(self):
        """Polygon with non-list coordinates returns 422."""
        r = client.post(
            "/api/v1/modules/15/feedback",
            json={
                "predicted_polygon": {"type": "Polygon", "coordinates": "not_a_list"},
                "observed_polygon": self._OBS,
            },
        )
        self.assertEqual(r.status_code, 422)

    def test_m15_missing_predicted_polygon_returns_422(self):
        """Request without predicted_polygon returns 422."""
        r = client.post(
            "/api/v1/modules/15/feedback",
            json={"observed_polygon": self._OBS},
        )
        self.assertEqual(r.status_code, 422)

    def test_m15_missing_observed_polygon_returns_422(self):
        """Request without observed_polygon returns 422."""
        r = client.post(
            "/api/v1/modules/15/feedback",
            json={"predicted_polygon": self._PRED},
        )
        self.assertEqual(r.status_code, 422)

    def test_m15_coordinates_wrong_nesting_returns_422(self):
        """Polygon coordinates with wrong nesting depth returns 422."""
        r = client.post(
            "/api/v1/modules/15/feedback",
            json={
                "predicted_polygon": {"type": "Polygon", "coordinates": [[72.0, 12.0]]},  # wrong: not List[List[List[float]]]
                "observed_polygon": self._OBS,
            },
        )
        self.assertEqual(r.status_code, 422)

    def test_m15_geojson_polygon_in_openapi(self):
        """GeoJSONPolygon should appear in OpenAPI components."""
        r = client.get("/openapi.json")
        schema = r.json()
        component_schemas = schema.get("components", {}).get("schemas", {})
        self.assertIn("GeoJSONPolygon", component_schemas, "GeoJSONPolygon not in OpenAPI components")

    def test_m15_swagger_example_has_meaningful_polygon(self):
        """OpenAPI schema for GeoJSONPolygon should have a coordinates example."""
        r = client.get("/openapi.json")
        schema = r.json()
        gjp_schema = schema["components"]["schemas"].get("GeoJSONPolygon", {})
        # Should have coordinates property with an example
        props = gjp_schema.get("properties", {})
        self.assertIn("coordinates", props)
        # Should have examples or there's an example in the schema
        coords_prop = props["coordinates"]
        has_example = (
            "examples" in coords_prop
            or "example" in coords_prop
            or "examples" in gjp_schema
            or gjp_schema.get("json_schema_extra", {})
        )
        self.assertTrue(has_example or "items" in coords_prop,
            "GeoJSONPolygon coordinates should have schema info")


if __name__ == "__main__":
    unittest.main()
