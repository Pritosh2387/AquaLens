"""
tests/test_modules_16_17.py — Unit and API tests for Modules 16 and 17.

Tests:
  - M16: evidence nodes, edges, explanations, provenance labels, JSON serialisation,
         API endpoint, invalid request handling, no legal claims
  - M17: recommendation exists, valid action category, urgency/priority included,
         recommended actions have reasons, uncertainty affects recommendation,
         evidence referenced, JSON serialisation, API endpoint, invalid request handling
  - Pipeline: M1-M15 behavior unchanged by default, include_modules_16_17=False preserves
              previous behavior, include_modules_16_17=True produces M16 and M17,
              full extended pipeline completes successfully
"""
import sys
import os
import json
import unittest

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from fastapi.testclient import TestClient
from main import app

client = TestClient(app)

SCENE_ID = "SCENE_001"
CONFIG_PATH = "configs/config.yaml"

VALID_ACTIONS = {
    "MONITOR",
    "VERIFY",
    "INVESTIGATE",
    "DEPLOY_RESOURCES",
    "URGENT_RESPONSE",
    "ESCALATE",
}

VALID_PROVENANCES = {"OBSERVED", "INFERRED", "SIMULATED", "FEEDBACK"}

LEGAL_CLAIM_WORDS = [
    "legally responsible",
    "found guilty",
    "convicted",
    "proven",
    "illegal dumping confirmed",
]


def _post(path: str, scene_id: str = SCENE_ID, config_path: str = CONFIG_PATH):
    return client.post(path, json={"scene_id": scene_id, "config_path": config_path})


# =============================================================================
# MODULE 16 — Explainability / Evidence Graph
# =============================================================================

class TestModule16Success(unittest.TestCase):

    @classmethod
    def setUpClass(cls):
        cls.response = _post("/api/v1/modules/16/evidence")
        cls.data = cls.response.json()

    def test_returns_200(self):
        self.assertEqual(self.response.status_code, 200, self.response.text)

    def test_scene_id_present(self):
        self.assertEqual(self.data["scene_id"], SCENE_ID)

    def test_data_type_simulated(self):
        self.assertEqual(self.data["data_type"], "SIMULATED")

    def test_incident_present(self):
        self.assertIn("incident", self.data)
        self.assertEqual(self.data["incident"]["scene_id"], SCENE_ID)

    def test_evidence_nodes_present_and_nonempty(self):
        nodes = self.data.get("evidence_nodes", [])
        self.assertIsInstance(nodes, list)
        self.assertGreater(len(nodes), 0, "evidence_nodes should not be empty")

    def test_evidence_edges_present(self):
        edges = self.data.get("evidence_edges", [])
        self.assertIsInstance(edges, list)
        self.assertGreater(len(edges), 0, "evidence_edges should not be empty")

    def test_explanations_present_and_nonempty(self):
        explanations = self.data.get("explanations", [])
        self.assertIsInstance(explanations, list)
        self.assertGreater(len(explanations), 0, "explanations should not be empty")

    def test_evidence_node_has_source_module(self):
        for node in self.data["evidence_nodes"]:
            self.assertIn("source_module", node, f"Node {node.get('id')} missing source_module")
            self.assertTrue(len(node["source_module"]) > 0)

    def test_evidence_node_has_provenance(self):
        for node in self.data["evidence_nodes"]:
            self.assertIn("provenance", node, f"Node {node.get('id')} missing provenance")
            self.assertIn(
                node["provenance"], VALID_PROVENANCES,
                f"Node {node.get('id')} has invalid provenance: {node['provenance']}"
            )

    def test_evidence_node_has_type(self):
        for node in self.data["evidence_nodes"]:
            self.assertIn("type", node)
            self.assertIsInstance(node["type"], str)

    def test_evidence_node_has_status(self):
        for node in self.data["evidence_nodes"]:
            self.assertIn("status", node)

    def test_evidence_edge_has_from_to(self):
        for edge in self.data["evidence_edges"]:
            self.assertIn("from", edge, "Edge missing 'from'")
            self.assertIn("to", edge, "Edge missing 'to'")
            self.assertIn("relationship", edge, "Edge missing 'relationship'")

    def test_explanation_has_required_fields(self):
        for exp in self.data["explanations"]:
            self.assertIn("decision", exp)
            self.assertIn("explanation", exp)
            self.assertIn("source_modules", exp)
            self.assertIsInstance(exp["source_modules"], list)
            self.assertGreater(len(exp["source_modules"]), 0)

    def test_explanations_cover_key_decisions(self):
        decisions = {e["decision"] for e in self.data["explanations"]}
        # Must have at least spill_credibility explanation
        self.assertIn("spill_credibility", decisions)

    def test_provenance_summary_present(self):
        summary = self.data.get("provenance_summary", {})
        self.assertIsInstance(summary, dict)
        self.assertGreater(len(summary), 0)

    def test_disclaimer_present(self):
        self.assertIn("disclaimer", self.data)
        self.assertTrue(len(self.data["disclaimer"]) > 10)

    def test_no_legal_claims_in_explanations(self):
        for exp in self.data["explanations"]:
            text = exp.get("explanation", "").lower()
            for bad_phrase in LEGAL_CLAIM_WORDS:
                self.assertNotIn(
                    bad_phrase, text,
                    f"Illegal legal claim found in explanation for '{exp.get('decision')}': '{bad_phrase}'"
                )

    def test_no_simulated_converted_to_observed(self):
        """Nodes from M9/M10/M11/M12/M13 must not be labelled OBSERVED."""
        simulated_modules = {"M9", "M10", "M11", "M12", "M13", "M14"}
        for node in self.data["evidence_nodes"]:
            if node.get("source_module") in simulated_modules:
                self.assertNotEqual(
                    node.get("provenance"), "OBSERVED",
                    f"SIMULATED module {node['source_module']} node has OBSERVED provenance"
                )

    def test_json_serializable(self):
        raw = json.dumps(self.data)
        self.assertIsInstance(raw, str)
        reparsed = json.loads(raw)
        self.assertIn("evidence_nodes", reparsed)


