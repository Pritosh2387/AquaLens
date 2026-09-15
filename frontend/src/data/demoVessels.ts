/**
 * AquaLens Demo Vessels — AQL-047
 * 5 candidate vessels for the Arabian Sea incident.
 * Vessel 1 (MV Ocean Crest) is the primary suspect.
 */

export interface DemoVessel {
  rank: number;
  vessel_name: string;
  mmsi: number;
  imo: string;
  vessel_type: string;
  flag: string;
  lat: number;
  lon: number;
  attribution_score: number;
  risk_level: 'HIGH' | 'MEDIUM' | 'LOW';
  aisEvidence: 'Strong' | 'Medium' | 'Weak';
  sarEvidence: 'Strong' | 'Medium' | 'Weak';
  trajectory: 'High' | 'Medium' | 'Low';
  isDark: boolean;
  aisGapDuration: string;
  aisGapStart: string;
  positionErrorKm: number;
  originProximityKm: number;
  timingDeltaHours: number;
  anomalyScore: number;
  speed_knots: number;
  heading_deg: number;
  status: string;
  explanation: string;
  historical_track: [number, number][];
}

export const DEMO_VESSELS: DemoVessel[] = [
  {
    rank: 1,
    vessel_name: 'MV Ocean Crest',
    mmsi: 636019847,
    imo: '9482031',
    vessel_type: 'Crude Oil Tanker',
    flag: 'Liberia',
    lat: 15.908,
    lon: 68.577,
    attribution_score: 0.91,
    risk_level: 'HIGH',
    aisEvidence: 'Strong',
    sarEvidence: 'Strong',
    trajectory: 'High',
    isDark: true,
    aisGapStart: '2026-09-14 19:08 UTC',
    aisGapDuration: '3h 22m',
    positionErrorKm: 0.9,
    originProximityKm: 1.4,
    timingDeltaHours: 0.6,
    anomalyScore: 0.93,
    speed_knots: 4.2,
    heading_deg: 138,
    status: 'PRIMARY SUSPECT',
    explanation:
      'AIS gap of 3h 22m centered on release window. SAR-detected dark vessel at origin coordinates. Trajectory matches reverse particle drift. High anomaly behavior score.',
    historical_track: [
      [16.08, 68.42],
      [16.02, 68.46],
      [15.97, 68.50],
      [15.94, 68.54],
      [15.91, 68.58], // at origin
      [15.87, 68.62],
      [15.82, 68.68],
      [15.79, 68.71],
    ],
  },
  {
    rank: 2,
    vessel_name: 'MT Nalini Star',
    mmsi: 419000312,
    imo: '9374821',
    vessel_type: 'Product Tanker',
    flag: 'India',
    lat: 15.87,
    lon: 68.63,
    attribution_score: 0.74,
    risk_level: 'HIGH',
    aisEvidence: 'Medium',
    sarEvidence: 'Strong',
    trajectory: 'Medium',
    isDark: false,
    aisGapStart: '2026-09-14 20:30 UTC',
    aisGapDuration: '1h 10m',
    positionErrorKm: 2.8,
    originProximityKm: 3.9,
    timingDeltaHours: 2.1,
    anomalyScore: 0.68,
    speed_knots: 9.1,
    heading_deg: 145,
    status: 'CANDIDATE',
    explanation:
      'Brief AIS gap overlaps release window edge. SAR shows vessel silhouette near spill vicinity. Trajectory partially consistent but timing delta is 2.1 hours.',
    historical_track: [
      [16.05, 68.52],
      [15.99, 68.56],
      [15.93, 68.60],
      [15.87, 68.63],
      [15.82, 68.69],
    ],
  },
  {
    rank: 3,
    vessel_name: 'MV Dharitri',
    mmsi: 419000587,
    imo: '9218743',
    vessel_type: 'General Cargo',
    flag: 'India',
    lat: 15.74,
    lon: 68.80,
    attribution_score: 0.61,
    risk_level: 'MEDIUM',
    aisEvidence: 'Strong',
    sarEvidence: 'Medium',
    trajectory: 'Medium',
    isDark: false,
    aisGapStart: 'N/A',
    aisGapDuration: '0h 00m',
    positionErrorKm: 5.2,
    originProximityKm: 7.1,
    timingDeltaHours: 4.8,
    anomalyScore: 0.52,
    speed_knots: 11.4,
    heading_deg: 188,
    status: 'CANDIDATE',
    explanation:
      'Continuous AIS throughout window. Vessel was 7.1 km from estimated origin at time of release. Route passes through spill zone but no AIS anomaly detected.',
    historical_track: [
      [16.10, 68.62],
      [16.00, 68.66],
      [15.90, 68.70],
      [15.80, 68.76],
      [15.74, 68.80],
    ],
  },
  {
    rank: 4,
    vessel_name: 'MV Sea Leopard',
    mmsi: 525005241,
    imo: '9301294',
    vessel_type: 'Bulk Carrier',
    flag: 'Indonesia',
    lat: 15.65,
    lon: 68.94,
    attribution_score: 0.38,
    risk_level: 'LOW',
    aisEvidence: 'Strong',
    sarEvidence: 'Weak',
    trajectory: 'Low',
    isDark: false,
    aisGapStart: 'N/A',
    aisGapDuration: '0h 00m',
    positionErrorKm: 11.4,
    originProximityKm: 14.6,
    timingDeltaHours: 7.2,
    anomalyScore: 0.28,
    speed_knots: 13.8,
    heading_deg: 160,
    status: 'LOW PROBABILITY',
    explanation:
      'Full AIS track available. No SAR match. Too far from origin at release time. Consistent with transit route, no behavioral anomaly.',
    historical_track: [
      [16.00, 68.80],
      [15.88, 68.86],
      [15.76, 68.90],
      [15.65, 68.94],
    ],
  },
  {
    rank: 5,
    vessel_name: 'FV Coastal Mariner',
    mmsi: 419178023,
    imo: '—',
    vessel_type: 'Fishing Vessel',
    flag: 'India',
    lat: 16.02,
    lon: 68.48,
    attribution_score: 0.22,
    risk_level: 'LOW',
    aisEvidence: 'Weak',
    sarEvidence: 'Weak',
    trajectory: 'Low',
    isDark: false,
    aisGapStart: 'N/A',
    aisGapDuration: '0h 45m',
    positionErrorKm: 16.2,
    originProximityKm: 18.8,
    timingDeltaHours: 9.5,
    anomalyScore: 0.15,
    speed_knots: 5.6,
    heading_deg: 220,
    status: 'CLEARED',
    explanation:
      'Fishing vessel. Too small for crude oil discharge at this volume. Located north of origin area. Short AIS gap is typical for fishing operations.',
    historical_track: [
      [16.18, 68.36],
      [16.10, 68.40],
      [16.04, 68.45],
      [16.02, 68.48],
    ],
  },
];

/** AIS contacts visible on map (includes non-candidate vessels) */
export const DEMO_AIS_CONTACTS = [
  { mmsi: 636019847, name: 'MV Ocean Crest', lat: 15.908, lon: 68.577, type: 'Tanker', isDark: true },
  { mmsi: 419000312, name: 'MT Nalini Star', lat: 15.87, lon: 68.63, type: 'Tanker', isDark: false },
  { mmsi: 419000587, name: 'MV Dharitri', lat: 15.74, lon: 68.80, type: 'Cargo', isDark: false },
  { mmsi: 525005241, name: 'MV Sea Leopard', lat: 15.65, lon: 68.94, type: 'Bulk Carrier', isDark: false },
  { mmsi: 419178023, name: 'FV Coastal Mariner', lat: 16.02, lon: 68.48, type: 'Fishing', isDark: false },
];
