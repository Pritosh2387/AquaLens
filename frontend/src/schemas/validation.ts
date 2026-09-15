import { z } from 'zod';

// Shared
export const HealthResponseSchema = z.object({
  status: z.string(),
  service: z.string(),
  mode: z.string(),
  version: z.string(),
  modules: z.record(z.string(), z.string()),
});

export const GeoJSONPolygonSchema = z.object({
  type: z.literal('Polygon'),
  coordinates: z.array(z.array(z.array(z.number()))),
});

export const SceneRequestSchema = z.object({
  scene_id: z.string().default('SCENE_001'),
  config_path: z.string().default('configs/config.yaml'),
});

// Module 1
export const Module1ResponseSchema = z.object({
  scene_id: z.string(),
  mode: z.string(),
  timestamp: z.string(),
  bbox: z.array(z.number()),
  has_optical: z.boolean(),
  features: z.record(z.string(), z.any()),
  sar_shape: z.array(z.number()),
  optical_shape: z.array(z.number()).nullable().optional(),
  ais_record_count: z.number(),
  ocean_data_keys: z.array(z.string()),
  geographic_layer_keys: z.array(z.string()),
});

// Module 2
export const SpillPolygonSchema = z.object({
  slick_id: z.string(),
  mean_probability: z.number(),
  shape_features: z.record(z.string(), z.number()),
  geometry: z.any(),
});

export const Module2ResponseSchema = z.object({
  scene_id: z.string(),
  spill_detected: z.boolean(),
  spill_probability: z.number(),
  spill_area_km2: z.number(),
  slicks_found: z.number(),
  polygons: z.array(SpillPolygonSchema),
});

// Module 3
export const SensorContributionsSchema = z.object({
  sar_contribution: z.number(),
  optical_contribution: z.number(),
  environmental_contribution: z.number(),
  note: z.string(),
});

export const Module3ResponseSchema = z.object({
  scene_id: z.string(),
  spill_probability: z.number(),
  has_optical_used: z.boolean(),
  sensor_contributions: SensorContributionsSchema,
});

// Module 4
export const ConfidenceFeaturesSchema = z.object({
  model_probability: z.number(),
  sar_texture_score: z.number(),
  shape_score: z.number(),
  optical_agreement: z.number(),
  wind_condition: z.number(),
  wave_condition: z.number(),
  temporal_consistency: z.number(),
  lookalike_probability: z.number(),
});

export const Module4ResponseSchema = z.object({
  scene_id: z.string(),
  oil_probability: z.number(),
  confidence: z.number(),
  lookalike_probability: z.number(),
  verification_required: z.boolean(),
  verification_state: z.string(),
  feature_vector: ConfidenceFeaturesSchema,
});

// Module 5
export const ShipDetectionSchema = z.object({
  ship_id: z.string(),
  mode: z.string(),
  lat: z.number(),
  lon: z.number(),
  confidence: z.number(),
  pixel_center: z.array(z.number()),
  pixel_bbox: z.array(z.number()),
});

export const Module5ResponseSchema = z.object({
  scene_id: z.string(),
  ship_count: z.number(),
  ships: z.array(ShipDetectionSchema),
});

// Module 6
export const AISMatchResultSchema = z.object({
  satellite_ship_id: z.string(),
  mmsi: z.number().nullable().optional(),
  physical_match: z.boolean(),
  lat: z.number(),
  lon: z.number(),
  match_distance_km: z.number().nullable().optional(),
  time_difference_minutes: z.number().nullable().optional(),
  ais_gap_minutes: z.number(),
  position_error_km: z.number().nullable().optional(),
  trajectory_score: z.number(),
  anomaly_score: z.number(),
  status: z.string(),
  note: z.string(),
});

export const Module6ResponseSchema = z.object({
  scene_id: z.string(),
  data_type: z.string().default('INFERRED'),
  matched_count: z.number(),
  possible_match_count: z.number(),
  unmatched_count: z.number(),
  anomalies_count: z.number(),
  matched: z.array(AISMatchResultSchema),
  possible_matches: z.array(AISMatchResultSchema),
  unmatched: z.array(AISMatchResultSchema),
  anomalies: z.array(AISMatchResultSchema),
});

// Module 7
export const OriginZoneSchema = z.object({
  zone_id: z.string(),
  center_lat: z.number(),
  center_lon: z.number(),
  radius_km: z.number(),
  probability: z.number(),
});

export const ReleaseTimeWindowSchema = z.object({
  start: z.string(),
  end: z.string(),
  historical_lookback_hours: z.number(),
});

export const Module7ResponseSchema = z.object({
  scene_id: z.string(),
  data_type: z.string().default('INFERRED'),
  origin_centroid: z.array(z.number()),
  top_origin_zones: z.array(OriginZoneSchema),
  estimated_release_time: ReleaseTimeWindowSchema,
  particle_count: z.number(),
});

// Module 8
export const AttributionEvidenceSchema = z.object({
  origin_distance: z.number(),
  time_match: z.number(),
  trajectory: z.number(),
  physical_match: z.number(),
  ais_gap: z.number(),
  behavior_anomaly: z.number(),
  data_quality: z.number(),
});

