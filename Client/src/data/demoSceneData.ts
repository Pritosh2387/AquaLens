/**
 * AquaLens Scene-Aware Demo Data
 *
 * Returns ALL scene-specific data (map polygons, vessels, metocean,
 * forecast horizons, impact summary, impact assets, resources, what-if
 * scenarios) as a single object per scene.
 *
 * Usage: const data = getSceneData(selectedSceneId);
 */

import type { ImpactAsset } from './demoImpact';
import type { DemoVessel } from './demoVessels';
import type { WhatIfScenario } from './demoResources';

// ---------------------------------------------------------------------------
// SCENE 1 — Arabian Sea (AL-2026-0915-IND-047) – center: 15.82N, 68.74E
// ---------------------------------------------------------------------------
const SCENE1_MAP = {
  spillPolygons: [
    {
      type: 'Feature' as const,
      properties: { slick_id: 'SLICK-AQL-047-A', mean_probability: 0.94, area_km2: 42.7, label: 'DETECTED SPILL', confidence: 'HIGH' },
      geometry: {
        type: 'Polygon' as const,
        coordinates: [[
          [68.700, 15.800], [68.714, 15.792], [68.728, 15.788], [68.742, 15.790],
          [68.758, 15.796], [68.772, 15.804], [68.780, 15.812], [68.784, 15.822],
          [68.782, 15.834], [68.776, 15.844], [68.766, 15.852], [68.752, 15.856],
          [68.736, 15.854], [68.720, 15.848], [68.706, 15.838], [68.696, 15.826],
          [68.692, 15.814], [68.695, 15.806], [68.700, 15.800],
        ]],
      },
    },
    {
      type: 'Feature' as const,
      properties: { slick_id: 'SLICK-AQL-047-CORE', mean_probability: 0.97, area_km2: 18.3, label: 'HIGH CONFIDENCE ZONE', confidence: 'VERY_HIGH' },
      geometry: {
        type: 'Polygon' as const,
        coordinates: [[
          [68.718, 15.806], [68.730, 15.800], [68.742, 15.799], [68.754, 15.803],
          [68.762, 15.811], [68.766, 15.820], [68.764, 15.830], [68.756, 15.838],
          [68.744, 15.842], [68.730, 15.840], [68.718, 15.834], [68.711, 15.824],
          [68.711, 15.814], [68.718, 15.806],
        ]],
      },
    },
  ],
  originZone: { lat: 15.91, lon: 68.58, radiusKm: 4.2, probability: 0.87, label: 'PROBABLE RELEASE POINT' },
  secondaryOriginZones: [
    { lat: 15.88, lon: 68.54, radiusKm: 6.5, probability: 0.61, label: 'ORIGIN ZONE B' },
    { lat: 15.94, lon: 68.62, radiusKm: 5.1, probability: 0.48, label: 'ORIGIN ZONE C' },
  ],
  hindcastTrajectory: [
    [15.820, 68.740], [15.832, 68.728], [15.843, 68.718], [15.852, 68.706],
    [15.862, 68.696], [15.872, 68.684], [15.882, 68.672], [15.893, 68.662],
    [15.904, 68.652], [15.910, 68.580],
  ] as [number, number][],
  forwardTrajectory: [
    [15.820, 68.740], [15.808, 68.756], [15.796, 68.772],
    [15.782, 68.790], [15.768, 68.808], [15.752, 68.828], [15.736, 68.850],
  ] as [number, number][],
  forecast6h: {
    type: 'Feature' as const,
    properties: { horizon: '+6h', area_km2: 89.3, probability: 0.88 },
    geometry: { type: 'Polygon' as const, coordinates: [[[68.710, 15.782],[68.726, 15.774],[68.742, 15.769],[68.760, 15.771],[68.778, 15.777],[68.796, 15.785],[68.808, 15.795],[68.814, 15.807],[68.812, 15.821],[68.804, 15.833],[68.790, 15.841],[68.774, 15.845],[68.756, 15.843],[68.736, 15.836],[68.718, 15.824],[68.706, 15.810],[68.702, 15.796],[68.706, 15.787],[68.710, 15.782]]] },
  },
  forecast12h: {
    type: 'Feature' as const,
    properties: { horizon: '+12h', area_km2: 156.8, probability: 0.79 },
    geometry: { type: 'Polygon' as const, coordinates: [[[68.724, 15.762],[68.742, 15.752],[68.762, 15.746],[68.784, 15.749],[68.806, 15.756],[68.826, 15.766],[68.840, 15.778],[68.848, 15.792],[68.846, 15.808],[68.836, 15.822],[68.820, 15.832],[68.800, 15.836],[68.778, 15.833],[68.754, 15.824],[68.734, 15.812],[68.720, 15.796],[68.714, 15.778],[68.718, 15.767],[68.724, 15.762]]] },
  },
  forecast24h: {
    type: 'Feature' as const,
    properties: { horizon: '+24h', area_km2: 312.4, probability: 0.64 },
    geometry: { type: 'Polygon' as const, coordinates: [[[68.742, 15.740],[68.764, 15.728],[68.790, 15.720],[68.818, 15.723],[68.846, 15.731],[68.870, 15.743],[68.888, 15.758],[68.898, 15.774],[68.896, 15.792],[68.882, 15.808],[68.862, 15.820],[68.838, 15.826],[68.812, 15.822],[68.784, 15.812],[68.760, 15.798],[68.742, 15.780],[68.734, 15.760],[68.738, 15.748],[68.742, 15.740]]] },
  },
  impactZoneHigh: {
    type: 'Feature' as const,
    properties: { label: 'HIGH RISK ZONE', riskLevel: 'HIGH', impactProbability: 0.78 },
    geometry: { type: 'Polygon' as const, coordinates: [[[68.800, 15.680],[68.840, 15.668],[68.876, 15.674],[68.900, 15.690],[68.908, 15.708],[68.898, 15.726],[68.876, 15.736],[68.846, 15.738],[68.818, 15.730],[68.800, 15.714],[68.796, 15.696],[68.800, 15.680]]] },
  },
  uncertaintyZone: {
    type: 'Feature' as const,
    properties: { label: 'FORECAST UNCERTAINTY', probability: 0.45 },
    geometry: { type: 'Polygon' as const, coordinates: [[[68.720, 15.710],[68.760, 15.695],[68.800, 15.690],[68.840, 15.695],[68.875, 15.706],[68.906, 15.722],[68.924, 15.740],[68.932, 15.762],[68.928, 15.785],[68.912, 15.806],[68.888, 15.822],[68.856, 15.832],[68.820, 15.835],[68.782, 15.828],[68.748, 15.814],[68.722, 15.796],[68.706, 15.774],[68.704, 15.748],[68.710, 15.727],[68.720, 15.710]]] },
  },
  responseZone1: {
    type: 'Feature' as const,
    properties: { label: 'RESPONSE ZONE R-1', priority: 'PRIMARY', resources: '2 Skimmers, 2 Booms' },
    geometry: { type: 'Polygon' as const, coordinates: [[[68.740, 15.790],[68.758, 15.784],[68.770, 15.790],[68.768, 15.800],[68.754, 15.808],[68.740, 15.802],[68.736, 15.794],[68.740, 15.790]]] },
  },
  responseZone2: {
    type: 'Feature' as const,
    properties: { label: 'RESPONSE ZONE R-2', priority: 'SECONDARY', resources: '1 Boom' },
    geometry: { type: 'Polygon' as const, coordinates: [[[68.770, 15.762],[68.786, 15.756],[68.796, 15.762],[68.794, 15.772],[68.780, 15.778],[68.768, 15.772],[68.766, 15.764],[68.770, 15.762]]] },
  },
  predictedPolygon: {
    type: 'Feature' as const,
    properties: { label: 'PREDICTED', area_km2: 46.1 },
    geometry: { type: 'Polygon' as const, coordinates: [[[68.698, 15.798],[68.712, 15.790],[68.726, 15.786],[68.742, 15.788],[68.758, 15.794],[68.772, 15.803],[68.780, 15.813],[68.782, 15.825],[68.778, 15.837],[68.766, 15.847],[68.750, 15.851],[68.732, 15.849],[68.716, 15.841],[68.702, 15.830],[68.694, 15.818],[68.692, 15.806],[68.696, 15.800],[68.698, 15.798]]] },
  },
};

