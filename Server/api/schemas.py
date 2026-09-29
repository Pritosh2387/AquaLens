"""
api/schemas.py — Pydantic request & response schemas for AquaLens FastAPI.

Every schema is derived from actual module inputs/outputs — no invented parameters.
"""
from __future__ import annotations

from typing import Any, Dict, List, Optional
from pydantic import BaseModel, Field


# ──────────────────────────────────────────────────────────────────────────────
# Shared / common
# ──────────────────────────────────────────────────────────────────────────────

class SceneRequest(BaseModel):
    """Used by any endpoint that only needs a scene_id to drive the pipeline."""
    scene_id: str = Field(
        default="SCENE_001",
        description="Scene identifier. Must match a mock dataset scene (e.g. SCENE_001).",
        examples=["SCENE_001"],
    )
    config_path: str = Field(
        default="configs/config.yaml",
        description="Path to the YAML configuration file (relative to project root).",
    )


class ErrorResponse(BaseModel):
    error: str
    message: str


# ──────────────────────────────────────────────────────────────────────────────
# Typed sub-models shared across M13 / M14 / M15
# ──────────────────────────────────────────────────────────────────────────────

class ResourceOverride(BaseModel):
    """
    Defines a single resource type entry in a custom fleet override for Module 13.

    Fields map exactly to the ResourceOptimizer._build_fleet() implementation.
    All fields except `type` and `count` are optional — defaults are applied internally.
    """
    type: str = Field(
        description=(
            "Resource type identifier. Recognised values: "
            "'skimmer', 'containment_boom', 'patrol_vessel', 'drone', 'aircraft'. "
            "Custom types are accepted but get default operational parameters."
        ),
        examples=["skimmer"],
    )
    count: int = Field(
        default=1,
        description="Number of units of this type in the fleet.",
        examples=[2],
    )
    speed_knots: Optional[float] = Field(
        default=None,
        description="Transit speed in knots. If omitted, defaults to 8 knots (or 0 for booms).",
        examples=[8.0],
    )
    capacity_tons: Optional[float] = Field(
        default=None,
        description="Recovery/containment capacity in metric tonnes.",
        examples=[50.0],
    )
    range_km: Optional[float] = Field(
        default=None,
        description="Maximum operational range in kilometres.",
        examples=[200.0],
    )
    home_lat: Optional[float] = Field(
        default=None,
        description="Home base latitude (WGS-84). Used for travel-time calculation.",
        examples=[12.1],
    )
    home_lon: Optional[float] = Field(
        default=None,
        description="Home base longitude (WGS-84). Used for travel-time calculation.",
        examples=[72.1],
    )

    model_config = {
        "json_schema_extra": {
            "examples": [
                {
                    "type": "skimmer",
                    "count": 2,
                    "speed_knots": 8.0,
                    "capacity_tons": 50.0,
                    "range_km": 200.0,
                    "home_lat": 12.1,
                    "home_lon": 72.1,
                }
            ]
        }
    }


class AlternativeAllocation(BaseModel):
    """
    A single resource-to-target assignment in a user-supplied alternative scenario for Module 14.

    The simulator uses `target_asset` to determine which high-impact assets
    are covered by the alternative plan. `resource_type` is optional metadata
    used only for cost-index calculation.
    """
    resource_type: str = Field(
        description="Type of resource being deployed (e.g. 'skimmer', 'drone').",
        examples=["skimmer"],
    )
    target_asset: str = Field(
        description=(
            "Asset name this resource is assigned to. "
            "Must match an `asset` name from Module 11 output to count as 'covered'."
        ),
        examples=["Malvan Marine Sanctuary"],
    )

    model_config = {
        "json_schema_extra": {
            "examples": [
                {"resource_type": "skimmer", "target_asset": "Malvan Marine Sanctuary"},
            ]
        }
    }


