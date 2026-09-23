"""
src/feedback/comparator.py - Module 15: Prediction vs Reality Feedback.

Compares a previous M9 forecast polygon against a new M2 observed polygon.
Computes IoU, geodesic centroid error, area error, direction error (optional),
and ETA error (optional).

The recalibration_factor is DISPLAY-ONLY.
"""
import math
from typing import Any, Dict, List, Optional

from shapely.geometry import shape as shapely_shape
from shapely.errors import ShapelyError

from src.utils.logging import get_logger
from src.ais.matcher import calculate_geodesic_distance_km

logger = get_logger("FeedbackComparator")

RECAL_LABELS = [
    (0.75, "EXCELLENT FORECAST"),
    (0.50, "GOOD FORECAST"),
    (0.25, "FAIR FORECAST"),
    (0.0,  "POOR FORECAST"),
]

DEG_TO_KM = 111.0


def _clip(v: float, lo: float = 0.0, hi: float = 1.0) -> float:
    return max(lo, min(hi, float(v)))


def _recal_label(factor: float) -> str:
    for threshold, label in RECAL_LABELS:
        if factor >= threshold:
            return label
    return "POOR FORECAST"


def _bearing(lat1: float, lon1: float, lat2: float, lon2: float) -> float:
    dlat = lat2 - lat1
    dlon = lon2 - lon1
    angle_rad = math.atan2(dlon, dlat)
    return (math.degrees(angle_rad) + 360.0) % 360.0


def _angular_diff(a: float, b: float) -> float:
    d = abs(a - b) % 360.0
    return d if d <= 180.0 else 360.0 - d


def _geom_area_approx_km2(geom) -> float:
    try:
        b = geom.bounds
        return abs((b[2] - b[0]) * (b[3] - b[1])) * (DEG_TO_KM ** 2)
    except Exception:
        return float(geom.area) * (DEG_TO_KM ** 2)


class FeedbackComparator:
    """
    Module 15 Engine - stateless polygon comparison.

    Inputs are raw GeoJSON dicts (predicted_polygon from M9, observed_polygon from M2).
    No scene_id lookup - this is a cross-time comparison.
    """

    def compare(
        self,
        predicted_polygon: Dict[str, Any],
        observed_polygon: Dict[str, Any],
        predicted_horizon_hours: Optional[float] = None,
        prediction_made_timestamp: Optional[str] = None,
        observation_timestamp: Optional[str] = None,
        spill_origin: Optional[List[float]] = None,
    ) -> Dict[str, Any]:
        """Compare predicted and observed spill polygons."""
        try:
            pred_geom = shapely_shape(predicted_polygon)
        except (ShapelyError, Exception) as e:
            logger.warning("[MODULE 15] Could not parse predicted_polygon: %s. Using empty.", e)
            pred_geom = None

        try:
            obs_geom = shapely_shape(observed_polygon)
        except (ShapelyError, Exception) as e:
            logger.warning("[MODULE 15] Could not parse observed_polygon: %s. Using empty.", e)
            obs_geom = None

        if pred_geom is None or obs_geom is None or pred_geom.is_empty or obs_geom.is_empty:
            iou = 0.0
        else:
            try:
                intersection = pred_geom.intersection(obs_geom).area
                union = pred_geom.union(obs_geom).area
                iou = round(intersection / union if union > 0 else 0.0, 4)
            except Exception:
                iou = 0.0

        if pred_geom is not None and not pred_geom.is_empty:
            pred_c = pred_geom.centroid
            pred_clat, pred_clon = pred_c.y, pred_c.x
        else:
            pred_clat, pred_clon = 0.0, 0.0

        if obs_geom is not None and not obs_geom.is_empty:
            obs_c = obs_geom.centroid
            obs_clat, obs_clon = obs_c.y, obs_c.x
        else:
            obs_clat, obs_clon = 0.0, 0.0

        try:
            centroid_error_km = round(
                calculate_geodesic_distance_km(
                    (pred_clat, pred_clon), (obs_clat, obs_clon)
                ), 3
            )
        except Exception:
            centroid_error_km = 0.0

        pred_area_km2 = _geom_area_approx_km2(pred_geom) if (pred_geom and not pred_geom.is_empty) else 0.0
        obs_area_km2  = _geom_area_approx_km2(obs_geom)  if (obs_geom  and not obs_geom.is_empty)  else 0.0
        area_error_km2 = round(abs(pred_area_km2 - obs_area_km2), 4)
        area_error_frac = round(area_error_km2 / max(obs_area_km2, 1e-3), 4)

        direction_error_deg: Optional[float] = None
        if spill_origin and len(spill_origin) >= 2:
            try:
                orig_lat, orig_lon = float(spill_origin[0]), float(spill_origin[1])
                pred_bear = _bearing(orig_lat, orig_lon, pred_clat, pred_clon)
                obs_bear  = _bearing(orig_lat, orig_lon, obs_clat,  obs_clon)
                direction_error_deg = round(_angular_diff(pred_bear, obs_bear), 2)
            except Exception:
                direction_error_deg = None

        eta_error_hours: Optional[float] = None
        if (
            predicted_horizon_hours is not None
            and prediction_made_timestamp is not None
            and observation_timestamp is not None
        ):
            try:
                from src.data_processing.temporal_alignment import parse_timestamp
                t_pred = parse_timestamp(prediction_made_timestamp)
                t_obs  = parse_timestamp(observation_timestamp)
                actual_hours = (t_obs - t_pred).total_seconds() / 3600.0
                eta_error_hours = round(abs(actual_hours - float(predicted_horizon_hours)), 3)
            except Exception as e:
                logger.warning("[MODULE 15] ETA error computation failed: %s", e)
                eta_error_hours = None

        area_term = _clip(1.0 - area_error_frac)
        cent_term = _clip(1.0 - centroid_error_km / 50.0)
        recal = _clip(iou * 0.50 + cent_term * 0.30 + area_term * 0.20)
        recal = round(recal, 4)

        logger.info(
            "[MODULE 15 FEEDBACK] IoU=%.3f centroid_err=%.2fkm area_err=%.3fkm2 recal=%.3f (%s)",
            iou, centroid_error_km, area_error_km2, recal, _recal_label(recal)
        )

        return {
            "iou": iou,
            "centroid_error_km": centroid_error_km,
            "area_error_km2": area_error_km2,
            "area_error_fraction": min(area_error_frac, 9999.0),
            "direction_error_deg": direction_error_deg,
            "eta_error_hours": eta_error_hours,
            "recalibration_factor": recal,
            "recalibration_interpretation": _recal_label(recal),
            "disclaimer": (
                "Recalibration factor is a display-only advisory metric derived from synthetic "
                "mock data. It does NOT modify any model weights or operational parameters."
            ),
        }