const SCENE1_METOCEAN = {
  currentSpeedMs: 0.82, currentDirectionDeg: 132, currentDirectionLabel: 'SE (132°)',
  windSpeedMs: 3.4, windSpeedKmh: 12.4, windDirectionDeg: 135, windDirectionLabel: 'SE (135°)',
  waveHeightM: 1.2, seaTempC: 28.6, salinityPsu: 35.8,
};

const SCENE1_FORECAST_HORIZONS = [
  { key: '0h', label: 'Current (0h)', timestamp: '2026-09-15 03:20 UTC', area_km2: 42.7, centroid: { lat: 15.820, lon: 68.740 }, opacity: 1.0, color: '#dc2626', fillColor: '#b91c1c', description: 'Detected spill extent at satellite acquisition time.' },
  { key: '6h', label: '+6 Hours', timestamp: '2026-09-15 09:20 UTC', area_km2: 89.3, centroid: { lat: 15.797, lon: 68.763 }, opacity: 0.82, color: '#ea580c', fillColor: '#c2410c', description: 'Spill expanding SE at 0.82 m/s.', coastalProximityKm: 68.4 },
  { key: '12h', label: '+12 Hours', timestamp: '2026-09-15 15:20 UTC', area_km2: 156.8, centroid: { lat: 15.772, lon: 68.788 }, opacity: 0.65, color: '#d97706', fillColor: '#b45309', description: 'Significant expansion. Sheen reaches 12h extent.', coastalProximityKm: 52.1 },
  { key: '24h', label: '+24 Hours', timestamp: '2026-09-16 03:20 UTC', area_km2: 312.4, centroid: { lat: 15.740, lon: 68.816 }, opacity: 0.48, color: '#7c3aed', fillColor: '#6d28d9', description: 'HIGH RISK — entering coastal waters.', coastalProximityKm: 31.8 },
  { key: '48h', label: '+48 Hours', timestamp: '2026-09-17 03:20 UTC', area_km2: 485.2, centroid: { lat: 15.694, lon: 68.862 }, opacity: 0.32, color: '#0e7490', fillColor: '#0891b2', description: 'Critical shore approach.', coastalProximityKm: 14.2 },
  { key: '72h', label: '+72 Hours', timestamp: '2026-09-18 03:20 UTC', area_km2: 620.0, centroid: { lat: 15.648, lon: 68.908 }, opacity: 0.20, color: '#065f46', fillColor: '#047857', description: 'Shore landfall expected.', coastalProximityKm: 3.1 },
];

const SCENE1_IMPACT_SUMMARY = {
  ecologicalRisk: 0.78, fisheriesRisk: 0.63, populationRisk: 0.41, economicRisk: 0.55,
  overallSeverity: 'HIGH', totalAffectedAreaKm2: 183.4,
  estimatedEconomicLossMillion: 4.2, populationAtRisk: 45000, fisheryBanAreaKm2: 68.2,
};

const SCENE1_IMPACT_ASSETS: ImpactAsset[] = [
  { name: 'Lakshadweep MPA', lat: 15.58, lon: 68.91, type: 'Marine Protected Area', riskScore: 0.84, impactProbability: 0.78, etaHours: 22, sensitivity: 'CRITICAL', description: 'UNESCO-recognized marine protected area. Coral reef ecosystem. Extremely sensitive to oil contamination.' },
  { name: 'Coastal Fisheries Zone', lat: 15.70, lon: 68.86, type: 'Fisheries Zone', riskScore: 0.71, impactProbability: 0.63, etaHours: 16, sensitivity: 'HIGH', description: 'Primary fishing ground supporting 12,000+ local fishermen. Seasonal spawning zone.' },
  { name: 'Goa North Coast', lat: 15.63, lon: 68.98, type: 'Population Zone', riskScore: 0.55, impactProbability: 0.41, etaHours: 28, sensitivity: 'HIGH', description: 'Coastal population of ~45,000. Tourism-dependent economy.' },
  { name: 'Marmagao Port', lat: 15.42, lon: 69.12, type: 'Port / Infrastructure', riskScore: 0.48, impactProbability: 0.38, etaHours: 36, sensitivity: 'MEDIUM', description: 'Major commercial port. Potential shipping disruption.' },
  { name: 'Seabird Breeding Area', lat: 15.76, lon: 68.78, type: 'Ecological Zone', riskScore: 0.66, impactProbability: 0.58, etaHours: 12, sensitivity: 'HIGH', description: 'Active breeding colony of greater crested terns. Critical nesting season.' },
];

const SCENE1_VESSELS: DemoVessel[] = [
  { rank: 1, vessel_name: 'MV Ocean Crest', mmsi: 636019847, imo: '9482031', vessel_type: 'Crude Oil Tanker', flag: 'Liberia', lat: 15.908, lon: 68.577, attribution_score: 0.91, risk_level: 'HIGH', aisEvidence: 'Strong', sarEvidence: 'Strong', trajectory: 'High', isDark: true, aisGapStart: '2026-09-14 19:08 UTC', aisGapDuration: '3h 22m', positionErrorKm: 0.9, originProximityKm: 1.4, timingDeltaHours: 0.6, anomalyScore: 0.93, speed_knots: 4.2, heading_deg: 138, status: 'PRIMARY SUSPECT', explanation: 'AIS gap of 3h 22m centered on release window. SAR-detected dark vessel at origin.', historical_track: [[16.08, 68.42],[16.02, 68.46],[15.97, 68.50],[15.94, 68.54],[15.91, 68.58],[15.87, 68.62],[15.82, 68.68],[15.79, 68.71]] },
  { rank: 2, vessel_name: 'MT Nalini Star', mmsi: 419000312, imo: '9374821', vessel_type: 'Product Tanker', flag: 'India', lat: 15.87, lon: 68.63, attribution_score: 0.74, risk_level: 'HIGH', aisEvidence: 'Medium', sarEvidence: 'Strong', trajectory: 'Medium', isDark: false, aisGapStart: '2026-09-14 20:30 UTC', aisGapDuration: '1h 10m', positionErrorKm: 2.8, originProximityKm: 3.9, timingDeltaHours: 2.1, anomalyScore: 0.68, speed_knots: 9.1, heading_deg: 145, status: 'CANDIDATE', explanation: 'Brief AIS gap overlaps release window edge. SAR shows vessel silhouette near spill vicinity.', historical_track: [[16.05, 68.52],[15.99, 68.56],[15.93, 68.60],[15.87, 68.63],[15.82, 68.69]] },
  { rank: 3, vessel_name: 'MV Dharitri', mmsi: 419000587, imo: '9218743', vessel_type: 'General Cargo', flag: 'India', lat: 15.74, lon: 68.80, attribution_score: 0.61, risk_level: 'MEDIUM', aisEvidence: 'Strong', sarEvidence: 'Medium', trajectory: 'Medium', isDark: false, aisGapStart: 'N/A', aisGapDuration: '0h 00m', positionErrorKm: 5.2, originProximityKm: 7.1, timingDeltaHours: 4.8, anomalyScore: 0.52, speed_knots: 11.4, heading_deg: 188, status: 'CANDIDATE', explanation: 'Continuous AIS throughout window. 7.1 km from origin. No behavioral anomaly.', historical_track: [[16.10, 68.62],[16.00, 68.66],[15.90, 68.70],[15.80, 68.76],[15.74, 68.80]] },
  { rank: 4, vessel_name: 'MV Sea Leopard', mmsi: 525005241, imo: '9301294', vessel_type: 'Bulk Carrier', flag: 'Indonesia', lat: 15.65, lon: 68.94, attribution_score: 0.38, risk_level: 'LOW', aisEvidence: 'Strong', sarEvidence: 'Weak', trajectory: 'Low', isDark: false, aisGapStart: 'N/A', aisGapDuration: '0h 00m', positionErrorKm: 11.4, originProximityKm: 14.6, timingDeltaHours: 7.2, anomalyScore: 0.28, speed_knots: 13.8, heading_deg: 160, status: 'LOW PROBABILITY', explanation: 'Full AIS track. No SAR match. Too far from origin.', historical_track: [[16.00, 68.80],[15.88, 68.86],[15.76, 68.90],[15.65, 68.94]] },
  { rank: 5, vessel_name: 'FV Coastal Mariner', mmsi: 419178023, imo: '—', vessel_type: 'Fishing Vessel', flag: 'India', lat: 16.02, lon: 68.48, attribution_score: 0.22, risk_level: 'LOW', aisEvidence: 'Weak', sarEvidence: 'Weak', trajectory: 'Low', isDark: false, aisGapStart: 'N/A', aisGapDuration: '0h 45m', positionErrorKm: 16.2, originProximityKm: 18.8, timingDeltaHours: 9.5, anomalyScore: 0.15, speed_knots: 5.6, heading_deg: 220, status: 'CLEARED', explanation: 'Fishing vessel. Too small for crude discharge. Located north of origin.', historical_track: [[16.18, 68.36],[16.10, 68.40],[16.04, 68.45],[16.02, 68.48]] },
];

