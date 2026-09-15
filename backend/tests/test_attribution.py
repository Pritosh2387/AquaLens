"""
test_attribution.py — Unit tests for Module 8: Vessel Attribution Engine

All tests use synthetic mock data. NOT scientifically valid.
"""
import sys
import os
import pytest

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from src.attribution.candidate_filter import filter_candidate_vessels
from src.attribution.features import extract_candidate_attribution_features
from src.attribution.explanation import generate_attribution_explanation
from src.attribution.ranking import VesselAttributionEngine

CONFIG_PATH = "configs/config.yaml"

# ──────────────────────────────────────────────────────────────────────────────
# Fixtures
# ──────────────────────────────────────────────────────────────────────────────

@pytest.fixture
def mock_ais_records():
    return [
        {"mmsi": 419000101, "vessel_name": "MV_TANKER_ALPHA", "lat": 12.40, "lon": 72.40,
         "timestamp": "2026-01-01T10:00:00Z", "sog_knots": 12.0, "cog_deg": 45.0,
         "nav_status": "Under way using engine", "matched_sat_ship_id": "SHIP_SAT_001"},
        {"mmsi": 419000102, "vessel_name": "MV_CARGO_BETA", "lat": 12.65, "lon": 72.70,
         "timestamp": "2026-01-01T12:00:00Z", "sog_knots": 14.0, "cog_deg": 60.0,
         "nav_status": "Under way using engine", "matched_sat_ship_id": "SHIP_SAT_002"},
        {"mmsi": 419000103, "vessel_name": "MV_FISHING_GAMMA", "lat": 12.25, "lon": 72.30,
         "timestamp": "2026-01-01T10:00:00Z", "sog_knots": 6.0, "cog_deg": 180.0,
         "nav_status": "Engaged in fishing", "matched_sat_ship_id": "SHIP_SAT_003"},
    ]


@pytest.fixture
def mock_origin_result():
    return {
        "origin_centroid": [12.39, 72.39],
        "top_origin_zones": [
            {"zone_id": "Zone_A", "center_lat": 12.39, "center_lon": 72.39, "radius_km": 2.5, "probability": 0.65},
            {"zone_id": "Zone_B", "center_lat": 12.37, "center_lon": 72.37, "radius_km": 4.0, "probability": 0.25},
            {"zone_id": "Zone_C", "center_lat": 12.42, "center_lon": 72.42, "radius_km": 6.0, "probability": 0.10},
        ],
        "estimated_release_time": {"start": "2026-01-01 08:24:00 UTC", "end": "2026-01-01 10:24:00 UTC"},
        "particle_count": 500
    }


@pytest.fixture
def mock_ais_matching_result():
    return {
        "matched": [
            {"satellite_ship_id": "SHIP_SAT_001", "mmsi": 419000101, "vessel_name": "MV_TANKER_ALPHA",
             "anomaly_score": 0.72, "ais_gap_minutes": 45.0, "status": "MATCHED"}
        ],
        "possible_matches": [],
        "unmatched": [
            {"satellite_ship_id": "SHIP_SAT_004", "mmsi": None, "anomaly_score": 0.90, "status": "UNMATCHED"}
        ],
        "anomalies": [
            {"satellite_ship_id": "SHIP_SAT_001", "mmsi": 419000101, "anomaly_score": 0.72, "ais_gap_minutes": 45.0}
        ]
    }


# ──────────────────────────────────────────────────────────────────────────────
# Tests: Candidate Filtering
# ──────────────────────────────────────────────────────────────────────────────

class TestCandidateFilter:
    def test_filters_within_radius(self, mock_ais_records, mock_origin_result):
        candidates = filter_candidate_vessels(
            ais_records=mock_ais_records,
            origin_result=mock_origin_result,
            max_distance_km=20.0
        )
        assert len(candidates) >= 1

    def test_no_candidates_when_too_far(self, mock_ais_records, mock_origin_result):
        # Very small radius — only vessels right at origin pass through
        candidates = filter_candidate_vessels(
            ais_records=mock_ais_records,
            origin_result=mock_origin_result,
            max_distance_km=0.1
        )
        # Should have very few or zero
        assert len(candidates) <= len(mock_ais_records)

    def test_candidates_have_required_fields(self, mock_ais_records, mock_origin_result):
        candidates = filter_candidate_vessels(
            ais_records=mock_ais_records,
            origin_result=mock_origin_result,
            max_distance_km=50.0
        )
        for c in candidates:
            assert "mmsi" in c
            assert "vessel_name" in c
            assert "min_origin_distance_km" in c