class GeoJSONPolygon(BaseModel):
    """
    Minimal GeoJSON Polygon representation accepted by Module 15 FeedbackComparator.

    The `type` field MUST be `"Polygon"`.
    `coordinates` is a list of rings; the first ring is the exterior boundary.
    Each ring is a list of [longitude, latitude] pairs (GeoJSON coordinate order).
    The ring MUST be closed: first and last point must be identical.

    This is the same structure returned by Module 9 `horizons[Xh].predicted_polygon`
    and Module 2 `polygons[i].geometry`.
    """
    type: str = Field(
        default="Polygon",
        description="GeoJSON geometry type. Must be 'Polygon'.",
        examples=["Polygon"],
    )
    coordinates: List[List[List[float]]] = Field(
        description=(
            "Array of rings. Each ring is an array of [longitude, latitude] pairs. "
            "The ring must be closed (first == last point). "
            "Coordinate order: [longitude, latitude] — NOT [lat, lon]."
        ),
        examples=[
            [
                [
                    [72.0, 12.0],
                    [72.3, 12.0],
                    [72.3, 12.3],
                    [72.0, 12.3],
                    [72.0, 12.0],
                ]
            ]
        ],
    )

    model_config = {
        "json_schema_extra": {
            "examples": [
                {
                    "type": "Polygon",
                    "coordinates": [
                        [
                            [72.0, 12.0],
                            [72.3, 12.0],
                            [72.3, 12.3],
                            [72.0, 12.3],
                            [72.0, 12.0],
                        ]
                    ],
                }
            ]
        }
    }


# ──────────────────────────────────────────────────────────────────────────────
# Module 1 — Data Processing
# ──────────────────────────────────────────────────────────────────────────────

class Module1Request(BaseModel):
    scene_id: str = Field(default="SCENE_001", examples=["SCENE_001"])
    config_path: str = Field(default="configs/config.yaml")


class Module1Response(BaseModel):
    scene_id: str
    mode: str
    timestamp: str
    bbox: List[float]
    has_optical: bool
    features: Dict[str, Any]
    sar_shape: List[int]
    optical_shape: Optional[List[int]]
    ais_record_count: int
    ocean_data_keys: List[str]
    geographic_layer_keys: List[str]


# ──────────────────────────────────────────────────────────────────────────────
# Module 2 — Oil Spill Detection
# ──────────────────────────────────────────────────────────────────────────────

class Module2Request(BaseModel):
    scene_id: str = Field(default="SCENE_001", examples=["SCENE_001"])
    config_path: str = Field(default="configs/config.yaml")


class SpillPolygon(BaseModel):
    slick_id: str
    mean_probability: float
    shape_features: Dict[str, float]
    geometry: Dict[str, Any]

class Module2Response(BaseModel):
    scene_id: str
    spill_detected: bool
    spill_probability: float
    spill_area_km2: float
    slicks_found: int
    polygons: List[SpillPolygon]


# ──────────────────────────────────────────────────────────────────────────────
# Module 3 — SAR + Optical Fusion
# ──────────────────────────────────────────────────────────────────────────────

class Module3Request(BaseModel):
    scene_id: str = Field(default="SCENE_001", examples=["SCENE_001"])
    config_path: str = Field(default="configs/config.yaml")


class SensorContributions(BaseModel):
    sar_contribution: float
    optical_contribution: float
    environmental_contribution: float
    note: str

class Module3Response(BaseModel):
    scene_id: str
    spill_probability: float
    has_optical_used: bool
    sensor_contributions: SensorContributions


# ──────────────────────────────────────────────────────────────────────────────
# Module 4 — Oil Confidence / Look-Alike
# ──────────────────────────────────────────────────────────────────────────────

class Module4Request(BaseModel):
    scene_id: str = Field(default="SCENE_001", examples=["SCENE_001"])
    config_path: str = Field(default="configs/config.yaml")


class ConfidenceFeatures(BaseModel):
    model_probability: float
    sar_texture_score: float
    shape_score: float
    optical_agreement: float
    wind_condition: float
    wave_condition: float
    temporal_consistency: float
    lookalike_probability: float

class Module4Response(BaseModel):
    scene_id: str
    oil_probability: float
    confidence: float
    lookalike_probability: float
    verification_required: bool
    verification_state: str
    feature_vector: ConfidenceFeatures


# ──────────────────────────────────────────────────────────────────────────────
# Module 5 — Physical Ship Detection
# ──────────────────────────────────────────────────────────────────────────────

class Module5Request(BaseModel):
    scene_id: str = Field(default="SCENE_001", examples=["SCENE_001"])
    config_path: str = Field(default="configs/config.yaml")


class ShipDetection(BaseModel):
    ship_id: str
    mode: str
    lat: float
    lon: float
    confidence: float
    pixel_center: List[float]
    pixel_bbox: List[int]

class ShipDetection(BaseModel):
    ship_id: str
    mode: str
    lat: float
    lon: float
    confidence: float
    pixel_center: List[float]
    pixel_bbox: List[int]