const SCENE1_RESOURCES = {
  available: { skimmers: 3, booms: 5, responseShips: 2, helicopters: 1, chemicalDispersal: 2, divingTeams: 1 },
  required:  { skimmers: 2, booms: 3, responseShips: 1, helicopters: 0, chemicalDispersal: 1, divingTeams: 0 },
  optimalPlan: {
    id: 'PLAN-AQL-047-OPT', generatedAt: '2026-09-15 03:48 UTC',
    estimatedRecovery: '72%', estimatedCoverage: '81%', priorityScore: 8.7, deploymentWindow: '< 6 hours',
    zones: [
      { id: 'R-1', name: 'Response Zone R-1 (Primary)', lat: 15.790, lon: 68.750, resources: '2 Skimmers + 2 Booms', priority: 'PRIMARY', expectedContainment: '58%' },
      { id: 'R-2', name: 'Response Zone R-2 (Intercept)', lat: 15.768, lon: 68.773, resources: '1 Boom', priority: 'SECONDARY', expectedContainment: '14%' },
    ],
    unallocated: { skimmers: 1, booms: 2, responseShips: 1, helicopters: 1, chemicalDispersal: 1 },
  },
};

const SCENE1_WHATIF: WhatIfScenario[] = [
  { id: 'current', label: 'Current Plan', description: 'Optimal: 2 skimmers, 3 booms, 1 response ship.', impactPct: 72, recoveryPct: 81, priority: 'HIGH', resources: '2 Skimmers, 3 Booms, 1 Ship', cost: '₹ 1.2 Cr', etaHours: 5.5 },
  { id: 'plus_skimmers', label: '+2 Skimmers', description: 'Add 2 skimmers to primary response zone.', impactPct: 54, recoveryPct: 91, priority: 'MEDIUM', resources: '4 Skimmers, 3 Booms, 1 Ship', cost: '₹ 1.8 Cr', etaHours: 5.5 },
  { id: 'plus_booms', label: '+2 Booms', description: 'Deploy boom lines to intercept southern drift.', impactPct: 62, recoveryPct: 86, priority: 'HIGH', resources: '2 Skimmers, 5 Booms, 1 Ship', cost: '₹ 1.4 Cr', etaHours: 6.0 },
  { id: 'delay_6h', label: '6h Response Delay', description: 'Simulate delayed deployment by 6 hours.', impactPct: 88, recoveryPct: 63, priority: 'CRITICAL', resources: '2 Skimmers, 3 Booms, 1 Ship', cost: '₹ 1.2 Cr', etaHours: 11.5 },
  { id: 'no_resources', label: 'No Additional Resources', description: 'Natural attenuation only.', impactPct: 96, recoveryPct: 28, priority: 'CRITICAL', resources: 'None', cost: '₹ 0', etaHours: 0 },
  { id: 'alternative', label: 'Chemical Dispersal', description: 'Dispersal + 1 skimmer on core zone.', impactPct: 68, recoveryPct: 74, priority: 'HIGH', resources: '1 Skimmer, 2 Booms, 2 Dispersal Units', cost: '₹ 0.9 Cr', etaHours: 4.5 },
];