export const RankedVesselCandidateSchema = z.object({
  mmsi: z.number(),
  vessel_name: z.string(),
  attribution_score: z.number(),
  min_origin_distance_km: z.number(),
  evidence: AttributionEvidenceSchema,
  rank: z.number(),
  explanation: z.string(),
});

export const Module8ResponseSchema = z.object({
  scene_id: z.string(),
  data_type: z.string().default('INFERRED'),
  disclaimer: z.string(),
  ranked_candidates: z.array(RankedVesselCandidateSchema),
});

// Module 9
export const ForecastHorizonSchema = z.object({
  horizon_hours: z.number(),
  center_coords: z.array(z.number()),
  particle_count: z.number(),
  predicted_polygon: z.any().nullable().optional(),
});

export const Module9ResponseSchema = z.object({
  scene_id: z.string(),
  data_type: z.string().default('SIMULATED'),
  particle_count: z.number(),
  horizons: z.record(z.string(), ForecastHorizonSchema),
});

// Module 10
export const UncertaintyAssetSchema = z.object({
  asset: z.string(),
  asset_type: z.string(),
  impact_probability: z.number(),
  eta_hours: z.array(z.number()),
  confidence: z.number(),
});

export const Module10ResponseSchema = z.object({
  scene_id: z.string(),
  data_type: z.string().default('SIMULATED'),
  num_simulations: z.number(),
  overall_prediction_confidence: z.number(),
  assets: z.array(UncertaintyAssetSchema),
  disclaimer: z.string(),
});

// Module 11
export const AssetImpactDetailSchema = z.object({
  asset: z.string(),
  asset_type: z.string(),
  sensitivity: z.number(),
  impact_probability: z.number(),
  eta_hours: z.array(z.number()),
  time_to_impact_factor: z.number(),
  asset_impact_score: z.number(),
  impact_level: z.string(),
});

export const Module11ResponseSchema = z.object({
  scene_id: z.string(),
  data_type: z.string().default('SIMULATED'),
  mode: z.string(),
  spill_severity_score: z.number(),
  overall_impact_score: z.number(),
  overall_impact_level: z.string(),
  assets: z.array(AssetImpactDetailSchema),
  disclaimer: z.string(),
});

// Module 12
export const PriorityFactorSchema = z.object({
  value: z.number(),
  weight: z.number(),
  weighted_contribution: z.number(),
});

export const Module12ResponseSchema = z.object({
  scene_id: z.string(),
  data_type: z.string().default('SIMULATED'),
  priority_score: z.number(),
  urgency_label: z.string(),
  factor_contributions: z.record(z.string(), PriorityFactorSchema),
  weights_used: z.record(z.string(), z.number()),
  disclaimer: z.string(),
});

// Module 13
export const ResourceAllocationSchema = z.object({
  resource_id: z.string(),
  resource_type: z.string(),
  target_asset: z.string(),
  target_coords: z.array(z.number()),
  estimated_arrival_hours: z.number(),
  deployment_score: z.number(),
  coverage_area_km2: z.number(),
});

export const UnallocatedResourceSchema = z.object({
  resource_type: z.string(),
  count: z.number(),
});

export const Module13ResponseSchema = z.object({
  scene_id: z.string(),
  data_type: z.string().default('SIMULATED'),
  optimization_method: z.string(),
  total_resources_available: z.number(),
  total_resources_deployed: z.number(),
  assets_targeted: z.number(),
  estimated_coverage_fraction: z.number(),
  allocations: z.array(ResourceAllocationSchema),
  unallocated_resources: z.array(UnallocatedResourceSchema),
  disclaimer: z.string(),
});

// Module 14
export const ScenarioResultSchema = z.object({
  label: z.string(),
  coverage_fraction: z.number(),
  assets_covered: z.number(),
  estimated_impact_reduction: z.number(),
  total_deployment_cost_index: z.number(),
  additional_resources_needed: z.number(),
});

export const Module14ResponseSchema = z.object({
  scene_id: z.string(),
  data_type: z.string().default('SIMULATED'),
  reference_priority_score: z.number(),
  scenarios: z.record(z.string(), ScenarioResultSchema),
  recommended_scenario: z.string(),
  disclaimer: z.string(),
});

// Module 15
export const Module15ResponseSchema = z.object({
  data_type: z.string().default('FEEDBACK'),
  iou: z.number(),
  centroid_error_km: z.number(),
  area_error_km2: z.number(),
  area_error_fraction: z.number(),
  direction_error_deg: z.number().nullable().optional(),
  eta_error_hours: z.number().nullable().optional(),
  recalibration_factor: z.number(),
  recalibration_interpretation: z.string(),
  disclaimer: z.string(),
});

// Module 16
export const EvidenceNodeSchema = z.object({
  id: z.string(),
  type: z.string(),
  source_module: z.string(),
  provenance: z.enum(['MOCK', 'OBSERVED', 'INFERRED', 'SIMULATED', 'FEEDBACK']),
  status: z.string(),
  description: z.string().default(''),
  confidence: z.number().nullable().optional(),
  evidence: z.record(z.string(), z.any()).default({}),
});

