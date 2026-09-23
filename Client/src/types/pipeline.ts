import { DataProvenance } from './provenance';
import { GeoJSONPolygon, HealthResponse } from './api';

export type { GeoJSONPolygon, HealthResponse };

// Module 1: Data Processing
export interface Module1Response {
  scene_id: string;
  mode: string;
  timestamp: string;
  bbox: number[];
  has_optical: boolean;
  features: Record<string, any>;
  sar_shape: number[];
  optical_shape?: number[] | null;
  ais_record_count: number;
  ocean_data_keys: string[];
  geographic_layer_keys: string[];
}

// Module 2: Spill Polygon & Detection
export interface SpillPolygon {
  slick_id: string;
  mean_probability: number;
  shape_features: Record<string, number>;
  geometry: GeoJSONPolygon;
}

export interface Module2Response {
  scene_id: string;
  spill_detected: boolean;
  spill_probability: number;
  spill_area_km2: number;
  slicks_found: number;
  polygons: SpillPolygon[];
}

// Module 3: Sensor Fusion
export interface SensorContributions {
  sar_contribution: number;
  optical_contribution: number;
  environmental_contribution: number;
  note: string;
}

export interface Module3Response {
  scene_id: string;
  spill_probability: number;
  has_optical_used: boolean;
  sensor_contributions: SensorContributions;
}

// Module 4: Confidence & Look-Alike
export interface ConfidenceFeatures {
  model_probability: number;
  sar_texture_score: number;
  shape_score: number;
  optical_agreement: number;
  wind_condition: number;
  wave_condition: number;
  temporal_consistency: number;
  lookalike_probability: number;
}

export interface Module4Response {
  scene_id: string;
  oil_probability: number;
  confidence: number;
  lookalike_probability: number;
  verification_required: boolean;
  verification_state: string;
  feature_vector: ConfidenceFeatures;
}

// Module 5: Ship Detection
export interface ShipDetection {
  ship_id: string;
  mode: string;
  lat: number;
  lon: number;
  confidence: number;
  pixel_center: number[];
  pixel_bbox: number[];
}

export interface Module5Response {
  scene_id: string;
  ship_count: number;
  ships: ShipDetection[];
}

// Module 6: AIS Match
export interface AISMatchResult {
  satellite_ship_id: string;
  mmsi?: number | null;
  physical_match: boolean;
  lat: number;
  lon: number;
  match_distance_km?: number | null;
  time_difference_minutes?: number | null;
  ais_gap_minutes: number;
  position_error_km?: number | null;
  trajectory_score: number;
  anomaly_score: number;
  status: string;
  note: string;
}

export interface Module6Response {
  scene_id: string;
  data_type: string;
  matched_count: number;
  possible_match_count: number;
  unmatched_count: number;
  anomalies_count: number;
  matched: AISMatchResult[];
  possible_matches: AISMatchResult[];
  unmatched: AISMatchResult[];
  anomalies: AISMatchResult[];
}

// Module 7: Hindcast
export interface OriginZone {
  zone_id: string;
  center_lat: number;
  center_lon: number;
  radius_km: number;
  probability: number;
}

export interface ReleaseTimeWindow {
  start: string;
  end: string;
  historical_lookback_hours: number;
}

export interface Module7Response {
  scene_id: string;
  data_type: string;
  origin_centroid: number[]; // [lat, lon]
  top_origin_zones: OriginZone[];
  estimated_release_time: ReleaseTimeWindow;
  particle_count: number;
  backward_trajectory?: [number, number][];
  trajectory_snapshots?: Record<string, { offset_hours: number; mean_coords: [number, number]; particles: [number, number][] }>;
}

// Module 8: Vessel Attribution
export interface AttributionEvidence {
  origin_distance: number;
  time_match: number;
  trajectory: number;
  physical_match: number;
  ais_gap: number;
  behavior_anomaly: number;
  data_quality: number;
}