// ---------------------------------------------------------------------------
// SCENE 2 — Mumbai High Oil Field (AL-2026-0918-MUM-112) – center: 19.07N, 71.55E
// ---------------------------------------------------------------------------
const SCENE2_MAP = {
  spillPolygons: [
    {
      type: 'Feature' as const,
      properties: { slick_id: 'SLICK-AQL-112-A', mean_probability: 0.88, area_km2: 27.4, label: 'DETECTED SPILL', confidence: 'HIGH' },
      geometry: {
        type: 'Polygon' as const,
        coordinates: [[
          [71.518, 19.056], [71.532, 19.048], [71.548, 19.044], [71.564, 19.047],
          [71.578, 19.054], [71.588, 19.063], [71.592, 19.074], [71.589, 19.085],
          [71.580, 19.093], [71.566, 19.098], [71.550, 19.097], [71.534, 19.090],
          [71.521, 19.079], [71.514, 19.067], [71.516, 19.059], [71.518, 19.056],
        ]],
      },
    },
    {
      type: 'Feature' as const,
      properties: { slick_id: 'SLICK-AQL-112-CORE', mean_probability: 0.93, area_km2: 11.2, label: 'HIGH CONFIDENCE ZONE', confidence: 'VERY_HIGH' },
      geometry: {
        type: 'Polygon' as const,
        coordinates: [[
          [71.534, 19.060], [71.548, 19.054], [71.560, 19.056], [71.570, 19.063],
          [71.572, 19.073], [71.566, 19.082], [71.554, 19.086], [71.540, 19.083],
          [71.531, 19.075], [71.530, 19.066], [71.534, 19.060],
        ]],
      },
    },
  ],
  originZone: { lat: 19.14, lon: 71.41, radiusKm: 6.1, probability: 0.79, label: 'PROBABLE RELEASE POINT' },
  secondaryOriginZones: [
    { lat: 19.11, lon: 71.36, radiusKm: 8.4, probability: 0.52, label: 'ORIGIN ZONE B' },
    { lat: 19.17, lon: 71.45, radiusKm: 7.2, probability: 0.41, label: 'ORIGIN ZONE C' },
  ],
  hindcastTrajectory: [
    [19.070, 71.550], [19.082, 71.532], [19.095, 71.518],
    [19.108, 71.504], [19.120, 71.490], [19.130, 71.468],
    [19.138, 71.448], [19.140, 71.410],
  ] as [number, number][],
  forwardTrajectory: [
    [19.070, 71.550], [19.057, 71.568], [19.043, 71.586],
    [19.028, 71.604], [19.012, 71.622], [18.994, 71.640],
  ] as [number, number][],
  forecast6h: {
    type: 'Feature' as const,
    properties: { horizon: '+6h', area_km2: 58.6, probability: 0.82 },
    geometry: { type: 'Polygon' as const, coordinates: [[[71.508, 19.038],[71.524, 19.030],[71.542, 19.026],[71.560, 19.029],[71.578, 19.036],[71.594, 19.046],[71.602, 19.058],[71.602, 19.072],[71.594, 19.083],[71.580, 19.091],[71.562, 19.094],[71.542, 19.091],[71.524, 19.082],[71.510, 19.070],[71.504, 19.055],[71.508, 19.044],[71.508, 19.038]]] },
  },
  forecast12h: {
    type: 'Feature' as const,
    properties: { horizon: '+12h', area_km2: 118.3, probability: 0.71 },
    geometry: { type: 'Polygon' as const, coordinates: [[[71.498, 19.020],[71.516, 19.010],[71.538, 19.006],[71.562, 19.010],[71.586, 19.018],[71.608, 19.030],[71.620, 19.044],[71.622, 19.060],[71.614, 19.074],[71.598, 19.086],[71.578, 19.093],[71.554, 19.094],[71.530, 19.088],[71.508, 19.076],[71.492, 19.060],[71.488, 19.040],[71.493, 19.028],[71.498, 19.020]]] },
  },
  forecast24h: {
    type: 'Feature' as const,
    properties: { horizon: '+24h', area_km2: 231.5, probability: 0.58 },
    geometry: { type: 'Polygon' as const, coordinates: [[[71.482, 18.998],[71.504, 18.986],[71.532, 18.980],[71.562, 18.985],[71.592, 18.996],[71.620, 19.011],[71.638, 19.028],[71.644, 19.048],[71.638, 19.068],[71.622, 19.084],[71.598, 19.096],[71.570, 19.102],[71.540, 19.100],[71.512, 19.090],[71.488, 19.072],[71.472, 19.050],[71.470, 19.024],[71.478, 19.008],[71.482, 18.998]]] },
  },
  impactZoneHigh: {
    type: 'Feature' as const,
    properties: { label: 'HIGH RISK ZONE', riskLevel: 'HIGH', impactProbability: 0.62 },
    geometry: { type: 'Polygon' as const, coordinates: [[[71.590, 18.980],[71.620, 18.970],[71.648, 18.976],[71.668, 18.992],[71.672, 19.010],[71.660, 19.028],[71.636, 19.036],[71.610, 19.034],[71.590, 19.020],[71.582, 19.000],[71.590, 18.980]]] },
  },
  uncertaintyZone: {
    type: 'Feature' as const,
    properties: { label: 'FORECAST UNCERTAINTY', probability: 0.40 },
    geometry: { type: 'Polygon' as const, coordinates: [[[71.460, 18.966],[71.496, 18.952],[71.534, 18.946],[71.572, 18.950],[71.608, 18.960],[71.638, 18.976],[71.660, 18.996],[71.670, 19.020],[71.664, 19.046],[71.648, 19.068],[71.624, 19.086],[71.594, 19.097],[71.560, 19.102],[71.524, 19.098],[71.490, 19.084],[71.462, 19.064],[71.444, 19.038],[71.442, 19.008],[71.450, 18.984],[71.460, 18.966]]] },
  },
  responseZone1: {
    type: 'Feature' as const,
    properties: { label: 'RESPONSE ZONE R-1', priority: 'PRIMARY', resources: '3 Skimmers, 3 Booms' },
    geometry: { type: 'Polygon' as const, coordinates: [[[71.548, 19.058],[71.562, 19.052],[71.572, 19.058],[71.570, 19.068],[71.556, 19.074],[71.544, 19.068],[71.542, 19.062],[71.548, 19.058]]] },
  },
  responseZone2: {
    type: 'Feature' as const,
    properties: { label: 'RESPONSE ZONE R-2', priority: 'SECONDARY', resources: '2 Booms' },
    geometry: { type: 'Polygon' as const, coordinates: [[[71.576, 19.036],[71.590, 19.030],[71.600, 19.036],[71.598, 19.046],[71.584, 19.052],[71.572, 19.046],[71.570, 19.038],[71.576, 19.036]]] },
  },
  predictedPolygon: {
    type: 'Feature' as const,
    properties: { label: 'PREDICTED', area_km2: 30.8 },
    geometry: { type: 'Polygon' as const, coordinates: [[[71.516, 19.054],[71.530, 19.046],[71.546, 19.043],[71.562, 19.046],[71.576, 19.053],[71.586, 19.062],[71.588, 19.073],[71.582, 19.083],[71.568, 19.090],[71.552, 19.090],[71.536, 19.083],[71.522, 19.073],[71.514, 19.062],[71.514, 19.056],[71.516, 19.054]]] },
  },
};

const SCENE2_METOCEAN = {
  currentSpeedMs: 0.65, currentDirectionDeg: 158, currentDirectionLabel: 'SSE (158°)',
  windSpeedMs: 5.2, windSpeedKmh: 18.7, windDirectionDeg: 162, windDirectionLabel: 'SSE (162°)',
  waveHeightM: 1.8, seaTempC: 27.9, salinityPsu: 34.6,
};

const SCENE2_FORECAST_HORIZONS = [
  { key: '0h', label: 'Current (0h)', timestamp: '2026-09-18 06:50 UTC', area_km2: 27.4, centroid: { lat: 19.070, lon: 71.550 }, opacity: 1.0, color: '#dc2626', fillColor: '#b91c1c', description: 'Detected spill at Mumbai High Oil Field.' },
  { key: '6h', label: '+6 Hours', timestamp: '2026-09-18 12:50 UTC', area_km2: 58.6, centroid: { lat: 19.048, lon: 71.572 }, opacity: 0.82, color: '#ea580c', fillColor: '#c2410c', description: 'Spill drifting SSE under monsoon currents.', coastalProximityKm: 82.1 },
  { key: '12h', label: '+12 Hours', timestamp: '2026-09-18 18:50 UTC', area_km2: 118.3, centroid: { lat: 19.022, lon: 71.594 }, opacity: 0.65, color: '#d97706', fillColor: '#b45309', description: 'Significant expansion toward oil field infrastructure.', coastalProximityKm: 64.8 },
  { key: '24h', label: '+24 Hours', timestamp: '2026-09-19 06:50 UTC', area_km2: 231.5, centroid: { lat: 18.978, lon: 71.632 }, opacity: 0.48, color: '#7c3aed', fillColor: '#6d28d9', description: 'HIGH RISK — approaching coastal fisheries zone.', coastalProximityKm: 42.3 },
  { key: '48h', label: '+48 Hours', timestamp: '2026-09-20 06:50 UTC', area_km2: 378.9, centroid: { lat: 18.920, lon: 71.680 }, opacity: 0.32, color: '#0e7490', fillColor: '#0891b2', description: 'Critical approach to shallow shelf waters.', coastalProximityKm: 22.6 },
  { key: '72h', label: '+72 Hours', timestamp: '2026-09-21 06:50 UTC', area_km2: 498.3, centroid: { lat: 18.862, lon: 71.722 }, opacity: 0.20, color: '#065f46', fillColor: '#047857', description: 'Shore contact imminent. Ratnagiri coast at risk.', coastalProximityKm: 8.1 },
];

const SCENE2_IMPACT_SUMMARY = {
  ecologicalRisk: 0.62, fisheriesRisk: 0.71, populationRisk: 0.53, economicRisk: 0.68,
  overallSeverity: 'HIGH', totalAffectedAreaKm2: 142.8,
  estimatedEconomicLossMillion: 6.1, populationAtRisk: 68000, fisheryBanAreaKm2: 94.5,
};

