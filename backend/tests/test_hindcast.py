"""
test_hindcast.py — Unit tests for Module 7: Hindcast / Spill Origin Engine

All tests run on synthetic mock data. NOT scientifically valid.
"""
import sys
import os
import pytest
import numpy as np

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from src.hindcast.particles import initialize_hindcast_particles
from src.hindcast.integrator import run_backward_particle_integration
from src.hindcast.origin_probability import HindcastOriginEngine

CONFIG_PATH = "configs/config.yaml"
BBOX = (12.0, 72.0, 13.0, 73.0)

OCEAN_DATA = {
    "wind_u": 3.5, "wind_v": 2.0,
    "current_u": 0.35, "current_v": 0.20,
    "wind_speed_ms": 4.03,
    "wave_height_m": 1.4
}


@pytest.fixture
def simple_spill_mask():
    mask = np.zeros((256, 256), dtype=np.uint8)
    mask[100:140, 100:140] = 1
    return mask


# ──────────────────────────────────────────────────────────────────────────────
# Tests: Particle Initialization
# ──────────────────────────────────────────────────────────────────────────────

class TestParticleInitialization:
    def test_returns_correct_shape(self, simple_spill_mask):
        particles = initialize_hindcast_particles(
            spill_mask=simple_spill_mask,
            spill_polygons=None,
            particle_count=50,
            bbox_geo=BBOX,
            seed=42
        )
        assert particles.shape == (50, 2)

    def test_particles_within_bbox(self, simple_spill_mask):
        particles = initialize_hindcast_particles(
            spill_mask=simple_spill_mask,
            particle_count=100,
            bbox_geo=BBOX,
            seed=7
        )
        min_lat, min_lon, max_lat, max_lon = BBOX
        # Particles should be inside or very near bbox
        assert np.all(particles[:, 0] >= min_lat - 0.5)
        assert np.all(particles[:, 0] <= max_lat + 0.5)

    def test_no_spill_mask_fallback(self):
        particles = initialize_hindcast_particles(
            spill_mask=None,
            spill_polygons=None,
            particle_count=30,
            bbox_geo=BBOX,
            seed=1
        )
        assert particles.shape == (30, 2)


# ──────────────────────────────────────────────────────────────────────────────
# Tests: Backward Integration
# ──────────────────────────────────────────────────────────────────────────────

class TestBackwardIntegration:
    def test_output_shape(self, simple_spill_mask):
        init_particles = initialize_hindcast_particles(
            spill_mask=simple_spill_mask, particle_count=20, bbox_geo=BBOX, seed=42
        )
        endpoints, history = run_backward_particle_integration(
            initial_particles=init_particles,
            ocean_data=OCEAN_DATA,
            historical_hours=6.0,
            dt_minutes=60.0,  # coarse for speed
            windage=0.03,
            diffusion=0.001,
            seed=42
        )
        assert endpoints.shape == (20, 2)
        assert len(history) >= 1

    def test_particles_moved_backward(self, simple_spill_mask):
        init_particles = initialize_hindcast_particles(
            spill_mask=simple_spill_mask, particle_count=50, bbox_geo=BBOX, seed=42
        )
        orig_center = np.mean(init_particles, axis=0)
        endpoints, _ = run_backward_particle_integration(
            initial_particles=init_particles,
            ocean_data=OCEAN_DATA,
            historical_hours=6.0,
            dt_minutes=60.0,
            windage=0.03,
            diffusion=0.0,  # no noise to test determinism
            seed=42
        )
        end_center = np.mean(endpoints, axis=0)
        # With zero diffusion, particles should shift by advection
        assert not np.allclose(orig_center, end_center, atol=1e-6)


# ──────────────────────────────────────────────────────────────────────────────
# Tests: HindcastOriginEngine (Module 7 End-to-End)
# ──────────────────────────────────────────────────────────────────────────────

class TestHindcastOriginEngine:
    def test_engine_returns_result(self, simple_spill_mask):
        engine = HindcastOriginEngine(CONFIG_PATH)
        result = engine.estimate_spill_origin(
            spill_mask=simple_spill_mask,
            observation_timestamp="2026-01-01T12:00:00Z",
            ocean_data=OCEAN_DATA,
            bbox_geo=BBOX
        )
        assert isinstance(result, dict)
        assert "origin_centroid" in result

    def test_origin_centroid_is_two_floats(self, simple_spill_mask):
        engine = HindcastOriginEngine(CONFIG_PATH)
        result = engine.estimate_spill_origin(
            spill_mask=simple_spill_mask,
            observation_timestamp="2026-01-01T12:00:00Z",
            ocean_data=OCEAN_DATA,
            bbox_geo=BBOX
        )
        centroid = result["origin_centroid"]
        assert len(centroid) == 2
        assert all(isinstance(v, float) for v in centroid)

    def test_top_zones_probability_sums_to_approx_one(self, simple_spill_mask):
        engine = HindcastOriginEngine(CONFIG_PATH)
        result = engine.estimate_spill_origin(
            spill_mask=simple_spill_mask,
            observation_timestamp="2026-01-01T12:00:00Z",
            ocean_data=OCEAN_DATA,
            bbox_geo=BBOX
        )
        zones = result["top_origin_zones"]
        total_prob = sum(z["probability"] for z in zones)
        assert total_prob == pytest.approx(1.0, abs=0.15)

    def test_release_interval_present(self, simple_spill_mask):
        engine = HindcastOriginEngine(CONFIG_PATH)
        result = engine.estimate_spill_origin(
            spill_mask=simple_spill_mask,
            observation_timestamp="2026-01-01T12:00:00Z",
            ocean_data=OCEAN_DATA,
            bbox_geo=BBOX
        )
        interval = result["estimated_release_time"]
        assert "start" in interval and "end" in interval