class Module5Response(BaseModel):
    scene_id: str
    ship_count: int
    ships: List[ShipDetection]


# ──────────────────────────────────────────────────────────────────────────────
# Module 6 — AIS Matching + Anomaly
# ──────────────────────────────────────────────────────────────────────────────

class Module6Request(BaseModel):
    scene_id: str = Field(default="SCENE_001", examples=["SCENE_001"])
    config_path: str = Field(default="configs/config.yaml")


class AISMatchResult(BaseModel):
    satellite_ship_id: str
    mmsi: Optional[int]
    physical_match: bool
    lat: float
    lon: float
    match_distance_km: Optional[float]
    time_difference_minutes: Optional[float]
    ais_gap_minutes: float
    position_error_km: Optional[float]
    trajectory_score: float
    anomaly_score: float
    status: str
    note: str

class Module6Response(BaseModel):
    scene_id: str
    data_type: str = "INFERRED"
    matched_count: int
    possible_match_count: int
    unmatched_count: int
    anomalies_count: int
    matched: List[AISMatchResult]
    possible_matches: List[AISMatchResult]
    unmatched: List[AISMatchResult]
    anomalies: List[AISMatchResult]


# ──────────────────────────────────────────────────────────────────────────────
# Module 7 — Hindcast / Spill Origin
# ──────────────────────────────────────────────────────────────────────────────

class Module7Request(BaseModel):
    scene_id: str = Field(default="SCENE_001", examples=["SCENE_001"])
    config_path: str = Field(default="configs/config.yaml")


class OriginZone(BaseModel):
    zone_id: str
    center_lat: float
    center_lon: float
    radius_km: float
    probability: float

class ReleaseTimeWindow(BaseModel):
    start: str
    end: str
    historical_lookback_hours: float

class Module7Response(BaseModel):
    scene_id: str
    data_type: str = "INFERRED"
    origin_centroid: List[float]
    top_origin_zones: List[OriginZone]
    estimated_release_time: ReleaseTimeWindow
    particle_count: int


# ──────────────────────────────────────────────────────────────────────────────
# Module 8 — Vessel Attribution
# ──────────────────────────────────────────────────────────────────────────────

class Module8Request(BaseModel):
    scene_id: str = Field(default="SCENE_001", examples=["SCENE_001"])
    config_path: str = Field(default="configs/config.yaml")


class AttributionEvidence(BaseModel):
    origin_distance: float
    time_match: float
    trajectory: float
    physical_match: float
    ais_gap: float
    behavior_anomaly: float
    data_quality: float

class RankedVesselCandidate(BaseModel):
    mmsi: int
    vessel_name: str
    attribution_score: float
    min_origin_distance_km: float
    evidence: AttributionEvidence
    rank: int
    explanation: str

class Module8Response(BaseModel):
    scene_id: str
    data_type: str = "INFERRED"
    disclaimer: str
    ranked_candidates: List[RankedVesselCandidate]


# ──────────────────────────────────────────────────────────────────────────────
# Module 9 — Forward Spill Forecast
# ──────────────────────────────────────────────────────────────────────────────

class Module9Request(BaseModel):
    scene_id: str = Field(default="SCENE_001", examples=["SCENE_001"])
    config_path: str = Field(default="configs/config.yaml")


class ForecastHorizon(BaseModel):
    horizon_hours: int
    center_coords: List[float]
    particle_count: int
    predicted_polygon: Optional[Dict[str, Any]] = None

class Module9Response(BaseModel):
    scene_id: str
    data_type: str = "SIMULATED"
    particle_count: int
    horizons: Dict[str, ForecastHorizon]


# ──────────────────────────────────────────────────────────────────────────────
# Module 10 — Uncertainty / Monte Carlo
# ──────────────────────────────────────────────────────────────────────────────

class Module10Request(BaseModel):
    scene_id: str = Field(default="SCENE_001", examples=["SCENE_001"])
    config_path: str = Field(default="configs/config.yaml")


class UncertaintyAsset(BaseModel):
    asset: str
    asset_type: str
    impact_probability: float
    eta_hours: List[float]
    confidence: float

class Module10Response(BaseModel):
    scene_id: str
    data_type: str = "SIMULATED"
    num_simulations: int
    overall_prediction_confidence: float
    assets: List[UncertaintyAsset]
    disclaimer: str