const SCENE2_IMPACT_ASSETS: ImpactAsset[] = [
  { name: 'Mumbai High Platform B', lat: 19.08, lon: 71.53, type: 'Oil Infrastructure', riskScore: 0.88, impactProbability: 0.74, etaHours: 8, sensitivity: 'CRITICAL', description: 'Active oil production platform. Oil contamination of cooling intakes and risers.' },
  { name: 'Alibag Coastal Fisheries', lat: 18.94, lon: 71.72, type: 'Fisheries Zone', riskScore: 0.74, impactProbability: 0.68, etaHours: 18, sensitivity: 'HIGH', description: 'Supports 18,000 artisanal fishing families. Pomfret breeding season active.' },
  { name: 'Ratnagiri Alphonso Belt', lat: 18.78, lon: 71.82, type: 'Agricultural Zone', riskScore: 0.62, impactProbability: 0.52, etaHours: 31, sensitivity: 'HIGH', description: 'GI-tagged Alphonso mango orchards with coastal irrigation. Oil contamination risk to water table.' },
  { name: 'Elephanta Island Ferry', lat: 18.96, lon: 72.93, type: 'Heritage/Tourism', riskScore: 0.44, impactProbability: 0.35, etaHours: 40, sensitivity: 'MEDIUM', description: 'UNESCO World Heritage site. Ferry operations and cave complex at risk.' },
  { name: 'Dharamtar Creek MPA', lat: 18.88, lon: 71.78, type: 'Marine Protected Area', riskScore: 0.71, impactProbability: 0.61, etaHours: 24, sensitivity: 'CRITICAL', description: 'Mangrove biosphere reserve. Nursery habitat for juvenile Bombay Duck. Critical ecological zone.' },
];

const SCENE2_VESSELS: DemoVessel[] = [
  { rank: 1, vessel_name: 'MT Kalinga Star', mmsi: 419001234, imo: '9543201', vessel_type: 'Crude Oil Tanker', flag: 'India', lat: 19.142, lon: 71.408, attribution_score: 0.79, risk_level: 'HIGH', aisEvidence: 'Strong', sarEvidence: 'Medium', trajectory: 'High', isDark: true, aisGapStart: '2026-09-17 22:40 UTC', aisGapDuration: '4h 10m', positionErrorKm: 1.8, originProximityKm: 2.3, timingDeltaHours: 1.2, anomalyScore: 0.81, speed_knots: 3.8, heading_deg: 162, status: 'PRIMARY SUSPECT', explanation: 'AIS dark period of 4h 10m aligned with release window. Detected near Mumbai High field boundary. Slow transit speed anomaly.', historical_track: [[19.32, 71.28],[19.26, 71.32],[19.20, 71.36],[19.16, 71.40],[19.14, 71.41],[19.10, 71.46],[19.06, 71.52]] },
  { rank: 2, vessel_name: 'MV Sagar Doot', mmsi: 419002871, imo: '9291847', vessel_type: 'Product Tanker', flag: 'India', lat: 19.08, lon: 71.49, attribution_score: 0.63, risk_level: 'HIGH', aisEvidence: 'Medium', sarEvidence: 'Medium', trajectory: 'Medium', isDark: false, aisGapStart: '2026-09-17 23:55 UTC', aisGapDuration: '1h 45m', positionErrorKm: 3.6, originProximityKm: 5.8, timingDeltaHours: 2.8, anomalyScore: 0.58, speed_knots: 7.4, heading_deg: 174, status: 'CANDIDATE', explanation: 'Short AIS gap during release window edge. Vessel operated in field exclusion zone briefly.', historical_track: [[19.28, 71.34],[19.20, 71.38],[19.14, 71.44],[19.08, 71.49],[19.02, 71.56]] },
  { rank: 3, vessel_name: 'MV Prabha', mmsi: 419003512, imo: '9382104', vessel_type: 'General Cargo', flag: 'India', lat: 18.98, lon: 71.62, attribution_score: 0.48, risk_level: 'MEDIUM', aisEvidence: 'Strong', sarEvidence: 'Weak', trajectory: 'Medium', isDark: false, aisGapStart: 'N/A', aisGapDuration: '0h 00m', positionErrorKm: 7.1, originProximityKm: 9.4, timingDeltaHours: 5.6, anomalyScore: 0.41, speed_knots: 12.1, heading_deg: 192, status: 'CANDIDATE', explanation: 'Continuous AIS. Passed within 9.4 km of origin during transit. No behavioral anomaly.', historical_track: [[19.22, 71.52],[19.12, 71.56],[19.02, 71.62],[18.94, 71.68]] },
  { rank: 4, vessel_name: 'MT Gulf Trader', mmsi: 538004821, imo: '9412876', vessel_type: 'Chemical Tanker', flag: 'Marshall Islands', lat: 18.88, lon: 71.74, attribution_score: 0.32, risk_level: 'LOW', aisEvidence: 'Strong', sarEvidence: 'Weak', trajectory: 'Low', isDark: false, aisGapStart: 'N/A', aisGapDuration: '0h 00m', positionErrorKm: 13.2, originProximityKm: 17.8, timingDeltaHours: 8.4, anomalyScore: 0.22, speed_knots: 14.2, heading_deg: 185, status: 'LOW PROBABILITY', explanation: 'Full AIS coverage. No proximity to origin. Chemical tanker — cargo type inconsistent.', historical_track: [[19.18, 71.60],[19.04, 71.66],[18.92, 71.72],[18.88, 71.74]] },
  { rank: 5, vessel_name: 'FV Sagar Shakti', mmsi: 419178901, imo: '—', vessel_type: 'Fishing Vessel', flag: 'India', lat: 19.22, lon: 71.38, attribution_score: 0.18, risk_level: 'LOW', aisEvidence: 'Weak', sarEvidence: 'Weak', trajectory: 'Low', isDark: false, aisGapStart: 'N/A', aisGapDuration: '0h 30m', positionErrorKm: 18.4, originProximityKm: 22.1, timingDeltaHours: 11.2, anomalyScore: 0.12, speed_knots: 4.8, heading_deg: 240, status: 'CLEARED', explanation: 'Fishing vessel operating north of field. Volume of spill far exceeds fishing vessel capacity.', historical_track: [[19.36, 71.26],[19.30, 71.30],[19.24, 71.36],[19.22, 71.38]] },
];

const SCENE2_RESOURCES = {
  available: { skimmers: 4, booms: 6, responseShips: 3, helicopters: 2, chemicalDispersal: 3, divingTeams: 2 },
  required:  { skimmers: 3, booms: 4, responseShips: 2, helicopters: 1, chemicalDispersal: 2, divingTeams: 1 },
  optimalPlan: {
    id: 'PLAN-AQL-112-OPT', generatedAt: '2026-09-18 07:12 UTC',
    estimatedRecovery: '65%', estimatedCoverage: '74%', priorityScore: 7.4, deploymentWindow: '< 8 hours',
    zones: [
      { id: 'R-1', name: 'Response Zone R-1 (Platform Perimeter)', lat: 19.082, lon: 71.542, resources: '3 Skimmers + 3 Booms', priority: 'PRIMARY', expectedContainment: '48%' },
      { id: 'R-2', name: 'Response Zone R-2 (SSE Intercept)', lat: 19.044, lon: 71.578, resources: '2 Booms', priority: 'SECONDARY', expectedContainment: '17%' },
    ],
    unallocated: { skimmers: 1, booms: 2, responseShips: 1, helicopters: 1, chemicalDispersal: 1 },
  },
};

