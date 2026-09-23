/**
 * AquaLens Demo Incident — AQL-047
 * Arabian Sea Oil Spill Incident
 *
 * This is the SINGLE SOURCE OF TRUTH for the hardcoded demo.
 * All pages, charts, and map layers must reference this object
 * so the demo remains internally consistent.
 *
 * To replace with live API data: import the pipeline response
 * and pass it through the same shape adapters used here.
 */

export const DEMO_INCIDENT = {
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

export type DemoIncident = typeof DEMO_INCIDENT;
