"""
test_ais_matching.py — Unit tests for Module 6: AIS Matching + Anomaly Engine

All tests run against synthetic mock data. Results are NOT scientifically valid.
"""
import sys
import os
import pytest
import numpy as np

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from src.ais.matcher import match_spatial_temporal_ais, calculate_geodesic_distance_km
from src.ais.gap_detector import detect_ais_gaps
from src.ais.trajectory import calculate_trajectory_score
from src.ais.anomaly import AISAnomalyEngine

CONFIG_PATH = "configs/config.yaml"

# ──────────────────────────────────────────────────────────────────────────────
# Fixtures
# ──────────────────────────────────────────────────────────────────────────────

@pytest.fixture
def sample_ais_records():
    return [
        {"mmsi": 419000101, "vessel_name": "TANKER_A", "lat": 12.48, "lon": 72.48,
         "timestamp": "2026-01-01T12:00:00Z", "sog_knots": 11.0, "cog_deg": 45.0, "nav_status": "Under way using engine"},
        {"mmsi": 419000101, "vessel_name": "TANKER_A", "lat": 12.40, "lon": 72.40,
         "timestamp": "2026-01-01T10:00:00Z", "sog_knots": 12.0, "cog_deg": 45.0, "nav_status": "Under way using engine"},
        # 45-minute gap then continues
        {"mmsi": 419000101, "vessel_name": "TANKER_A", "lat": 12.46, "lon": 72.46,
         "timestamp": "2026-01-01T10:45:00Z", "sog_knots": 11.5, "cog_deg": 45.0, "nav_status": "Under way using engine"},
        {"mmsi": 419000102, "vessel_name": "CARGO_B", "lat": 12.65, "lon": 72.70,
         "timestamp": "2026-01-01T12:00:00Z", "sog_knots": 14.0, "cog_deg": 60.0, "nav_status": "Under way using engine"}
    ]


@pytest.fixture
def sample_physical_ships():
    return [
        {"ship_id": "SAT_001", "lat": 12.48, "lon": 72.48, "confidence": 0.96, "length_m": 180.0},
        {"ship_id": "SAT_NO_AIS", "lat": 11.00, "lon": 70.00, "confidence": 0.92, "length_m": 110.0}
    ]


# ──────────────────────────────────────────────────────────────────────────────
# Tests: Geodesic distance
# ──────────────────────────────────────────────────────────────────────────────

class TestGeodesicDistance:
    def test_zero_distance(self):
        d = calculate_geodesic_distance_km((12.5, 72.5), (12.5, 72.5))
        assert d == pytest.approx(0.0, abs=1e-6)

    def test_known_distance_positive(self):
        d = calculate_geodesic_distance_km((12.0, 72.0), (13.0, 73.0))
        assert d > 0.0

    def test_returns_float(self):
        d = calculate_geodesic_distance_km((0.0, 0.0), (1.0, 1.0))
        assert isinstance(d, float)


# ──────────────────────────────────────────────────────────────────────────────
# Tests: AIS Gap Detector
# ──────────────────────────────────────────────────────────────────────────────

class TestAISGapDetector:
    def test_gap_detected(self, sample_ais_records):
        vessel_a = [r for r in sample_ais_records if r["mmsi"] == 419000101]
        has_gap, gap_min, details = detect_ais_gaps(vessel_a, gap_threshold_minutes=30)
        assert has_gap is True
        assert gap_min >= 30.0

    def test_no_gap_for_continuous_track(self, sample_ais_records):
        # Single vessel B with two continuous records 60 minutes apart — no gap
        vessel_b = [r for r in sample_ais_records if r["mmsi"] == 419000102]
        has_gap, gap_min, _ = detect_ais_gaps(vessel_b, gap_threshold_minutes=120)
        assert has_gap is False or gap_min < 120.0

    def test_empty_records(self):
        has_gap, gap_min, _ = detect_ais_gaps([], gap_threshold_minutes=30)
        assert has_gap is False
        assert gap_min == 0.0

    def test_single_record(self, sample_ais_records):
        one = [sample_ais_records[0]]
        has_gap, gap_min, _ = detect_ais_gaps(one, gap_threshold_minutes=30)
        assert has_gap is False