export interface RankedVesselCandidate {
  mmsi: number;
  vessel_name: string;
  attribution_score: number;
  min_origin_distance_km: number;
  evidence: AttributionEvidence;
  rank: number;
  explanation: string;
  lat?: number;
  lon?: number;
  speed_knots?: number;
  course_deg?: number;
  imo?: string;
  flag?: string;
  vessel_type?: string;
  risk_level?: string;
  historical_track?: [number, number][];
}

export interface Module8Response {
  scene_id: string;
  data_type: string;
  disclaimer: string;
  ranked_candidates: RankedVesselCandidate[];
}

// Module 9: Forward Forecast
export interface ForecastHorizon {
  horizon_hours: number;
  center_coords: number[];
  particle_count: number;
  predicted_polygon?: GeoJSONPolygon | Record<string, any> | null;
}

export interface Module9Response {
  scene_id: string;
  data_type: string;
  particle_count: number;
  horizons: Record<string, ForecastHorizon>;
  forward_trajectory?: [number, number][];
}

// Module 10: Uncertainty
export interface UncertaintyAsset {
  asset: string;
  asset_type: string;
  impact_probability: number;
  eta_hours: number[];
  confidence: number;
}

export interface Module10Response {
  scene_id: string;
  data_type: string;
  num_simulations: number;
  overall_prediction_confidence: number;
  assets: UncertaintyAsset[];
  disclaimer: string;
}

// Module 11: Impact Prediction
export interface AssetImpactDetail {
  asset: string;
  asset_type: string;
  sensitivity: number;
  impact_probability: number;
  eta_hours: number[];
  time_to_impact_factor: number;
  asset_impact_score: number;
  impact_level: string;
}

export interface Module11Response {
  scene_id: string;
  data_type: string;
  mode: string;
  spill_severity_score: number;
  overall_impact_score: number;
  overall_impact_level: string;
  assets: AssetImpactDetail[];
  disclaimer: string;
}

// Module 12: Priority
export interface PriorityFactor {
  value: number;
  weight: number;
  weighted_contribution: number;
}

export interface Module12Response {
  scene_id: string;
  data_type: string;
  priority_score: number;
  urgency_label: string;
  factor_contributions: Record<string, PriorityFactor>;
  weights_used: Record<string, number>;
  disclaimer: string;
}

// Module 13: Resource Optimization
export interface ResourceAllocation {
  resource_id: string;
  resource_type: string;
  target_asset: string;
  target_coords: number[];
  estimated_arrival_hours: number;
  deployment_score: number;
  coverage_area_km2: number;
}

export interface UnallocatedResource {
  resource_type: string;
  count: number;
}

export interface Module13Response {
  scene_id: string;
  data_type: string;
  optimization_method: string;
  total_resources_available: number;
  total_resources_deployed: number;
  assets_targeted: number;
  estimated_coverage_fraction: number;
  allocations: ResourceAllocation[];
  unallocated_resources: UnallocatedResource[];
  disclaimer: string;
}

// Module 14: What-If Simulator
export interface ScenarioResult {
  label: string;
  coverage_fraction: number;
  assets_covered: number;
  estimated_impact_reduction: number;
  total_deployment_cost_index: number;
  additional_resources_needed: number;
}

export interface Module14Response {
  scene_id: string;
  data_type: string;
  reference_priority_score: number;
  scenarios: Record<string, ScenarioResult>;
  recommended_scenario: string;
  disclaimer: string;
}

// Module 15: Prediction vs Reality Feedback
export interface Module15Response {
  data_type: string;
  iou: number;
  centroid_error_km: number;
  area_error_km2: number;
  area_error_fraction: number;
  direction_error_deg?: number | null;
  eta_error_hours?: number | null;
  recalibration_factor: number;
  recalibration_interpretation: string;
  disclaimer: string;
}