# ──────────────────────────────────────────────────────────────────────────────
# Module 11 — Impact Prediction
# ──────────────────────────────────────────────────────────────────────────────

class Module11Request(BaseModel):
    scene_id: str = Field(default="SCENE_001", examples=["SCENE_001"])
    config_path: str = Field(default="configs/config.yaml")


class AssetImpactDetail(BaseModel):
    asset: str
    asset_type: str
    sensitivity: float
    impact_probability: float
    eta_hours: List[int]
    time_to_impact_factor: float
    asset_impact_score: float
    impact_level: str


class Module11Response(BaseModel):
    scene_id: str
    data_type: str = "SIMULATED"
    mode: str
    spill_severity_score: float
    overall_impact_score: float
    overall_impact_level: str
    assets: List[AssetImpactDetail]
    disclaimer: str


# ──────────────────────────────────────────────────────────────────────────────
# Module 12 — Priority / Urgency Scoring
# ──────────────────────────────────────────────────────────────────────────────

class Module12Request(BaseModel):
    scene_id: str = Field(default="SCENE_001", examples=["SCENE_001"])
    config_path: str = Field(default="configs/config.yaml")


class PriorityFactor(BaseModel):
    value: float
    weight: float
    weighted_contribution: float


class FactorContribution(BaseModel):
    value: float
    weight: float
    weighted_contribution: float

class Module12Response(BaseModel):
    scene_id: str
    data_type: str = "SIMULATED"
    priority_score: float
    urgency_label: str
    factor_contributions: Dict[str, PriorityFactor]
    weights_used: Dict[str, float]
    disclaimer: str


# ──────────────────────────────────────────────────────────────────────────────
# Module 13 — Resource Optimization
# ──────────────────────────────────────────────────────────────────────────────

class Module13Request(BaseModel):
    scene_id: str = Field(default="SCENE_001", examples=["SCENE_001"])
    config_path: str = Field(default="configs/config.yaml")
    resource_override: Optional[List[ResourceOverride]] = Field(
        default=None,
        description=(
            "Optional custom fleet definition. "
            "If provided, completely replaces the default fleet loaded from configs/config.yaml. "
            "Each entry defines one resource type and its operational parameters. "
            "If omitted, the default mock fleet (15 units across 5 types) is used."
        ),
        examples=[
            [
                {"type": "skimmer", "count": 2, "speed_knots": 8.0, "capacity_tons": 50.0, "range_km": 200.0, "home_lat": 12.1, "home_lon": 72.1},
                {"type": "patrol_vessel", "count": 1, "speed_knots": 15.0, "capacity_tons": 10.0, "range_km": 500.0, "home_lat": 12.05, "home_lon": 72.05},
            ]
        ],
    )


class ResourceAllocation(BaseModel):
    resource_id: str
    resource_type: str
    target_asset: str
    target_coords: List[float]
    estimated_arrival_hours: float
    deployment_score: float
    coverage_area_km2: float


class UnallocatedResource(BaseModel):
    resource_type: str
    count: int

class Module13Response(BaseModel):
    scene_id: str
    data_type: str = "SIMULATED"
    optimization_method: str
    total_resources_available: int
    total_resources_deployed: int
    assets_targeted: int
    estimated_coverage_fraction: float
    allocations: List[ResourceAllocation]
    unallocated_resources: List[UnallocatedResource]
    disclaimer: str


class Module13ORToolsResponse(BaseModel):
    """
    Response for the OR-Tools CP-SAT resource optimization endpoint.

    Extends Module13Response with solver metadata:
      - solver_status: CP-SAT status (OPTIMAL, FEASIBLE, INFEASIBLE_OR_EMPTY)
      - solver_wall_time_seconds: actual solve time in seconds
    """
    scene_id: str
    data_type: str = "SIMULATED"
    optimization_method: str
    solver_status: str = Field(
        description="OR-Tools CP-SAT solver status: OPTIMAL, FEASIBLE, or INFEASIBLE_OR_EMPTY.",
        examples=["OPTIMAL"],
    )
    solver_wall_time_seconds: float = Field(
        description="Wall-clock time (seconds) taken by the CP-SAT solver.",
        examples=[0.012],
    )
    total_resources_available: int
    total_resources_deployed: int
    assets_targeted: int
    estimated_coverage_fraction: float
    allocations: List[ResourceAllocation]
    unallocated_resources: List[UnallocatedResource]
    disclaimer: str