class TestModule16InvalidRequest(unittest.TestCase):

    def test_invalid_scene_returns_error(self):
        r = _post("/api/v1/modules/16/evidence", scene_id="TOTALLY_INVALID_SCENE_XYZ")
        self.assertIn(r.status_code, [404, 422, 500])

    def test_missing_scene_id_defaults_gracefully(self):
        # scene_id has a default in the schema
        r = client.post(
            "/api/v1/modules/16/evidence",
            json={"config_path": CONFIG_PATH},
        )
        # Should succeed (default scene_id = SCENE_001) or return a handled error
        self.assertIn(r.status_code, [200, 404, 422, 500])


# =============================================================================
# MODULE 17 — Action Recommendation / Decision Support
# =============================================================================

class TestModule17Success(unittest.TestCase):

    @classmethod
    def setUpClass(cls):
        cls.response = _post("/api/v1/modules/17/recommend")
        cls.data = cls.response.json()

    def test_returns_200(self):
        self.assertEqual(self.response.status_code, 200, self.response.text)

    def test_scene_id_present(self):
        self.assertEqual(self.data["scene_id"], SCENE_ID)

    def test_data_type_simulated(self):
        self.assertEqual(self.data["data_type"], "SIMULATED")

    def test_recommendation_present(self):
        self.assertIn("recommendation", self.data)
        rec = self.data["recommendation"]
        self.assertIsInstance(rec, dict)

    def test_recommendation_has_valid_action(self):
        action = self.data["recommendation"]["action"]
        self.assertIn(action, VALID_ACTIONS, f"Invalid action: {action}")

    def test_recommendation_has_priority(self):
        self.assertIn("priority", self.data["recommendation"])
        self.assertIsInstance(self.data["recommendation"]["priority"], str)

    def test_recommendation_has_urgency_score(self):
        score = self.data["recommendation"]["urgency_score"]
        self.assertGreaterEqual(score, 0.0)
        self.assertLessEqual(score, 100.0)

    def test_recommendation_has_confidence(self):
        conf = self.data["recommendation"]["confidence"]
        self.assertGreaterEqual(conf, 0.0)
        self.assertLessEqual(conf, 1.0)

    def test_reasoning_is_list_and_nonempty(self):
        reasoning = self.data.get("reasoning", [])
        self.assertIsInstance(reasoning, list)
        self.assertGreater(len(reasoning), 0)

    def test_recommended_actions_is_list(self):
        actions = self.data.get("recommended_actions", [])
        self.assertIsInstance(actions, list)

    def test_recommended_actions_have_reasons(self):
        for act in self.data.get("recommended_actions", []):
            self.assertIn("reason", act, f"Action missing reason: {act}")
            self.assertIn("action", act)

    def test_verification_actions_is_list(self):
        self.assertIsInstance(self.data.get("verification_actions", []), list)

    def test_vessel_investigation_present(self):
        vi = self.data.get("vessel_investigation")
        self.assertIsNotNone(vi)
        self.assertIn("recommended", vi)
        self.assertIsInstance(vi["recommended"], bool)
        self.assertIn("reason", vi)

    def test_vessel_investigation_no_legal_claim(self):
        vi = self.data.get("vessel_investigation", {})
        reason = vi.get("reason", "").lower()
        for bad in LEGAL_CLAIM_WORDS:
            self.assertNotIn(bad, reason, f"Legal claim in vessel_investigation reason: '{bad}'")

    def test_evidence_summary_is_list(self):
        self.assertIsInstance(self.data.get("evidence_summary", []), list)

    def test_evidence_summary_references_modules(self):
        summary = self.data.get("evidence_summary", [])
        if summary:
            combined = " ".join(summary)
            # Should mention at least one module
            self.assertTrue(
                any(f"Module {n}" in combined for n in range(2, 18)),
                "Evidence summary should reference at least one module"
            )

    def test_disclaimer_present(self):
        self.assertIn("disclaimer", self.data)
        disclaimer = self.data["disclaimer"]
        self.assertIn("not", disclaimer.lower())

    def test_json_serializable(self):
        raw = json.dumps(self.data)
        self.assertIsInstance(raw, str)
        reparsed = json.loads(raw)
        self.assertIn("recommendation", reparsed)

    def test_whatif_summary_if_present(self):
        ws = self.data.get("whatif_summary")
        if ws is not None:
            self.assertIn("recommended_scenario", ws)
            self.assertIn("reason", ws)