const SCENE2_WHATIF: WhatIfScenario[] = [
  { id: 'current', label: 'Current Plan', description: 'Optimal: 3 skimmers, 4 booms, 2 response ships.', impactPct: 65, recoveryPct: 74, priority: 'HIGH', resources: '3 Skimmers, 4 Booms, 2 Ships', cost: '₹ 2.1 Cr', etaHours: 7.5 },
  { id: 'plus_skimmers', label: '+2 Skimmers', description: 'Add aerial-deployed skimmers to primary zone.', impactPct: 48, recoveryPct: 86, priority: 'MEDIUM', resources: '5 Skimmers, 4 Booms, 2 Ships', cost: '₹ 2.9 Cr', etaHours: 7.5 },
  { id: 'plus_booms', label: '+3 Booms', description: 'Extended boom line to protect platform infrastructure.', impactPct: 56, recoveryPct: 81, priority: 'HIGH', resources: '3 Skimmers, 7 Booms, 2 Ships', cost: '₹ 2.4 Cr', etaHours: 8.5 },
  { id: 'delay_6h', label: '6h Response Delay', description: 'Simulate operational delay of 6 hours.', impactPct: 82, recoveryPct: 58, priority: 'CRITICAL', resources: '3 Skimmers, 4 Booms, 2 Ships', cost: '₹ 2.1 Cr', etaHours: 13.5 },
  { id: 'no_resources', label: 'No Containment', description: 'Natural attenuation only. Platform at full risk.', impactPct: 94, recoveryPct: 21, priority: 'CRITICAL', resources: 'None', cost: '₹ 0', etaHours: 0 },
  { id: 'alternative', label: 'Dispersant Priority', description: 'Chemical dispersal focus around platform risers.', impactPct: 61, recoveryPct: 69, priority: 'HIGH', resources: '2 Skimmers, 3 Booms, 3 Dispersal Units', cost: '₹ 1.8 Cr', etaHours: 5.5 },
];

// ---------------------------------------------------------------------------
// SCENE 3 — Bay of Bengal / Chennai (AL-2026-0921-CHE-078) – center: 13.08N, 81.62E
// ---------------------------------------------------------------------------
const SCENE3_MAP = {
  spillPolygons: [
    {
      type: 'Feature' as const,
      properties: { slick_id: 'SLICK-AQL-078-A', mean_probability: 0.97, area_km2: 58.3, label: 'DETECTED SPILL', confidence: 'HIGH' },
      geometry: {
        type: 'Polygon' as const,
        coordinates: [[
          [81.584, 13.058], [81.600, 13.048], [81.618, 13.043], [81.638, 13.046],
          [81.656, 13.054], [81.668, 13.065], [81.672, 13.078], [81.668, 13.092],
          [81.656, 13.102], [81.640, 13.108], [81.622, 13.108], [81.604, 13.100],
          [81.590, 13.088], [81.582, 13.074], [81.582, 13.062], [81.584, 13.058],
        ]],
      },
    },
    {
      type: 'Feature' as const,
      properties: { slick_id: 'SLICK-AQL-078-CORE', mean_probability: 0.99, area_km2: 24.6, label: 'HIGH CONFIDENCE ZONE', confidence: 'VERY_HIGH' },
      geometry: {
        type: 'Polygon' as const,
        coordinates: [[
          [81.604, 13.062], [81.620, 13.056], [81.636, 13.058], [81.648, 13.067],
          [81.652, 13.078], [81.646, 13.090], [81.632, 13.097], [81.616, 13.096],
          [81.602, 13.088], [81.596, 13.076], [81.598, 13.066], [81.604, 13.062],
        ]],
      },
    },
  ],
  originZone: { lat: 13.19, lon: 81.48, radiusKm: 3.8, probability: 0.91, label: 'PROBABLE RELEASE POINT' },
  secondaryOriginZones: [
    { lat: 13.16, lon: 81.44, radiusKm: 5.6, probability: 0.64, label: 'ORIGIN ZONE B' },
    { lat: 13.22, lon: 81.52, radiusKm: 4.9, probability: 0.55, label: 'ORIGIN ZONE C' },
  ],
  hindcastTrajectory: [
    [13.080, 81.620], [13.094, 81.604], [13.108, 81.589],
    [13.124, 81.574], [13.140, 81.558], [13.158, 81.542],
    [13.174, 81.524], [13.190, 81.480],
  ] as [number, number][],
  forwardTrajectory: [
    [13.080, 81.620], [13.068, 81.640], [13.055, 81.660],
    [13.042, 81.682], [13.028, 81.702], [13.012, 81.722], [12.996, 81.744],
  ] as [number, number][],
  forecast6h: {
    type: 'Feature' as const,
    properties: { horizon: '+6h', area_km2: 122.8, probability: 0.91 },
    geometry: { type: 'Polygon' as const, coordinates: [[[81.570, 13.036],[81.590, 13.024],[81.614, 13.018],[81.640, 13.021],[81.666, 13.031],[81.688, 13.044],[81.700, 13.059],[81.702, 13.076],[81.692, 13.092],[81.676, 13.104],[81.654, 13.112],[81.628, 13.114],[81.600, 13.108],[81.576, 13.095],[81.558, 13.078],[81.552, 13.058],[81.558, 13.044],[81.570, 13.036]]] },
  },
  forecast12h: {
    type: 'Feature' as const,
    properties: { horizon: '+12h', area_km2: 248.6, probability: 0.82 },
    geometry: { type: 'Polygon' as const, coordinates: [[[81.552, 13.010],[81.576, 12.996],[81.606, 12.990],[81.640, 12.995],[81.674, 13.008],[81.704, 13.026],[81.724, 13.048],[81.730, 13.072],[81.722, 13.096],[81.704, 13.114],[81.678, 13.126],[81.646, 13.132],[81.610, 13.130],[81.576, 13.120],[81.546, 13.100],[81.526, 13.074],[81.522, 13.044],[81.532, 13.024],[81.552, 13.010]]] },
  },
  forecast24h: {
    type: 'Feature' as const,
    properties: { horizon: '+24h', area_km2: 486.2, probability: 0.71 },
    geometry: { type: 'Polygon' as const, coordinates: [[[81.524, 12.978],[81.554, 12.960],[81.592, 12.952],[81.636, 12.958],[81.680, 12.974],[81.722, 12.996],[81.752, 13.022],[81.768, 13.052],[81.766, 13.084],[81.748, 13.110],[81.716, 13.132],[81.676, 13.146],[81.630, 13.152],[81.582, 13.148],[81.538, 13.132],[81.502, 13.106],[81.478, 13.072],[81.472, 13.034],[81.486, 13.002],[81.524, 12.978]]] },
  },
  impactZoneHigh: {
    type: 'Feature' as const,
    properties: { label: 'HIGH RISK ZONE', riskLevel: 'HIGH', impactProbability: 0.88 },
    geometry: { type: 'Polygon' as const, coordinates: [[[81.680, 12.940],[81.720, 12.930],[81.754, 12.938],[81.778, 12.956],[81.784, 12.978],[81.772, 12.998],[81.746, 13.010],[81.714, 13.012],[81.686, 13.000],[81.668, 12.980],[81.664, 12.958],[81.680, 12.940]]] },
  },
  uncertaintyZone: {
    type: 'Feature' as const,
    properties: { label: 'FORECAST UNCERTAINTY', probability: 0.55 },
    geometry: { type: 'Polygon' as const, coordinates: [[[81.460, 12.940],[81.500, 12.920],[81.548, 12.910],[81.600, 12.916],[81.652, 12.932],[81.700, 12.956],[81.740, 12.984],[81.766, 13.018],[81.778, 13.056],[81.772, 13.096],[81.752, 13.130],[81.718, 13.156],[81.676, 13.172],[81.628, 13.178],[81.578, 13.172],[81.530, 13.154],[81.488, 13.124],[81.456, 13.086],[81.436, 13.042],[81.432, 12.994],[81.448, 12.962],[81.460, 12.940]]] },
  },
  responseZone1: {
    type: 'Feature' as const,
    properties: { label: 'RESPONSE ZONE R-1', priority: 'PRIMARY', resources: '4 Skimmers, 4 Booms' },
    geometry: { type: 'Polygon' as const, coordinates: [[[81.616, 13.066],[81.634, 13.058],[81.648, 13.064],[81.646, 13.076],[81.630, 13.084],[81.614, 13.078],[81.612, 13.070],[81.616, 13.066]]] },
  },
  responseZone2: {
    type: 'Feature' as const,
    properties: { label: 'RESPONSE ZONE R-2', priority: 'SECONDARY', resources: '2 Booms' },
    geometry: { type: 'Polygon' as const, coordinates: [[[81.650, 13.040],[81.666, 13.032],[81.678, 13.038],[81.676, 13.050],[81.660, 13.058],[81.648, 13.052],[81.646, 13.044],[81.650, 13.040]]] },
  },
  predictedPolygon: {
    type: 'Feature' as const,
    properties: { label: 'PREDICTED', area_km2: 62.4 },
    geometry: { type: 'Polygon' as const, coordinates: [[[81.582, 13.056],[81.598, 13.046],[81.616, 13.041],[81.634, 13.044],[81.652, 13.052],[81.664, 13.063],[81.668, 13.076],[81.662, 13.090],[81.648, 13.100],[81.630, 13.104],[81.612, 13.100],[81.596, 13.090],[81.584, 13.077],[81.580, 13.064],[81.582, 13.056]]] },
  },
};