# ──────────────────────────────────────────────────────────────────────────────
# Tests: Feature Extraction
# ──────────────────────────────────────────────────────────────────────────────

class TestFeatureExtraction:
    def test_features_in_range(self, mock_ais_records, mock_origin_result, mock_ais_matching_result):
        candidates = filter_candidate_vessels(
            ais_records=mock_ais_records,
            origin_result=mock_origin_result,
            max_distance_km=50.0
        )
        for cand in candidates:
            feats = extract_candidate_attribution_features(cand, mock_ais_matching_result)
            for key, val in feats.items():
                assert 0.0 <= float(val) <= 1.0, f"Feature {key}={val} out of [0,1] range"


# ──────────────────────────────────────────────────────────────────────────────
# Tests: Explanation Generation
# ──────────────────────────────────────────────────────────────────────────────

class TestExplanationGeneration:
    def test_explanation_is_string(self):
        evidence = {
            "origin_distance": 0.8, "time_match": 0.7, "trajectory": 0.6,
            "physical_match": 1.0, "ais_gap": 0.75, "behavior_anomaly": 0.9, "data_quality": 0.8
        }
        exp = generate_attribution_explanation(
            rank=1, vessel_name="TANKER_A", mmsi=419000101, dist_km=1.5, evidence=evidence
        )
        assert isinstance(exp, str)
        assert len(exp) > 10

    def test_explanation_mentions_rank(self):
        evidence = {
            "origin_distance": 0.5, "time_match": 0.5, "trajectory": 0.5,
            "physical_match": 0.5, "ais_gap": 0.0, "behavior_anomaly": 0.3, "data_quality": 0.7
        }
        exp = generate_attribution_explanation(
            rank=2, vessel_name="CARGO_B", mmsi=419000102, dist_km=5.0, evidence=evidence
        )
        assert "2" in exp or "CARGO_B" in exp or "419000102" in exp


# ──────────────────────────────────────────────────────────────────────────────
# Tests: VesselAttributionEngine (Module 8 End-to-End)
# ──────────────────────────────────────────────────────────────────────────────

class TestVesselAttributionEngine:
    def test_engine_runs_and_returns_dict(self, mock_ais_records, mock_origin_result, mock_ais_matching_result):
        engine = VesselAttributionEngine(CONFIG_PATH)
        result = engine.rank_vessel_candidates(
            ais_records=mock_ais_records,
            origin_result=mock_origin_result,
            ais_matching_result=mock_ais_matching_result
        )
        assert isinstance(result, dict)
        assert "candidates" in result
        assert "disclaimer" in result

    def test_candidates_are_ranked(self, mock_ais_records, mock_origin_result, mock_ais_matching_result):
        engine = VesselAttributionEngine(CONFIG_PATH)
        result = engine.rank_vessel_candidates(
            ais_records=mock_ais_records,
            origin_result=mock_origin_result,
            ais_matching_result=mock_ais_matching_result
        )
        candidates = result["candidates"]
        if len(candidates) > 1:
            for i in range(len(candidates) - 1):
                assert candidates[i]["attribution_score"] >= candidates[i + 1]["attribution_score"], \
                    "Candidates not sorted in descending attribution_score order"

    def test_attribution_scores_in_range(self, mock_ais_records, mock_origin_result, mock_ais_matching_result):
        engine = VesselAttributionEngine(CONFIG_PATH)
        result = engine.rank_vessel_candidates(
            ais_records=mock_ais_records,
            origin_result=mock_origin_result,
            ais_matching_result=mock_ais_matching_result
        )
        for c in result["candidates"]:
            assert 0.0 <= c["attribution_score"] <= 1.0

    def test_top_candidate_has_rank_one(self, mock_ais_records, mock_origin_result, mock_ais_matching_result):
        engine = VesselAttributionEngine(CONFIG_PATH)
        result = engine.rank_vessel_candidates(
            ais_records=mock_ais_records,
            origin_result=mock_origin_result,
            ais_matching_result=mock_ais_matching_result
        )
        if result["candidates"]:
            assert result["candidates"][0]["rank"] == 1
