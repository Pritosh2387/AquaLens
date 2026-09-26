/**
 * AquaLens Demo Incidents
 *
 * 3 scene-specific hardcoded incident datasets:
 *   Scene 1: AL-2026-0915-IND-047 — Arabian Sea (original)
 *   Scene 2: AL-2026-0918-MUM-112 — Mumbai High Oil Field
 *   Scene 3: AL-2026-0921-CHE-078 — Bay of Bengal / Chennai coast
 *
 * All pages and map layers reference DEMO_INCIDENT (scene-aware).
 * Use getDemoIncident(sceneId) to get the correct dataset.
 */

const SCENE_1 = {
  sceneId: 'AL-2026-0915-IND-047',
  incidentId: 'AQL-047',
  status: 'ACTIVE' as const,
  detectionStatus: 'CONFIRMED' as const,

  detectedAt: '2026-09-15 03:42 UTC',
  acquiredAt: '2026-09-15 03:20 UTC',

  location: {
    region: 'Arabian Sea — Lakshadweep Sea Corridor',
    subRegion: 'West of Goa, India EEZ',
    latitude: 15.82,
    longitude: 68.74,
    depth_m: 1840,
  },

  spillProbability: 0.94,
  confidence: 0.91,
  falsePositiveRisk: 0.08,

  estimatedArea: 42.7,
  estimatedAreaStr: '42.7 km²',
  estimatedVolume: '3,200 – 4,800 tonnes',
  spillType: 'Likely Crude Oil',

  releaseWindow: {
    start: '2026-09-14 18:20 UTC',
    end: '2026-09-14 22:10 UTC',
    centerStr: '~20:15 UTC, 14 Sep 2026',
  },

  origin: {
    latitude: 15.91,
    longitude: 68.58,
    confidence: 0.87,
    uncertaintyRadiusKm: 4.2,
    label: 'PROBABLE RELEASE POINT',
  },

  sensor: {
    sarContribution: 0.92,
    opticalContribution: 0.88,
    fusionConfidence: 0.91,
    model: 'DeepOilNet v2.1',
    processingTime: '31 seconds',
    satellite: 'Sentinel-1B / Sentinel-2A',
    passTime: '2026-09-15 03:20 UTC',
  },

  suspectedVessel: 'MV Ocean Crest',
  suspectedVesselMMSI: 636019847,
  attributionScore: 0.91,
  attributionStatus: 'PRIMARY SUSPECT' as const,

  priorityScore: 8.7,
  priorityLabel: 'HIGH' as const,
  urgency: 'HIGH' as const,

  metocean: {
    currentSpeedMs: 0.82,
    currentDirectionDeg: 132,
    windSpeedMs: 3.4,
    windSpeedKmh: 12.4,
    windDirectionDeg: 135,
    waveHeightM: 1.2,
    seaTempC: 28.6,
    driftDirectionLabel: 'Southeast',
    driftDirectionDeg: 133,
  },

  forecast: {
    primaryDirection: 'SE (135°)',
    avgDriftSpeedMs: 0.82,
    shoreImpactEta: '~22 hours',
    shoreImpactRisk: 'HIGH',
  },

  impactAssessment: {
    ecologicalRisk: 0.78,
    fisheriesRisk: 0.63,
    populationRisk: 0.41,
    economicRisk: 0.55,
    overallSeverity: 'HIGH',
  },

  recommendation: {
    action: 'DEPLOY RESPONSE RESOURCES',
    urgencyScore: 8.7,
    confidence: 0.91,
    resources: {
      skimmers: 2,
      booms: 3,
      responseVessels: 1,
    },
    estimatedRecovery: '72%',
    estimatedCoverage: '81%',
    deploymentWindow: '< 6 hours',
    reasoning: [
      'High-confidence spill detection (91%) confirmed by SAR + optical fusion.',
      'Strong vessel attribution to MV Ocean Crest (score 0.91).',
      'Forecast indicates high-risk zone within 22 hours of shore impact.',
      'Significant ecological sensitivity in predicted drift path.',
      'Resource optimization model recommends immediate deployment to Zone R-1.',
    ],
    humanVerificationRequired: true,
  },

  predictionVsReality: {
    iou: 0.82,
    centroidErrorKm: 3.4,
    areaErrorPct: 6.8,
    directionErrorDeg: 8.2,
    etaErrorMin: 41,
    overlapStatus: 'GOOD',
  },
} as const;