# ──────────────────────────────────────────────────────────────────────────────
# Module 14 — What-If Response Simulation
# ──────────────────────────────────────────────────────────────────────────────

class Module14Request(BaseModel):
    scene_id: str = Field(default="SCENE_001", examples=["SCENE_001"])
    config_path: str = Field(default="configs/config.yaml")
    delay_hours: float = Field(
        default=6.0,
        description="Travel-time delay (hours) applied to the DELAYED scenario. Reduces feasibility of all deployments.",
        examples=[6.0],
    )
    additional_resource_type: str = Field(
        default="skimmer",
        description=(
            "Resource type added in the ADDITIONAL_RESOURCES scenario. "
            "Valid values: 'skimmer', 'containment_boom', 'patrol_vessel', 'drone', 'aircraft'."
        ),
        examples=["skimmer"],
    )
    additional_resource_count: int = Field(
        default=2,
        description="Number of extra units of `additional_resource_type` added in the ADDITIONAL_RESOURCES scenario.",
        examples=[2],
    )
    alternative_allocation: Optional[List[AlternativeAllocation]] = Field(
        default=None,
        description=(
            "Optional user-supplied allocation list for the ALTERNATIVE scenario. "
            "Each entry assigns one resource to one target asset. "
            "The simulator counts how many high-impact assets (from M11) have `target_asset` matches. "
            "If omitted, no ALTERNATIVE scenario is computed."
        ),
        examples=[
            [
                {"resource_type": "skimmer", "target_asset": "Malvan Marine Sanctuary"},
                {"resource_type": "drone", "target_asset": "Mumbai Port"},
            ]
        ],
    )


class ScenarioResult(BaseModel):
    label: str
    coverage_fraction: float
    assets_covered: int
    estimated_impact_reduction: float
    total_deployment_cost_index: float
    additional_resources_needed: int


class ScenarioResult(BaseModel):
    label: str
    coverage_fraction: float
    assets_covered: int
    estimated_impact_reduction: float
    total_deployment_cost_index: float
    additional_resources_needed: int

class Module14Response(BaseModel):
    scene_id: str
    data_type: str = "SIMULATED"
    reference_priority_score: float
    scenarios: Dict[str, ScenarioResult]
    recommended_scenario: str
    disclaimer: str


# ──────────────────────────────────────────────────────────────────────────────
# Module 15 — Prediction vs Reality Feedback
# ──────────────────────────────────────────────────────────────────────────────

class Module15Request(BaseModel):
    """
    Request body for Module 15 — Prediction vs Reality Feedback.

    NOTE: This endpoint does NOT take a `scene_id`. It accepts raw GeoJSON polygons
    directly because a feedback comparison spans two different observation times —
    the original forecast time and the new observation time.
    """
    predicted_polygon: GeoJSONPolygon = Field(
        description=(
            "GeoJSON Polygon representing the forecast spill extent. "
            "Typically taken from Module 9 response: `horizons['24h'].predicted_polygon`."
        ),
    )
    observed_polygon: GeoJSONPolygon = Field(
        description=(
            "GeoJSON Polygon representing the actual observed spill extent at the later time. "
            "Typically taken from a new Module 2 response: `polygons[0].geometry`."
        ),
    )
    predicted_horizon_hours: Optional[float] = Field(
        default=None,
        description="Forecast horizon the prediction was generated for (e.g. 24.0h). Required for ETA error computation.",
        examples=[24.0],
    )
    prediction_made_timestamp: Optional[str] = Field(
        default=None,
        description="ISO 8601 timestamp when the forecast was generated. Required for ETA error computation.",
        examples=["2026-01-01T12:00:00Z"],
    )
    observation_timestamp: Optional[str] = Field(
        default=None,
        description="ISO 8601 timestamp of the new observation. Required for ETA error computation.",
        examples=["2026-01-02T12:00:00Z"],
    )
    spill_origin: Optional[List[float]] = Field(
        default=None,
        description=(
            "[lat, lon] spill origin from Module 7 hindcast (`origin_centroid`). "
            "Required for direction error computation. If omitted, `direction_error_deg` will be null."
        ),
        examples=[[12.45, 72.41]],
    )

    model_config = {
        "json_schema_extra": {
            "examples": [
                {
                    "predicted_polygon": {
                        "type": "Polygon",
                        "coordinates": [[[72.0, 12.0], [72.3, 12.0], [72.3, 12.3], [72.0, 12.3], [72.0, 12.0]]],
                    },
                    "observed_polygon": {
                        "type": "Polygon",
                        "coordinates": [[[72.05, 12.05], [72.35, 12.05], [72.35, 12.35], [72.05, 12.35], [72.05, 12.05]]],
                    },
                    "predicted_horizon_hours": 24.0,
                    "prediction_made_timestamp": "2026-01-01T12:00:00Z",
                    "observation_timestamp": "2026-01-02T12:00:00Z",
                    "spill_origin": [12.45, 72.41],
                }
            ]
        }
    }