const SCENE3_METOCEAN = {
  currentSpeedMs: 1.04, currentDirectionDeg: 88, currentDirectionLabel: 'E (88°)',
  windSpeedMs: 6.8, windSpeedKmh: 24.5, windDirectionDeg: 92, windDirectionLabel: 'E (92°)',
  waveHeightM: 2.4, seaTempC: 29.1, salinityPsu: 33.2,
};

const SCENE3_FORECAST_HORIZONS = [
  { key: '0h', label: 'Current (0h)', timestamp: '2026-09-21 10:35 UTC', area_km2: 58.3, centroid: { lat: 13.080, lon: 81.620 }, opacity: 1.0, color: '#dc2626', fillColor: '#b91c1c', description: 'Largest spill detected this quarter. Bay of Bengal Chennai corridor.' },
  { key: '6h', label: '+6 Hours', timestamp: '2026-09-21 16:35 UTC', area_km2: 122.8, centroid: { lat: 13.054, lon: 81.648 }, opacity: 0.82, color: '#ea580c', fillColor: '#c2410c', description: 'Rapid eastward drift at 1.04 m/s. Shore proximity increasing fast.', coastalProximityKm: 38.2 },
  { key: '12h', label: '+12 Hours', timestamp: '2026-09-21 22:35 UTC', area_km2: 248.6, centroid: { lat: 13.026, lon: 81.676 }, opacity: 0.65, color: '#d97706', fillColor: '#b45309', description: 'CRITICAL — entering coastal shelf. Shore impact imminent.', coastalProximityKm: 22.7 },
  { key: '24h', label: '+24 Hours', timestamp: '2026-09-22 10:35 UTC', area_km2: 486.2, centroid: { lat: 12.978, lon: 81.720 }, opacity: 0.48, color: '#7c3aed', fillColor: '#6d28d9', description: 'Shore contact expected. Ennore coast and Chennai port approach.', coastalProximityKm: 8.4 },
  { key: '48h', label: '+48 Hours', timestamp: '2026-09-23 10:35 UTC', area_km2: 724.8, centroid: { lat: 12.912, lon: 81.778 }, opacity: 0.32, color: '#0e7490', fillColor: '#0891b2', description: 'Full coastal impact. Pulicat Lake ecosystem threatened.', coastalProximityKm: 2.1 },
  { key: '72h', label: '+72 Hours', timestamp: '2026-09-24 10:35 UTC', area_km2: 912.4, centroid: { lat: 12.844, lon: 81.828 }, opacity: 0.20, color: '#065f46', fillColor: '#047857', description: 'Maximum spread. Southern coast fully impacted.', coastalProximityKm: 0.4 },
];

const SCENE3_IMPACT_SUMMARY = {
  ecologicalRisk: 0.88, fisheriesRisk: 0.82, populationRisk: 0.67, economicRisk: 0.74,
  overallSeverity: 'HIGH', totalAffectedAreaKm2: 312.8,
  estimatedEconomicLossMillion: 9.8, populationAtRisk: 125000, fisheryBanAreaKm2: 142.6,
};

const SCENE3_IMPACT_ASSETS: ImpactAsset[] = [
  { name: 'Pulicat Lake Bird Sanctuary', lat: 13.42, lon: 80.32, type: 'Wildlife Sanctuary', riskScore: 0.92, impactProbability: 0.86, etaHours: 14, sensitivity: 'CRITICAL', description: 'Second largest brackish water lagoon in India. Flamingo and pelican migration route. Total ecological collapse risk.' },
  { name: 'Ennore Creek Mangroves', lat: 13.22, lon: 80.33, type: 'Marine Protected Area', riskScore: 0.85, impactProbability: 0.81, etaHours: 10, sensitivity: 'CRITICAL', description: 'Critical mangrove buffer zone. Nursery for 40+ fish species. Irreplaceable habitat.' },
  { name: 'Chennai Northern Fisheries', lat: 13.18, lon: 80.30, type: 'Fisheries Zone', riskScore: 0.79, impactProbability: 0.74, etaHours: 12, sensitivity: 'HIGH', description: 'Primary marine fishing zone supporting 35,000 fishermen. Prawn and snapper breeding grounds.' },
  { name: 'Kamarajar Port', lat: 13.25, lon: 80.34, type: 'Port / Infrastructure', riskScore: 0.68, impactProbability: 0.62, etaHours: 16, sensitivity: 'HIGH', description: "India's first major corporate port. Thermal power plant cooling intakes at risk. Economic disruption estimated ₹50+ Cr/day." },
  { name: 'Marina Beach Shoreline', lat: 13.06, lon: 80.28, type: 'Population Zone', riskScore: 0.74, impactProbability: 0.67, etaHours: 20, sensitivity: 'HIGH', description: "World's longest urban beach. 50,000+ daily visitors. Tourism and fisheries economy. Major public health concern." },
];

