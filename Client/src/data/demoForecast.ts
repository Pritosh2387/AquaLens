/**
 * AquaLens Demo Forecast Data — AQL-047
 * Spill drift horizons: Current → +6h → +12h → +24h
 * Direction: Southeast (135°) at ~0.82 m/s
 */

export const DEMO_FORECAST_HORIZONS = [
  {
    key: '0h',
    label: 'Current (0h)',
    timestamp: '2026-09-15 03:20 UTC',
    area_km2: 42.7,
    centroid: { lat: 15.820, lon: 68.740 },
    opacity: 1.0,
    color: '#dc2626',
    fillColor: '#b91c1c',
    description: 'Detected spill extent at satellite acquisition time.',
  },
  {
    key: '6h',
    label: '+6 Hours',
    timestamp: '2026-09-15 09:20 UTC',
    area_km2: 89.3,
    centroid: { lat: 15.797, lon: 68.763 },
    opacity: 0.82,
    color: '#ea580c',
    fillColor: '#c2410c',
    description: 'Forecast shows spill expanding SE under 0.82 m/s current.',
    coastalProximityKm: 68.4,
  },
  {
    key: '12h',
    label: '+12 Hours',
    timestamp: '2026-09-15 15:20 UTC',
    area_km2: 156.8,
    centroid: { lat: 15.772, lon: 68.788 },
    opacity: 0.65,
    color: '#d97706',
    fillColor: '#b45309',
    description: 'Significant area expansion. Thin sheen reaches 12h extent.',
    coastalProximityKm: 52.1,
  },
  {
    key: '24h',
    label: '+24 Hours',
    timestamp: '2026-09-16 03:20 UTC',
    area_km2: 312.4,
    centroid: { lat: 15.740, lon: 68.816 },
    opacity: 0.48,
    color: '#7c3aed',
    fillColor: '#6d28d9',
    description: 'HIGH RISK zone. Spill entering coastal waters approach.',
    coastalProximityKm: 31.8,
  },
  {
    key: '48h',
    label: '+48 Hours',
    timestamp: '2026-09-17 03:20 UTC',
    area_km2: 485.2,
    centroid: { lat: 15.694, lon: 68.862 },
    opacity: 0.32,
    color: '#0e7490',
    fillColor: '#0891b2',
    description: 'Critical shore approach. Impact imminent for coastal ecosystems.',
    coastalProximityKm: 14.2,
  },
  {
    key: '72h',
    label: '+72 Hours',
    timestamp: '2026-09-18 03:20 UTC',
    area_km2: 620.0,
    centroid: { lat: 15.648, lon: 68.908 },
    opacity: 0.20,
    color: '#065f46',
    fillColor: '#047857',
    description: 'Shore landfall expected. Full ecological impact zone engaged.',
    coastalProximityKm: 3.1,
  },
];

export const DEMO_METOCEAN = {
  currentSpeedMs: 0.82,
  currentDirectionDeg: 132,
  currentDirectionLabel: 'SE (132°)',
  windSpeedMs: 3.4,
  windSpeedKmh: 12.4,
  windDirectionDeg: 135,
  windDirectionLabel: 'SE (135°)',
  waveHeightM: 1.2,
  seaTempC: 28.6,
  salinityPsu: 35.8,
};

export const DEMO_AREA_CHART_DATA = DEMO_FORECAST_HORIZONS.map((h) => ({
  time: h.label,
  area: h.area_km2,
}));
