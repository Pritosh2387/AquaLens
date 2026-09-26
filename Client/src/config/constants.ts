export const DEFAULT_SCENE_ID = 'AL-2026-0915-IND-047';

export const AVAILABLE_SCENES = [
  'AL-2026-0915-IND-047',
  'AL-2026-0918-MUM-112',
  'AL-2026-0921-CHE-078',
];

// Centered on AQL-047 Arabian Sea incident (15.82°N, 68.74°E)
export const MAP_DEFAULTS = {
  center: [15.82, 68.74] as [number, number],
  zoom: 9,
  minZoom: 5,
  maxZoom: 16,
  bounds: [
    [15.55, 68.35],
    [16.10, 69.10],
  ] as [[number, number], [number, number]],
};

export const FORECAST_HORIZONS = ['6h', '12h', '24h', '48h', '72h'] as const;

export const DISCLAIMERS = {
  SYNTHETIC:
    'SYNTHETIC MOCK DATA — Operational software architecture prototype. Outputs are not certified scientific measurements.',
  ATTRIBUTION:
    'Vessel attribution represents algorithmic candidate ranking based on AIS correlation, not legal attribution.',
  RECOMMENDATION:
    'Decision-support output only. Human operational command oversight is required for any physical deployment.',
};