class Module15Response(BaseModel):
    data_type: str = "FEEDBACK"
    iou: float
    centroid_error_km: float
    area_error_km2: float
    area_error_fraction: float
    direction_error_deg: Optional[float]
    eta_error_hours: Optional[float]
    recalibration_factor: float
    recalibration_interpretation: str
    disclaimer: str


# ──────────────────────────────────────────────────────────────────────────────
# Full Pipeline (extended)
# ──────────────────────────────────────────────────────────────────────────────

class PipelineRequest(BaseModel):
    scene_id: str = Field(default="SCENE_001", examples=["SCENE_001"])
    config_path: str = Field(default="configs/config.yaml")
    include_modules_11_15: bool = Field(
        default=False,
        description=(
            "If True, appends M11 (Impact), M12 (Priority), M13 (Resource Optimization) "
            "to the pipeline result after M10. M14 and M15 are standalone endpoints only."
        ),
    )


class PipelineResponse(BaseModel):
    scene_id: str
    timestamp: str
    mode: str
    bbox: List[float]
    spill: Dict[str, Any]
    ships_observed: List[Dict[str, Any]]
    sensor_fusion: Dict[str, Any]
    ais_matching: Dict[str, Any]
    spill_origin: Dict[str, Any]
    vessel_attribution: Dict[str, Any]
    spill_forecast: Dict[str, Any]
    uncertainty: Dict[str, Any]
    data_sources: Dict[str, Any]
    # Optional M11-M13 fields — present only when include_modules_11_15=True
    impact: Optional[Dict[str, Any]] = None
    priority: Optional[Dict[str, Any]] = None
    resource_optimization: Optional[Dict[str, Any]] = None


# ──────────────────────────────────────────────────────────────────────────────
# Health
# ──────────────────────────────────────────────────────────────────────────────

class HealthResponse(BaseModel):
    status: str
    service: str
    mode: str
    version: str
    modules: Dict[str, str]


# ──────────────────────────────────────────────────────────────────────────────
# Module 16 — Explainability / Evidence Graph
# ──────────────────────────────────────────────────────────────────────────────

class Module16Request(BaseModel):
    """Request body for Module 16 — Evidence Graph / Explainability."""
    scene_id: str = Field(
        default="SCENE_001",
        description="Scene identifier. Must match a mock dataset scene (e.g. SCENE_001).",
        examples=["SCENE_001"],
    )
    config_path: str = Field(
        default="configs/config.yaml",
        description="Path to the YAML configuration file (relative to project root).",
    )


class EvidenceNode(BaseModel):
    """A single evidence node in the evidence graph."""
    id: str = Field(description="Unique node identifier.")
    type: str = Field(description="Node type (e.g. spill_detection, vessel_attribution).")
    source_module: str = Field(description="Module that produced this evidence (e.g. M2).")
    provenance: str = Field(description="Data provenance: OBSERVED / INFERRED / SIMULATED / FEEDBACK.")
    status: str = Field(description="Node status (positive / negative / verified / uncertain / simulated / feedback).")
    description: str = Field(default="", description="Human-readable description of this evidence node.")
    confidence: Optional[float] = Field(default=None, description="Confidence value if applicable (0–1).")
    evidence: Dict[str, Any] = Field(default_factory=dict, description="Supporting evidence key-value pairs.")


class EvidenceEdge(BaseModel):
    """A directed edge between two evidence nodes."""
    from_: str = Field(alias="from", description="Source node ID.")
    to: str = Field(description="Target node ID.")
    relationship: str = Field(description="Relationship type (e.g. supports, corroborates, feeds_into).")

    model_config = {"populate_by_name": True}


class Explanation(BaseModel):
    """A natural-language explanation for an important system decision."""
    decision: str = Field(description="The decision being explained (e.g. vessel_attribution).")
    source_modules: List[str] = Field(description="Modules contributing to this decision.")
    provenance: str = Field(description="Provenance of the supporting evidence.")
    explanation: str = Field(description="Human-readable explanation text.")