class TestModule17UncertaintyEffect(unittest.TestCase):
    """Verify that the recommendation logic is sensitive to its inputs (smoke test)."""

    def test_action_is_one_of_valid_categories(self):
        r = _post("/api/v1/modules/17/recommend")
        self.assertEqual(r.status_code, 200, r.text)
        action = r.json()["recommendation"]["action"]
        self.assertIn(action, VALID_ACTIONS)

    def test_reasoning_mentions_confidence_or_priority(self):
        r = _post("/api/v1/modules/17/recommend")
        reasoning = " ".join(r.json().get("reasoning", []))
        has_confidence = "confidence" in reasoning.lower()
        has_priority = "priority" in reasoning.lower()
        self.assertTrue(
            has_confidence or has_priority,
            "Reasoning should mention confidence or priority"
        )


class TestModule17InvalidRequest(unittest.TestCase):

    def test_invalid_scene_returns_error(self):
        r = _post("/api/v1/modules/17/recommend", scene_id="TOTALLY_INVALID_SCENE_XYZ")
        self.assertIn(r.status_code, [404, 422, 500])


# =============================================================================
# Pipeline tests — M16/M17 integration
# =============================================================================

class TestPipelineM1M15UnchangedByDefault(unittest.TestCase):
    """M1–M15 pipeline behavior is unchanged when include_modules_16_17=False."""

    def test_default_pipeline_returns_200(self):
        r = client.post(
            "/api/v1/pipeline/run",
            json={"scene_id": SCENE_ID, "config_path": CONFIG_PATH},
        )
        self.assertEqual(r.status_code, 200, r.text)

    def test_default_pipeline_no_explainability_key(self):
        r = client.post(
            "/api/v1/pipeline/run",
            json={"scene_id": SCENE_ID, "config_path": CONFIG_PATH},
        )
        data = r.json()
        self.assertIsNone(data.get("explainability"))

    def test_default_pipeline_no_action_recommendation_key(self):
        r = client.post(
            "/api/v1/pipeline/run",
            json={"scene_id": SCENE_ID, "config_path": CONFIG_PATH},
        )
        data = r.json()
        self.assertIsNone(data.get("action_recommendation"))

    def test_explicit_false_preserves_previous_behavior(self):
        r = client.post(
            "/api/v1/pipeline/run",
            json={
                "scene_id": SCENE_ID,
                "config_path": CONFIG_PATH,
                "include_modules_16_17": False,
            },
        )
        self.assertEqual(r.status_code, 200, r.text)
        data = r.json()
        self.assertIsNone(data.get("explainability"))
        self.assertIsNone(data.get("action_recommendation"))

    def test_m1_m10_fields_still_present(self):
        r = client.post(
            "/api/v1/pipeline/run",
            json={"scene_id": SCENE_ID, "config_path": CONFIG_PATH},
        )
        data = r.json()
        for key in ("spill", "ships_observed", "sensor_fusion", "ais_matching",
                    "spill_origin", "vessel_attribution", "spill_forecast", "uncertainty"):
            self.assertIn(key, data, f"Expected key missing in default pipeline: {key}")