const SCENE3_VESSELS: DemoVessel[] = [
  { rank: 1, vessel_name: 'MV Chennai Express', mmsi: 419005678, imo: '9628741', vessel_type: 'Heavy Crude Tanker', flag: 'Panama', lat: 13.192, lon: 81.476, attribution_score: 0.93, risk_level: 'HIGH', aisEvidence: 'Strong', sarEvidence: 'Strong', trajectory: 'High', isDark: true, aisGapStart: '2026-09-21 04:10 UTC', aisGapDuration: '5h 45m', positionErrorKm: 1.1, originProximityKm: 1.8, timingDeltaHours: 0.4, anomalyScore: 0.96, speed_knots: 2.6, heading_deg: 90, status: 'PRIMARY SUSPECT', explanation: 'Extended AIS dark period of 5h 45m perfectly aligned with release window. SAR dark vessel detected at origin coordinates. Near-stationary speed suggests deliberate discharge.', historical_track: [[13.38, 81.32],[13.30, 81.36],[13.24, 81.42],[13.20, 81.46],[13.19, 81.48],[13.14, 81.54],[13.10, 81.60]] },
  { rank: 2, vessel_name: 'MT Bay Transporter', mmsi: 566001829, imo: '9501234', vessel_type: 'Product Tanker', flag: 'Singapore', lat: 13.14, lon: 81.54, attribution_score: 0.71, risk_level: 'HIGH', aisEvidence: 'Medium', sarEvidence: 'Strong', trajectory: 'Medium', isDark: false, aisGapStart: '2026-09-21 05:20 UTC', aisGapDuration: '2h 30m', positionErrorKm: 3.2, originProximityKm: 6.4, timingDeltaHours: 1.8, anomalyScore: 0.64, speed_knots: 6.8, heading_deg: 96, status: 'CANDIDATE', explanation: 'AIS gap during release window. SAR shows vessel outline 6.4 km from origin. Inconsistent speed pattern.', historical_track: [[13.28, 81.42],[13.22, 81.46],[13.18, 81.50],[13.14, 81.54],[13.10, 81.60]] },
  { rank: 3, vessel_name: 'MV Vishnu Glory', mmsi: 419006102, imo: '9312847', vessel_type: 'General Cargo', flag: 'India', lat: 13.04, lon: 81.68, attribution_score: 0.52, risk_level: 'MEDIUM', aisEvidence: 'Strong', sarEvidence: 'Weak', trajectory: 'Medium', isDark: false, aisGapStart: 'N/A', aisGapDuration: '0h 00m', positionErrorKm: 6.8, originProximityKm: 10.2, timingDeltaHours: 4.2, anomalyScore: 0.44, speed_knots: 13.4, heading_deg: 180, status: 'CANDIDATE', explanation: 'Continuous AIS track. 10.2 km from origin during release window. Transit route passes through spill zone.', historical_track: [[13.32, 81.62],[13.20, 81.64],[13.10, 81.66],[13.04, 81.68]] },
  { rank: 4, vessel_name: 'MSC Coromandel', mmsi: 215123456, imo: '9718234', vessel_type: 'Container Ship', flag: 'Panama', lat: 12.92, lon: 81.84, attribution_score: 0.29, risk_level: 'LOW', aisEvidence: 'Strong', sarEvidence: 'Weak', trajectory: 'Low', isDark: false, aisGapStart: 'N/A', aisGapDuration: '0h 00m', positionErrorKm: 16.4, originProximityKm: 21.8, timingDeltaHours: 8.6, anomalyScore: 0.18, speed_knots: 18.2, heading_deg: 168, status: 'LOW PROBABILITY', explanation: 'Container vessel on regular Chennai-Singapore service. Full AIS. No proximity to origin. Cargo type incompatible.', historical_track: [[13.20, 81.70],[13.08, 81.76],[12.96, 81.82],[12.92, 81.84]] },
  { rank: 5, vessel_name: 'FV Kadal Kavi', mmsi: 419200341, imo: '—', vessel_type: 'Fishing Trawler', flag: 'India', lat: 13.32, lon: 81.40, attribution_score: 0.14, risk_level: 'LOW', aisEvidence: 'Weak', sarEvidence: 'Weak', trajectory: 'Low', isDark: false, aisGapStart: 'N/A', aisGapDuration: '1h 00m', positionErrorKm: 22.6, originProximityKm: 26.4, timingDeltaHours: 12.8, anomalyScore: 0.10, speed_knots: 4.2, heading_deg: 260, status: 'CLEARED', explanation: 'Tamil fishing trawler. Located far north of origin. AIS gap is routine fishing operation pattern.', historical_track: [[13.46, 81.28],[13.40, 81.32],[13.36, 81.38],[13.32, 81.40]] },
];

const SCENE3_RESOURCES = {
  available: { skimmers: 5, booms: 8, responseShips: 4, helicopters: 3, chemicalDispersal: 4, divingTeams: 3 },
  required:  { skimmers: 4, booms: 6, responseShips: 3, helicopters: 2, chemicalDispersal: 2, divingTeams: 2 },
  optimalPlan: {
    id: 'PLAN-AQL-078-OPT', generatedAt: '2026-09-21 11:18 UTC',
    estimatedRecovery: '61%', estimatedCoverage: '69%', priorityScore: 9.2, deploymentWindow: '< 4 hours',
    zones: [
      { id: 'R-1', name: 'Response Zone R-1 (Core Containment)', lat: 13.076, lon: 81.636, resources: '4 Skimmers + 4 Booms', priority: 'PRIMARY', expectedContainment: '44%' },
      { id: 'R-2', name: 'Response Zone R-2 (Shore Intercept)', lat: 13.044, lon: 81.662, resources: '2 Booms + 2 Dispersal Units', priority: 'SECONDARY', expectedContainment: '17%' },
    ],
    unallocated: { skimmers: 1, booms: 2, responseShips: 1, helicopters: 1, chemicalDispersal: 2 },
  },
};

const SCENE3_WHATIF: WhatIfScenario[] = [
  { id: 'current', label: 'Current Plan', description: 'Maximum deployment: 4 skimmers, 6 booms, 3 response ships.', impactPct: 61, recoveryPct: 69, priority: 'HIGH', resources: '4 Skimmers, 6 Booms, 3 Ships', cost: '₹ 3.4 Cr', etaHours: 3.8 },
  { id: 'plus_skimmers', label: '+2 Aerial Skimmers', description: 'Deploy helicopter-borne skimmers to core zone.', impactPct: 44, recoveryPct: 82, priority: 'MEDIUM', resources: '6 Skimmers, 6 Booms, 3 Ships', cost: '₹ 4.6 Cr', etaHours: 3.8 },
  { id: 'plus_booms', label: '+4 Shore Booms', description: 'Pre-position boom barriers at Ennore Creek mouth.', impactPct: 52, recoveryPct: 77, priority: 'HIGH', resources: '4 Skimmers, 10 Booms, 3 Ships', cost: '₹ 3.9 Cr', etaHours: 4.5 },
  { id: 'delay_6h', label: '6h Response Delay', description: 'Critical delay — shore impact occurs before deployment.', impactPct: 91, recoveryPct: 42, priority: 'CRITICAL', resources: '4 Skimmers, 6 Booms, 3 Ships', cost: '₹ 3.4 Cr', etaHours: 9.8 },
  { id: 'no_resources', label: 'No Containment', description: 'Worst-case scenario. Full shore impact inevitable.', impactPct: 99, recoveryPct: 12, priority: 'CRITICAL', resources: 'None', cost: '₹ 0', etaHours: 0 },
  { id: 'alternative', label: 'Dispersant + Shore Barrier', description: 'Chemical dispersal + pre-deployed coastal boom grid.', impactPct: 57, recoveryPct: 72, priority: 'HIGH', resources: '2 Skimmers, 4 Booms, 4 Dispersal Units', cost: '₹ 2.8 Cr', etaHours: 3.0 },
];

// ---------------------------------------------------------------------------
// SCENE DATA MAP — one entry per scene ID
// ---------------------------------------------------------------------------
type SceneDataKey = 'AL-2026-0915-IND-047' | 'AL-2026-0918-MUM-112' | 'AL-2026-0921-CHE-078';

const SCENE_DATA_MAP = {
  'AL-2026-0915-IND-047': {
    map: SCENE1_MAP,
    metocean: SCENE1_METOCEAN,
    forecastHorizons: SCENE1_FORECAST_HORIZONS,
    impactSummary: SCENE1_IMPACT_SUMMARY,
    impactAssets: SCENE1_IMPACT_ASSETS,
    vessels: SCENE1_VESSELS,
    resources: SCENE1_RESOURCES,
    whatIfScenarios: SCENE1_WHATIF,
  },
  'AL-2026-0918-MUM-112': {
    map: SCENE2_MAP,
    metocean: SCENE2_METOCEAN,
    forecastHorizons: SCENE2_FORECAST_HORIZONS,
    impactSummary: SCENE2_IMPACT_SUMMARY,
    impactAssets: SCENE2_IMPACT_ASSETS,
    vessels: SCENE2_VESSELS,
    resources: SCENE2_RESOURCES,
    whatIfScenarios: SCENE2_WHATIF,
  },
  'AL-2026-0921-CHE-078': {
    map: SCENE3_MAP,
    metocean: SCENE3_METOCEAN,
    forecastHorizons: SCENE3_FORECAST_HORIZONS,
    impactSummary: SCENE3_IMPACT_SUMMARY,
    impactAssets: SCENE3_IMPACT_ASSETS,
    vessels: SCENE3_VESSELS,
    resources: SCENE3_RESOURCES,
    whatIfScenarios: SCENE3_WHATIF,
  },
} satisfies Record<SceneDataKey, unknown>;

/**
 * Returns all scene-specific demo data for the given sceneId.
 * Falls back to Scene 1 (Arabian Sea) for unrecognised IDs.
 */
export function getSceneData(sceneId: string) {
  return (SCENE_DATA_MAP as Record<string, typeof SCENE_DATA_MAP[SceneDataKey]>)[sceneId]
    ?? SCENE_DATA_MAP['AL-2026-0915-IND-047'];
}