const SCENE_2 = {
  sceneId: 'AL-2026-0918-MUM-112',
  incidentId: 'AQL-112',
  status: 'ACTIVE' as const,
  detectionStatus: 'CONFIRMED' as const,

  detectedAt: '2026-09-18 07:14 UTC',
  acquiredAt: '2026-09-18 06:50 UTC',

  location: {
    region: 'Arabian Sea — Mumbai High Oil Field',
    subRegion: 'West of Mumbai, Maharashtra EEZ',
    latitude: 19.07,
    longitude: 71.55,
    depth_m: 710,
  },

  spillProbability: 0.88,
  confidence: 0.85,
  falsePositiveRisk: 0.12,

  estimatedArea: 27.4,
  estimatedAreaStr: '27.4 km²',
  estimatedVolume: '1,800 – 2,900 tonnes',
  spillType: 'Light Fuel Oil',

  releaseWindow: {
    start: '2026-09-17 22:40 UTC',
    end: '2026-09-18 02:30 UTC',
    centerStr: '~00:35 UTC, 18 Sep 2026',
  },

  origin: {
    latitude: 19.14,
    longitude: 71.41,
    confidence: 0.79,
    uncertaintyRadiusKm: 6.1,
    label: 'PROBABLE RELEASE POINT',
  },

  sensor: {
    sarContribution: 0.85,
    opticalContribution: 0.82,
    fusionConfidence: 0.85,
    model: 'DeepOilNet v2.1',
    processingTime: '28 seconds',
    satellite: 'Sentinel-1A / RISAT-2B',
    passTime: '2026-09-18 06:50 UTC',
  },

  suspectedVessel: 'MT Kalinga Star',
  suspectedVesselMMSI: 419001234,
  attributionScore: 0.79,
  attributionStatus: 'PRIMARY SUSPECT' as const,

  priorityScore: 7.4,
  priorityLabel: 'HIGH' as const,
  urgency: 'HIGH' as const,

  metocean: {
    currentSpeedMs: 0.65,
    currentDirectionDeg: 158,
    windSpeedMs: 5.2,
    windSpeedKmh: 18.7,
    windDirectionDeg: 162,
    waveHeightM: 1.8,
    seaTempC: 27.9,
    driftDirectionLabel: 'South-Southeast',
    driftDirectionDeg: 157,
  },

  forecast: {
    primaryDirection: 'SSE (158°)',
    avgDriftSpeedMs: 0.65,
    shoreImpactEta: '~31 hours',
    shoreImpactRisk: 'MEDIUM',
  },

  impactAssessment: {
    ecologicalRisk: 0.62,
    fisheriesRisk: 0.71,
    populationRisk: 0.53,
    economicRisk: 0.68,
    overallSeverity: 'HIGH',
  },

  recommendation: {
    action: 'DEPLOY CONTAINMENT BOOMS',
    urgencyScore: 7.4,
    confidence: 0.85,
    resources: {
      skimmers: 3,
      booms: 4,
      responseVessels: 2,
    },
    estimatedRecovery: '65%',
    estimatedCoverage: '74%',
    deploymentWindow: '< 8 hours',
    reasoning: [
      'Moderate-high spill detection (85%) confirmed by SAR + RISAT fusion.',
      'Vessel attribution to MT Kalinga Star with AIS gap of 4h 10m.',
      'Oil field proximity increases risk of sub-sea pipeline contamination.',
      'Fisheries zone at high risk — monsoon currents accelerate drift.',
      'Containment boom deployment recommended ahead of shore approach.',
    ],
    humanVerificationRequired: true,
  },

  predictionVsReality: {
    iou: 0.74,
    centroidErrorKm: 5.1,
    areaErrorPct: 11.2,
    directionErrorDeg: 12.7,
    etaErrorMin: 58,
    overlapStatus: 'ACCEPTABLE',
  },
} as const;