class Module16Response(BaseModel):
    scene_id: str
    data_type: str = "SIMULATED"
    incident: Dict[str, Any]
    evidence_nodes: List[EvidenceNode]
    evidence_edges: List[EvidenceEdge]
    explanations: List[Explanation]
    provenance_summary: Dict[str, int]
    disclaimer: str


# ──────────────────────────────────────────────────────────────────────────────
# Module 17 — Action Recommendation / Decision Support
# ──────────────────────────────────────────────────────────────────────────────

class Module17Request(BaseModel):
    """Request body for Module 17 — Action Recommendation."""
    scene_id: str = Field(
        default="SCENE_001",
        description="Scene identifier. Must match a mock dataset scene (e.g. SCENE_001).",
        examples=["SCENE_001"],
    )
    config_path: str = Field(
        default="configs/config.yaml",
        description="Path to the YAML configuration file (relative to project root).",
    )


class RecommendationSummary(BaseModel):
    """Top-level recommendation summary."""
    action: str = Field(
        description=(
            "Recommended action category. One of: "
            "MONITOR, VERIFY, INVESTIGATE, DEPLOY_RESOURCES, URGENT_RESPONSE, ESCALATE."
        )
    )
    priority: str = Field(description="Urgency label from Module 12.")
    urgency_score: float = Field(description="Priority score (0–100) from Module 12.")
    confidence: float = Field(description="Composite recommendation confidence (0–1).")


class RecommendedAction(BaseModel):
    """A specific action step to undertake."""
    action: str = Field(description="Action description.")
    target: Optional[str] = Field(default=None, description="Target asset or zone.")
    resource_type: Optional[str] = Field(default=None, description="Resource type involved.")
    estimated_arrival_hours: Optional[float] = Field(
        default=None, description="Estimated arrival hours."
    )
    reason: str = Field(description="Reason for this action.")
    source_module: str = Field(description="Module that provided the basis for this action.")


class VerificationAction(BaseModel):
    """A verification step recommended before committing resources."""
    action: str = Field(description="Verification action description.")
    reason: str = Field(description="Why verification is recommended.")
    source_module: str = Field(description="Module providing the basis.")


class InvestigationCandidate(BaseModel):
    vessel_name: str
    mmsi: int
    attribution_score: float

class VesselInvestigationRec(BaseModel):
    """Vessel investigation recommendation."""
    recommended: bool = Field(description="Whether vessel investigation is recommended.")
    top_candidate: Optional[InvestigationCandidate] = Field(
        default=None, description="Top attribution candidate if available."
    )
    reason: str = Field(description="Reason for or against investigation.")


class WhatIfSummaryRec(BaseModel):
    """Summary of the what-if scenario recommendation."""
    recommended_scenario: str
    coverage_fraction: float
    estimated_impact_reduction: float
    optimized_coverage_fraction: float
    reason: str


class Module17Response(BaseModel):
    scene_id: str
    data_type: str = "SIMULATED"
    recommendation: RecommendationSummary
    reasoning: List[str]
    recommended_actions: List[RecommendedAction]
    verification_actions: List[VerificationAction]
    vessel_investigation: VesselInvestigationRec
    evidence_summary: List[str]
    whatif_summary: Optional[WhatIfSummaryRec] = None
    disclaimer: str


# ──────────────────────────────────────────────────────────────────────────────
# Extended Pipeline — supports include_modules_16_17
# ──────────────────────────────────────────────────────────────────────────────

class PipelineRequestExtended(BaseModel):
    """Extended pipeline request supporting M16/M17."""
    scene_id: str = Field(default="SCENE_001", examples=["SCENE_001"])
    config_path: str = Field(default="configs/config.yaml")
    include_modules_11_15: bool = Field(
        default=False,
        description=(
            "If True, appends M11 (Impact), M12 (Priority), M13 (Resource Optimization) "
            "to the pipeline result after M10. M14 and M15 are standalone endpoints only."
        ),
    )
    include_modules_16_17: bool = Field(
        default=False,
        description=(
            "If True, additionally runs M16 (Explainability/Evidence Graph) and "
            "M17 (Action Recommendation). Implies M11–M13 are also run. "
            "M14 and M15 remain standalone endpoints only."
        ),
    )