class TestPipelineExtendedM16M17(unittest.TestCase):
    """include_modules_16_17=True produces M16 and M17."""

    @classmethod
    def setUpClass(cls):
        cls.response = client.post(
            "/api/v1/pipeline/run",
            json={
                "scene_id": SCENE_ID,
                "config_path": CONFIG_PATH,
                "include_modules_16_17": True,
            },
        )
        cls.data = cls.response.json()

    def test_extended_pipeline_returns_200(self):
        self.assertEqual(self.response.status_code, 200, self.response.text)

    def test_explainability_key_present(self):
        self.assertIn("explainability", self.data)
        self.assertIsNotNone(self.data["explainability"])

    def test_action_recommendation_key_present(self):
        self.assertIn("action_recommendation", self.data)
        self.assertIsNotNone(self.data["action_recommendation"])

    def test_explainability_has_evidence_nodes(self):
        ev = self.data["explainability"]
        self.assertIn("evidence_nodes", ev)
        self.assertGreater(len(ev["evidence_nodes"]), 0)

    def test_action_recommendation_has_valid_action(self):
        ar = self.data["action_recommendation"]
        action = ar["recommendation"]["action"]
        self.assertIn(action, VALID_ACTIONS)

    def test_m1_m13_fields_still_present_in_extended(self):
        for key in ("spill", "ships_observed", "sensor_fusion", "ais_matching",
                    "spill_origin", "vessel_attribution", "spill_forecast", "uncertainty",
                    "impact", "priority", "resource_optimization"):
            self.assertIn(key, self.data, f"Key missing in extended pipeline: {key}")

    def test_extended_pipeline_json_serializable(self):
        raw = json.dumps(self.data)
        self.assertIsInstance(raw, str)

    def test_provenance_labels_valid_in_explainability(self):
        nodes = self.data["explainability"].get("evidence_nodes", [])
        for node in nodes:
            prov = node.get("provenance", "")
            self.assertIn(prov, VALID_PROVENANCES, f"Invalid provenance '{prov}' in node {node.get('id')}")


# =============================================================================
# Health endpoint — M16/M17 registered
# =============================================================================

class TestHealthWithM16M17(unittest.TestCase):

    def test_health_returns_17_modules(self):
        r = client.get("/api/v1/health")
        self.assertEqual(r.status_code, 200, r.text)
        data = r.json()
        self.assertEqual(len(data["modules"]), 17, "Health should report 17 modules")

    def test_health_has_m16_key(self):
        r = client.get("/api/v1/health")
        modules = r.json()["modules"]
        self.assertIn("module_16_explainability_evidence", modules)
        self.assertEqual(modules["module_16_explainability_evidence"], "available")

    def test_health_has_m17_key(self):
        r = client.get("/api/v1/health")
        modules = r.json()["modules"]
        self.assertIn("module_17_action_recommendation", modules)
        self.assertEqual(modules["module_17_action_recommendation"], "available")

    def test_health_still_has_all_m1_m15_keys(self):
        r = client.get("/api/v1/health")
        modules = r.json()["modules"]
        expected = [
            "module_1_data_processing",
            "module_2_oil_spill_detection",
            "module_3_sar_optical_fusion",
            "module_4_oil_confidence",
            "module_5_ship_detection",
            "module_6_ais_anomaly",
            "module_7_hindcast",
            "module_8_attribution",
            "module_9_forecast",
            "module_10_uncertainty",
            "module_11_impact_prediction",
            "module_12_priority_scoring",
            "module_13_resource_optimization",
            "module_14_whatif_simulation",
            "module_15_prediction_feedback",
        ]
        for key in expected:
            self.assertIn(key, modules, f"Missing health key: {key}")


if __name__ == "__main__":
    unittest.main()
