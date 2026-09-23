"""
test_forecast_uncertainty.py — Unit tests for Module 9 (Forward Forecast) and Module 10 (Uncertainty Engine)

All tests use synthetic mock data. NOT scientifically valid.
"""
import sys
import os
import pytest
import numpy as np

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from src.forecast.integrator import run_forward_particle_integration
from src.forecast.plume import ForwardForecastEngine
from src.uncertainty.perturbations import sample_perturbed_parameters
from src.uncertainty.eta import calculate_eta_distribution
from src.uncertainty.monte_carlo import run_monte_carlo_simulations
from src.uncertainty.impact import UncertaintyEngine

CONFIG_PATH = "configs/config.yaml"
BBOX = (12.0, 72.0, 13.0, 73.0)

OCEAN_DATA = {
    "wind_u": 3.5, "wind_v": 2.0,
    "current_u": 0.35, "current_v": 0.20,
    "wind_speed_ms": 4.03,
    "wave_height_m": 1.4,
    "windage": 0.03
}

GEO_LAYERS = {
    "ports": [{"name": "Mock_Port_A", "geometry": {"coordinates": [72.15, 12.30]}}],
    "fisheries": [{"name": "Fishery_Zone_1"}]
}


@pytest.fixture
def simple_spill_mask():
    mask = np.zeros((256, 256), dtype=np.uint8)
    mask[110:150, 110:150] = 1
    return mask


@pytest.fixture
def initial_particles():
    """Small particle cloud centered near spill bbox."""
    rng = np.random.default_rng(42)
    lats = rng.uniform(12.3, 12.5, size=40)
    lons = rng.uniform(72.3, 72.5, size=40)
    return np.column_stack([lats, lons])


# ══════════════════════════════════════════════════════════════════════════════
# MODULE 9 — Forward Forecast Engine
# ══════════════════════════════════════════════════════════════════════════════

class TestForwardIntegrator:
    def test_returns_all_horizons(self, initial_particles):
        horizon_map = run_forward_particle_integration(
            initial_particles=initial_particles,
            ocean_data=OCEAN_DATA,
            max_horizon_hours=24.0,
            dt_minutes=60.0,
            windage=0.03,
            diffusion=0.001,
            seed=42
        )
        # All horizons <= 24 should be present
        for h in [6, 12, 24]:
            assert h in horizon_map

    def test_particle_count_preserved(self, initial_particles):
        horizon_map = run_forward_particle_integration(
            initial_particles=initial_particles,
            ocean_data=OCEAN_DATA,
            max_horizon_hours=12.0,
            dt_minutes=60.0,
            windage=0.03,
            diffusion=0.001,
            seed=42
        )
        n = len(initial_particles)
        for h, pts in horizon_map.items():
            assert pts.shape == (n, 2), f"Horizon {h}: expected {n} particles, got {pts.shape[0]}"

    def test_particles_advect_forward(self, initial_particles):
        """With zero diffusion, all particles should move in the same direction."""
        horizon_map = run_forward_particle_integration(
            initial_particles=initial_particles,
            ocean_data=OCEAN_DATA,
            max_horizon_hours=6.0,
            dt_minutes=60.0,
            windage=0.03,
            diffusion=0.0,
            seed=42
        )
        orig_center = np.mean(initial_particles, axis=0)
        end_center = np.mean(horizon_map[6], axis=0)
        assert not np.allclose(orig_center, end_center, atol=1e-8)


class TestForwardForecastEngine:
    def test_engine_returns_dict(self, simple_spill_mask):
        engine = ForwardForecastEngine(CONFIG_PATH)
        result = engine.forecast_spill_movement(
            spill_mask=simple_spill_mask,
            ocean_data=OCEAN_DATA,
            bbox_geo=BBOX
        )
        assert isinstance(result, dict)
        assert "horizons" in result
        assert len(result["horizons"]) > 0

    def test_all_configured_horizons_present(self, simple_spill_mask):
        from src.utils.config import load_config
        cfg = load_config(CONFIG_PATH)
        horizons = cfg["forecast"]["horizons_hours"]

        engine = ForwardForecastEngine(CONFIG_PATH)
        result = engine.forecast_spill_movement(
            spill_mask=simple_spill_mask,
            ocean_data=OCEAN_DATA,
            bbox_geo=BBOX
        )
        for h in horizons:
            key = f"{h}h"
            assert key in result["horizons"], f"Missing horizon key: {key}"

    def test_center_coords_plausible(self, simple_spill_mask):
        engine = ForwardForecastEngine(CONFIG_PATH)
        result = engine.forecast_spill_movement(
            spill_mask=simple_spill_mask,
            ocean_data=OCEAN_DATA,
            bbox_geo=BBOX
        )
        for key, h_data in result["horizons"].items():
            lat, lon = h_data["center_coords"]
            assert -90.0 <= lat <= 90.0, f"Invalid lat in {key}: {lat}"
            assert -180.0 <= lon <= 180.0, f"Invalid lon in {key}: {lon}"


# ══════════════════════════════════════════════════════════════════════════════
# MODULE 10 — Uncertainty Engine
# ══════════════════════════════════════════════════════════════════════════════