export const EvidenceEdgeSchema = z.object({
  from: z.string(),
  to: z.string(),
  relationship: z.string(),
});

export const ExplanationSchema = z.object({
  decision: z.string(),
  source_modules: z.array(z.string()),
  provenance: z.string(),
  explanation: z.string(),
});

export const Module16ResponseSchema = z.object({
  scene_id: z.string(),
  data_type: z.string().default('SIMULATED'),
  incident: z.record(z.string(), z.any()),
  evidence_nodes: z.array(EvidenceNodeSchema),
  evidence_edges: z.array(EvidenceEdgeSchema),
  explanations: z.array(ExplanationSchema),
  provenance_summary: z.record(z.string(), z.number()),
  disclaimer: z.string(),
});

// Module 17
export const ActionCategorySchema = z.enum([
  'MONITOR',
  'VERIFY',
  'INVESTIGATE',
  'DEPLOY_RESOURCES',
  'URGENT_RESPONSE',
  'ESCALATE',
]);

export const RecommendationSummarySchema = z.object({
  action: ActionCategorySchema,
  priority: z.string(),
  urgency_score: z.number(),
  confidence: z.number(),
});

export const RecommendedActionSchema = z.object({
  action: z.string(),
  target: z.string().nullable().optional(),
  resource_type: z.string().nullable().optional(),
  estimated_arrival_hours: z.number().nullable().optional(),
  reason: z.string(),
  source_module: z.string(),
});

export const VerificationActionSchema = z.object({
  action: z.string(),
  reason: z.string(),
  source_module: z.string(),
});

export const InvestigationCandidateSchema = z.object({
  vessel_name: z.string(),
  mmsi: z.number(),
  attribution_score: z.number(),
});

export const VesselInvestigationRecSchema = z.object({
  recommended: z.boolean(),
  top_candidate: InvestigationCandidateSchema.nullable().optional(),
  reason: z.string(),
});

export const WhatIfSummaryRecSchema = z.object({
  recommended_scenario: z.string(),
  coverage_fraction: z.number(),
  estimated_impact_reduction: z.number(),
  optimized_coverage_fraction: z.number(),
  reason: z.string(),
});

export const Module17ResponseSchema = z.object({
  scene_id: z.string(),
  data_type: z.string().default('SIMULATED'),
  recommendation: RecommendationSummarySchema,
  reasoning: z.array(z.string()),
  recommended_actions: z.array(RecommendedActionSchema),
  verification_actions: z.array(VerificationActionSchema),
  vessel_investigation: VesselInvestigationRecSchema,
  evidence_summary: z.array(z.string()),
  whatif_summary: WhatIfSummaryRecSchema.nullable().optional(),
  disclaimer: z.string(),
});

// Full Pipeline Schema
export const FullPipelineResponseSchema = z.object({
  scene_id: z.string(),
  timestamp: z.string(),
  mode: z.string(),
  bbox: z.array(z.number()),
  spill: z.object({
    detected: z.boolean(),
    probability: z.number(),
    area_km2: z.number(),
    slicks_count: z.number(),
    confidence: z.number(),
    lookalike_probability: z.number(),
    verification_state: z.string(),
    verification_required: z.boolean(),
    polygons: z.array(SpillPolygonSchema).optional().default([]),
  }),
  ships_observed: z.array(ShipDetectionSchema),
  sensor_fusion: z.object({
    has_optical: z.boolean(),
    sensor_contributions: SensorContributionsSchema,
  }),
  ais_matching: Module6ResponseSchema,
  spill_origin: Module7ResponseSchema,
  vessel_attribution: Module8ResponseSchema,
  spill_forecast: Module9ResponseSchema,
  uncertainty: z.object({
    data_type: z.string().default('SIMULATED'),
    num_simulations: z.number(),
    overall_prediction_confidence: z.number(),
    asset_impact: z.array(UncertaintyAssetSchema),
    disclaimer: z.string(),
  }),
  data_sources: z.record(z.string(), z.any()),
  impact: Module11ResponseSchema.nullable().optional(),
  priority: Module12ResponseSchema.nullable().optional(),
  resource_optimization: Module13ResponseSchema.nullable().optional(),
  explainability: Module16ResponseSchema.nullable().optional(),
  action_recommendation: Module17ResponseSchema.nullable().optional(),
});

/**
 * Validates backend data with Zod safely without crashing the dashboard.
 * If validation fails in dev mode, logs descriptive warning and returns data as-is with error info.
 */
export function safeValidate<T>(
  schema: z.ZodType<T>,
  data: unknown,
  moduleName = 'API'
): { data: T; error?: z.ZodError } {
  const result = schema.safeParse(data);
  if (result.success) {
    return { data: result.data };
  } else {
    if (import.meta.env.DEV) {
      console.warn(`[Zod Validation Warning] ${moduleName} payload did not match expected schema:`, {
        error: result.error.format(),
        rawPayload: data,
      });
    }
    // Return data cast to T so dashboard never crashes
    return { data: data as T, error: result.error };
  }
}