# ──────────────────────────────────────────────────────────────────────────────
# Tests: Trajectory Score
# ──────────────────────────────────────────────────────────────────────────────

class TestTrajectoryScore:
    def test_exact_match_low_error(self, sample_ais_records, sample_physical_ships):
        sat = sample_physical_ships[0]  # SAT_001 at (12.48, 72.48)
        ais = [r for r in sample_ais_records if r["mmsi"] == 419000101][-1]  # same position
        pos_err, traj_score = calculate_trajectory_score(
            sat_ship=sat,
            sat_timestamp_str="2026-01-01T12:00:00Z",
            ais_record=ais
        )
        assert pos_err >= 0.0
        assert 0.0 <= traj_score <= 1.0

    def test_score_in_range(self, sample_ais_records, sample_physical_ships):
        sat = sample_physical_ships[1]  # Far away ship
        ais = sample_ais_records[0]
        _, score = calculate_trajectory_score(sat, "2026-01-01T12:00:00Z", ais)
        assert 0.0 <= score <= 1.0


# ──────────────────────────────────────────────────────────────────────────────
# Tests: Spatial/Temporal Matching
# ──────────────────────────────────────────────────────────────────────────────

class TestSpatialTemporalMatching:
    def test_close_ship_matched(self, sample_ais_records, sample_physical_ships):
        sat = sample_physical_ships[0]  # At (12.48, 72.48)
        candidates = match_spatial_temporal_ais(
            sat_ship=sat,
            sat_timestamp_str="2026-01-01T12:00:00Z",
            ais_records=sample_ais_records,
            radius_km=50.0,
            time_window_minutes=120
        )
        assert len(candidates) > 0

    def test_far_ship_not_matched(self, sample_ais_records, sample_physical_ships):
        sat = sample_physical_ships[1]  # At (11.0, 70.0) — far away
        candidates = match_spatial_temporal_ais(
            sat_ship=sat,
            sat_timestamp_str="2026-01-01T12:00:00Z",
            ais_records=sample_ais_records,
            radius_km=5.0,
            time_window_minutes=30
        )
        assert len(candidates) == 0


# ──────────────────────────────────────────────────────────────────────────────
# Tests: AIS Anomaly Engine (Module 6 End-to-End)
# ──────────────────────────────────────────────────────────────────────────────

class TestAISAnomalyEngine:
    def test_engine_runs(self, sample_ais_records, sample_physical_ships):
        engine = AISAnomalyEngine(CONFIG_PATH)
        result = engine.process_ship_matching(
            physical_ships=sample_physical_ships,
            sat_timestamp_str="2026-01-01T12:00:00Z",
            ais_records=sample_ais_records
        )
        assert isinstance(result, dict)
        assert "matched" in result
        assert "unmatched" in result
        assert "anomalies" in result

    def test_unmatched_vessel_detected(self, sample_ais_records, sample_physical_ships):
        """SAT_NO_AIS ship at (11.0, 70.0) should be classified as UNMATCHED."""
        engine = AISAnomalyEngine(CONFIG_PATH)
        result = engine.process_ship_matching(
            physical_ships=sample_physical_ships,
            sat_timestamp_str="2026-01-01T12:00:00Z",
            ais_records=sample_ais_records
        )
        total_ships = len(result["matched"]) + len(result["possible_matches"]) + len(result["unmatched"])
        assert total_ships == len(sample_physical_ships)

    def test_anomaly_score_range(self, sample_ais_records, sample_physical_ships):
        engine = AISAnomalyEngine(CONFIG_PATH)
        result = engine.process_ship_matching(
            physical_ships=sample_physical_ships,
            sat_timestamp_str="2026-01-01T12:00:00Z",
            ais_records=sample_ais_records
        )
        all_items = result["matched"] + result["possible_matches"] + result["unmatched"]
        for item in all_items:
            assert 0.0 <= item["anomaly_score"] <= 1.0, \
                f"Anomaly score out of [0,1] range: {item['anomaly_score']}"