class TestPerturbations:
    def test_perturbed_params_has_windage(self):
        unc_cfg = {"wind_u_std": 0.5, "wind_v_std": 0.5, "current_u_std": 0.05,
                   "current_v_std": 0.05, "windage_std": 0.005, "windage": 0.03}
        perturbed = sample_perturbed_parameters(OCEAN_DATA, unc_cfg, seed=42)
        assert "windage" in perturbed
        assert "wind_u" in perturbed

    def test_windage_stays_positive(self):
        unc_cfg = {"wind_u_std": 0.1, "wind_v_std": 0.1, "current_u_std": 0.01,
                   "current_v_std": 0.01, "windage_std": 0.001, "windage": 0.03}
        for seed in range(20):
            p = sample_perturbed_parameters(OCEAN_DATA, unc_cfg, seed=seed)
            assert p["windage"] > 0.0, f"Negative windage at seed={seed}: {p['windage']}"


class TestETADistribution:
    def test_empty_returns_default(self):
        eta, conf = calculate_eta_distribution([])
        assert len(eta) == 2
        assert 0.0 <= conf <= 1.0

    def test_consistent_arrivals_high_confidence(self):
        # All arrivals at 12h → very low std → high confidence
        arrivals = [12] * 50
        eta, conf = calculate_eta_distribution(arrivals)
        assert conf >= 0.80

    def test_spread_arrivals_lower_confidence(self):
        arrivals = [6, 12, 24, 48, 72] * 10
        _, conf_spread = calculate_eta_distribution(arrivals)
        arrivals_tight = [12] * 50
        _, conf_tight = calculate_eta_distribution(arrivals_tight)
        assert conf_tight >= conf_spread

    def test_eta_bounds_ordered(self):
        arrivals = [6, 12, 18, 24, 30]
        eta, _ = calculate_eta_distribution(arrivals)
        assert eta[0] <= eta[1]


class TestMonteCarloSimulations:
    def test_returns_list_of_correct_length(self, simple_spill_mask):
        unc_cfg = {
            "num_simulations": 5, "particle_count": 20,
            "wind_u_std": 0.3, "wind_v_std": 0.3,
            "current_u_std": 0.03, "current_v_std": 0.03,
            "windage_std": 0.003, "windage": 0.03, "diffusion": 0.001
        }
        results = run_monte_carlo_simulations(
            spill_mask=simple_spill_mask,
            ocean_data=OCEAN_DATA,
            unc_cfg=unc_cfg,
            bbox_geo=BBOX,
            seed=42
        )
        assert len(results) == 5

    def test_each_result_is_horizon_dict(self, simple_spill_mask):
        unc_cfg = {
            "num_simulations": 3, "particle_count": 10,
            "wind_u_std": 0.3, "wind_v_std": 0.3,
            "current_u_std": 0.03, "current_v_std": 0.03,
            "windage_std": 0.003, "windage": 0.03, "diffusion": 0.001
        }
        results = run_monte_carlo_simulations(
            spill_mask=simple_spill_mask,
            ocean_data=OCEAN_DATA,
            unc_cfg=unc_cfg,
            bbox_geo=BBOX,
            seed=0
        )
        for sim_map in results:
            assert isinstance(sim_map, dict)
            for h, pts in sim_map.items():
                assert isinstance(pts, np.ndarray)
                assert pts.ndim == 2
                assert pts.shape[1] == 2


class TestUncertaintyEngine:
    def test_engine_returns_dict(self, simple_spill_mask):
        engine = UncertaintyEngine(CONFIG_PATH)
        result = engine.evaluate_spill_uncertainty(
            spill_mask=simple_spill_mask,
            ocean_data=OCEAN_DATA,
            geo_layers=GEO_LAYERS,
            bbox_geo=BBOX
        )
        assert isinstance(result, dict)
        assert "assets" in result
        assert "overall_prediction_confidence" in result

    def test_confidence_in_range(self, simple_spill_mask):
        engine = UncertaintyEngine(CONFIG_PATH)
        result = engine.evaluate_spill_uncertainty(
            spill_mask=simple_spill_mask,
            ocean_data=OCEAN_DATA,
            geo_layers=GEO_LAYERS,
            bbox_geo=BBOX
        )
        c = result["overall_prediction_confidence"]
        assert 0.0 <= c <= 1.0, f"Confidence out of [0,1]: {c}"

    def test_asset_impact_probs_in_range(self, simple_spill_mask):
        engine = UncertaintyEngine(CONFIG_PATH)
        result = engine.evaluate_spill_uncertainty(
            spill_mask=simple_spill_mask,
            ocean_data=OCEAN_DATA,
            geo_layers=GEO_LAYERS,
            bbox_geo=BBOX
        )
        for asset in result["assets"]:
            p = asset["impact_probability"]
            assert 0.0 <= p <= 1.0, f"Asset {asset['asset']} impact_prob={p} out of [0,1]"

    def test_disclaimer_present(self, simple_spill_mask):
        engine = UncertaintyEngine(CONFIG_PATH)
        result = engine.evaluate_spill_uncertainty(
            spill_mask=simple_spill_mask,
            ocean_data=OCEAN_DATA,
            geo_layers={},
            bbox_geo=BBOX
        )
        assert "disclaimer" in result
        assert len(result["disclaimer"]) > 10