const SCENE_3 = {
  sceneId: 'AL-2026-0921-CHE-078',
  incidentId: 'AQL-078',
  status: 'ACTIVE' as const,
  detectionStatus: 'CONFIRMED' as const,

  detectedAt: '2026-09-21 11:02 UTC',
  acquiredAt: '2026-09-21 10:35 UTC',

  location: {
    region: 'Bay of Bengal — Chennai Offshore Corridor',
    subRegion: 'East of Chennai, Tamil Nadu EEZ',
    latitude: 13.08,
    longitude: 81.62,
    depth_m: 520,
  },

  spillProbability: 0.97,
  confidence: 0.93,
  falsePositiveRisk: 0.05,

  estimatedArea: 58.3,
  estimatedAreaStr: '58.3 km²',
  estimatedVolume: '4,100 – 6,200 tonnes',
  spillType: 'Heavy Crude Oil',

  releaseWindow: {
    start: '2026-09-21 04:10 UTC',
    end: '2026-09-21 07:55 UTC',
    centerStr: '~06:00 UTC, 21 Sep 2026',
  },

  origin: {
    latitude: 13.19,
    longitude: 81.48,
    confidence: 0.91,
    uncertaintyRadiusKm: 3.8,
    label: 'PROBABLE RELEASE POINT',
  },

  sensor: {
    sarContribution: 0.94,
    opticalContribution: 0.91,
    fusionConfidence: 0.93,
    model: 'DeepOilNet v2.1',
    processingTime: '26 seconds',
    satellite: 'Sentinel-1B / Sentinel-2B',
    passTime: '2026-09-21 10:35 UTC',
  },

  suspectedVessel: 'MV Chennai Express',
  suspectedVesselMMSI: 419005678,
  attributionScore: 0.93,
  attributionStatus: 'PRIMARY SUSPECT' as const,

  priorityScore: 9.2,
  priorityLabel: 'HIGH' as const,
  urgency: 'HIGH' as const,

  metocean: {
    currentSpeedMs: 1.04,
    currentDirectionDeg: 88,
    windSpeedMs: 6.8,
    windSpeedKmh: 24.5,
    windDirectionDeg: 92,
    waveHeightM: 2.4,
    seaTempC: 29.1,
    driftDirectionLabel: 'East',
    driftDirectionDeg: 90,
  },

  forecast: {
    primaryDirection: 'E (90°)',
    avgDriftSpeedMs: 1.04,
    shoreImpactEta: '~14 hours',
    shoreImpactRisk: 'CRITICAL',
  },

  impactAssessment: {
    ecologicalRisk: 0.88,
    fisheriesRisk: 0.82,
    populationRisk: 0.67,
    economicRisk: 0.74,
    overallSeverity: 'HIGH',
  },

  recommendation: {
    action: 'IMMEDIATE EMERGENCY RESPONSE',
    urgencyScore: 9.2,
    confidence: 0.93,
    resources: {
      skimmers: 4,
      booms: 6,
      responseVessels: 3,
    },
    estimatedRecovery: '61%',
    estimatedCoverage: '69%',
    deploymentWindow: '< 4 hours',
    reasoning: [
      'Very high confidence spill (93%) — largest detected extent this quarter.',
      'Strong MV Chennai Express attribution with 5h 45m AIS dark period.',
      'Critical shore impact risk within 14 hours — coastal fisheries in path.',
      'High wave height limits aerial dispersant effectiveness.',
      'Maximum available resources should be mobilised immediately to Zone R-1 and R-2.',
    ],
    humanVerificationRequired: true,
  },

  predictionVsReality: {
    iou: 0.86,
    centroidErrorKm: 2.8,
    areaErrorPct: 4.3,
    directionErrorDeg: 5.6,
    etaErrorMin: 28,
    overlapStatus: 'EXCELLENT',
  },
} as const;

const SCENE_MAP: Record<string, typeof SCENE_1 | typeof SCENE_2 | typeof SCENE_3> = {
  'AL-2026-0915-IND-047': SCENE_1,
  'AL-2026-0918-MUM-112': SCENE_2,
  'AL-2026-0921-CHE-078': SCENE_3,
};

/** Returns the hardcoded demo incident for the given sceneId.
 *  Falls back to the default scene if the sceneId is not recognised. */
export function getDemoIncident(sceneId: string) {
  return SCENE_MAP[sceneId] ?? SCENE_1;
}

/** Default export — Scene 1 (backwards-compat usage). */
export const DEMO_INCIDENT = SCENE_1;

export type DemoIncident = typeof SCENE_1;