// Module 16: Evidence Graph
export interface EvidenceNode {
  id: string;
  type: string;
  source_module: string;
  provenance: DataProvenance;
  status: string;
  description: string;
  confidence?: number | null;
  evidence: Record<string, any>;
}

export interface EvidenceEdge {
  from: string;
  to: string;
  relationship: string;
}

export interface Explanation {
  decision: string;
  source_modules: string[];
  provenance: string;
  explanation: string;
}

export interface Module16Response {
  scene_id: string;
  data_type: string;
  incident: Record<string, any>;
  evidence_nodes: EvidenceNode[];
  evidence_edges: EvidenceEdge[];
  explanations: Explanation[];
  provenance_summary: Record<string, number>;
  disclaimer: string;
}

// Module 17: Recommendation
export interface RecommendationSummary {
  action: 'MONITOR' | 'VERIFY' | 'INVESTIGATE' | 'DEPLOY_RESOURCES' | 'URGENT_RESPONSE' | 'ESCALATE';
  priority: string;
  urgency_score: number;
  confidence: number;
}

export interface RecommendedAction {
  action: string;
  target?: string | null;
  resource_type?: string | null;
  estimated_arrival_hours?: number | null;
  reason: string;
  source_module: string;
}

export interface VerificationAction {
  action: string;
  reason: string;
  source_module: string;
}

export interface InvestigationCandidate {
  vessel_name: string;
  mmsi: number;
  attribution_score: number;
}

export interface VesselInvestigationRec {
  recommended: boolean;
  top_candidate?: InvestigationCandidate | null;
  reason: string;
}

export interface WhatIfSummaryRec {
  recommended_scenario: string;
  coverage_fraction: number;
  estimated_impact_reduction: number;
  optimized_coverage_fraction: number;
  reason: string;
}

export interface Module17Response {
  scene_id: string;
  data_type: string;
  recommendation: RecommendationSummary;
  reasoning: string[];
  recommended_actions: RecommendedAction[];
  verification_actions: VerificationAction[];
  vessel_investigation: VesselInvestigationRec;
  evidence_summary: string[];
  whatif_summary?: WhatIfSummaryRec | null;
  disclaimer: string;
}

// Full Pipeline End-to-End Response
export interface FullPipelineResponse {
  scene_id: string;
  timestamp: string;
  mode: string;
  bbox: number[];
  visuals?: any;
  spill: {
    detected: boolean;
    probability: number;
    area_km2: number;
    slicks_count: number;
    confidence: number;
    lookalike_probability: number;
    verification_state: string;
    verification_required: boolean;
    polygons: SpillPolygon[];
  };
  ships_observed: ShipDetection[];
  sensor_fusion: {
    has_optical: boolean;
    sensor_contributions: SensorContributions;
  };
  ais_matching: {
    data_type: string;
    matched_count: number;
    possible_match_count: number;
    unmatched_count: number;
    anomalies_count: number;
    matched: AISMatchResult[];
    possible_matches: AISMatchResult[];
    unmatched: AISMatchResult[];
    anomalies: AISMatchResult[];
  };
  spill_origin: {
    data_type: string;
    origin_centroid: number[];
    top_origin_zones: OriginZone[];
    estimated_release_time: ReleaseTimeWindow;
    particle_count: number;
  };
  vessel_attribution: {
    data_type: string;
    disclaimer: string;
    ranked_candidates: RankedVesselCandidate[];
  };
  spill_forecast: {
    data_type: string;
    horizons: Record<string, ForecastHorizon>;
  };
  uncertainty: {
    data_type: string;
    num_simulations: number;
    overall_prediction_confidence: number;
    asset_impact: UncertaintyAsset[];
    disclaimer: string;
  };
  data_sources: Record<string, any>;
  // Extended pipeline fields
  impact?: Module11Response | null;
  priority?: Module12Response | null;
  resource_optimization?: Module13Response | null;
  explainability?: Module16Response | null;
  action_recommendation?: Module17Response | null;
}
