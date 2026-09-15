/**
 * AquaLens Demo Map Data — AQL-047
 *
 * All GeoJSON geometries for the Arabian Sea incident.
 * Center of incident: 15.82°N, 68.74°E
 * Origin zone:       15.91°N, 68.58°E
 *
 * Coordinates are [longitude, latitude] in GeoJSON format.
 * Leaflet expects [latitude, longitude], so adapters flip them.
 */

// ---------------------------------------------------------------------------
// SPILL POLYGONS — Organic irregular shape (~42.7 km²)
// Main detected slick with high-confidence inner core
// ---------------------------------------------------------------------------

/** Outer detected oil spill boundary — full extent */
export const DEMO_SPILL_POLYGON = {
  type: 'Feature' as const,
  properties: {
    slick_id: 'SLICK-AQL-047-A',
    mean_probability: 0.94,
    area_km2: 42.7,
    label: 'DETECTED SPILL',
    confidence: 'HIGH',
  },
  geometry: {
    type: 'Polygon' as const,
    coordinates: [
      [
        [68.700, 15.800],
        [68.714, 15.792],
        [68.728, 15.788],
        [68.742, 15.790],
        [68.758, 15.796],
        [68.772, 15.804],
        [68.780, 15.812],
        [68.784, 15.822],
        [68.782, 15.834],
        [68.776, 15.844],
        [68.766, 15.852],
        [68.752, 15.856],
        [68.736, 15.854],
        [68.720, 15.848],
        [68.706, 15.838],
        [68.696, 15.826],
        [68.692, 15.814],
        [68.695, 15.806],
        [68.700, 15.800],
      ],
    ],
  },
};

/** Inner high-confidence spill core */
export const DEMO_SPILL_CORE = {
  type: 'Feature' as const,
  properties: {
    slick_id: 'SLICK-AQL-047-CORE',
    mean_probability: 0.97,
    area_km2: 18.3,
    label: 'HIGH CONFIDENCE ZONE',
    confidence: 'VERY_HIGH',
  },
  geometry: {
    type: 'Polygon' as const,
    coordinates: [
      [
        [68.718, 15.806],
        [68.730, 15.800],
        [68.742, 15.799],
        [68.754, 15.803],
        [68.762, 15.811],
        [68.766, 15.820],
        [68.764, 15.830],
        [68.756, 15.838],
        [68.744, 15.842],
        [68.730, 15.840],
        [68.718, 15.834],
        [68.711, 15.824],
        [68.711, 15.814],
        [68.718, 15.806],
      ],
    ],
  },
};

// ---------------------------------------------------------------------------
// ORIGIN ZONE — Probable release point
// ---------------------------------------------------------------------------

export const DEMO_ORIGIN_ZONE = {
  lat: 15.91,
  lon: 68.58,
  radiusKm: 4.2,
  probability: 0.87,
  label: 'PROBABLE RELEASE POINT',
};

export const DEMO_SECONDARY_ORIGIN_ZONES = [
  { lat: 15.88, lon: 68.54, radiusKm: 6.5, probability: 0.61, label: 'ORIGIN ZONE B' },
  { lat: 15.94, lon: 68.62, radiusKm: 5.1, probability: 0.48, label: 'ORIGIN ZONE C' },
];

// ---------------------------------------------------------------------------
// HINDCAST TRAJECTORY — Backward drift from current spill to origin
// Points go from spill center (15.82°N, 68.74°E) backward to origin (15.91°N, 68.58°E)
// Following SE current reversed → trajectory goes NW
// ---------------------------------------------------------------------------

/** Backward trajectory: current spill → origin (Leaflet [lat, lon] format) */
export const DEMO_HINDCAST_TRAJECTORY: [number, number][] = [
  [15.820, 68.740], // current spill center
  [15.832, 68.728],
  [15.843, 68.718],
  [15.852, 68.706],
  [15.862, 68.696],
  [15.872, 68.684],
  [15.882, 68.672],
  [15.893, 68.662],
  [15.904, 68.652],
  [15.910, 68.580], // probable origin
];

/** Forward drift trajectory for forecast (+24h direction SE) */
export const DEMO_FORWARD_TRAJECTORY: [number, number][] = [
  [15.820, 68.740],
  [15.808, 68.756],
  [15.796, 68.772],
  [15.782, 68.790],
  [15.768, 68.808],
  [15.752, 68.828],
  [15.736, 68.850],
];

// ---------------------------------------------------------------------------
// FORECAST POLYGONS — Progressive drift SE
// Each polygon is shifted SE and expanded relative to the current spill
// ---------------------------------------------------------------------------

/** +6h forecast: slightly expanded, shifted SE */
export const DEMO_FORECAST_6H = {
  type: 'Feature' as const,
  properties: { horizon: '+6h', area_km2: 89.3, probability: 0.88 },
  geometry: {
    type: 'Polygon' as const,
    coordinates: [
      [
        [68.710, 15.782],
        [68.726, 15.774],
        [68.742, 15.769],
        [68.760, 15.771],
        [68.778, 15.777],
        [68.796, 15.785],
        [68.808, 15.795],
        [68.814, 15.807],
        [68.812, 15.821],
        [68.804, 15.833],
        [68.790, 15.841],
        [68.774, 15.845],
        [68.756, 15.843],
        [68.736, 15.836],
        [68.718, 15.824],
        [68.706, 15.810],
        [68.702, 15.796],
        [68.706, 15.787],
        [68.710, 15.782],
      ],
    ],
  },
};

/** +12h forecast: further expanded, shifted more SE */
export const DEMO_FORECAST_12H = {
  type: 'Feature' as const,
  properties: { horizon: '+12h', area_km2: 156.8, probability: 0.79 },
  geometry: {
    type: 'Polygon' as const,
    coordinates: [
      [
        [68.724, 15.762],
        [68.742, 15.752],
        [68.762, 15.746],
        [68.784, 15.749],
        [68.806, 15.756],
        [68.826, 15.766],
        [68.840, 15.778],
        [68.848, 15.792],
        [68.846, 15.808],
        [68.836, 15.822],
        [68.820, 15.832],
        [68.800, 15.836],
        [68.778, 15.833],
        [68.754, 15.824],
        [68.734, 15.812],
        [68.720, 15.796],
        [68.714, 15.778],
        [68.718, 15.767],
        [68.724, 15.762],
      ],
    ],
  },
};

/** +24h forecast: large zone, significant SE drift */
export const DEMO_FORECAST_24H = {
  type: 'Feature' as const,
  properties: { horizon: '+24h', area_km2: 312.4, probability: 0.64 },
  geometry: {
    type: 'Polygon' as const,
    coordinates: [
      [
        [68.742, 15.740],
        [68.764, 15.728],
        [68.790, 15.720],
        [68.818, 15.723],
        [68.846, 15.731],
        [68.870, 15.743],
        [68.888, 15.758],
        [68.898, 15.774],
        [68.896, 15.792],
        [68.882, 15.808],
        [68.862, 15.820],
        [68.838, 15.826],
        [68.812, 15.822],
        [68.784, 15.812],
        [68.760, 15.798],
        [68.742, 15.780],
        [68.734, 15.760],
        [68.738, 15.748],
        [68.742, 15.740],
      ],
    ],
  },
};

// ---------------------------------------------------------------------------
// UNCERTAINTY & IMPACT ZONES
// ---------------------------------------------------------------------------

/** Forecast uncertainty outer band */
export const DEMO_UNCERTAINTY_ZONE = {
  type: 'Feature' as const,
  properties: { label: 'FORECAST UNCERTAINTY', probability: 0.45 },
  geometry: {
    type: 'Polygon' as const,
    coordinates: [
      [
        [68.720, 15.710],
        [68.760, 15.695],
        [68.800, 15.690],
        [68.840, 15.695],
        [68.875, 15.706],
        [68.906, 15.722],
        [68.924, 15.740],
        [68.932, 15.762],
        [68.928, 15.785],
        [68.912, 15.806],
        [68.888, 15.822],
        [68.856, 15.832],
        [68.820, 15.835],
        [68.782, 15.828],
        [68.748, 15.814],
        [68.722, 15.796],
        [68.706, 15.774],
        [68.704, 15.748],
        [68.710, 15.727],
        [68.720, 15.710],
      ],
    ],
  },
};

/** High-risk impact zone (coastline approach) */
export const DEMO_IMPACT_ZONE_HIGH = {
  type: 'Feature' as const,
  properties: { label: 'HIGH RISK ZONE', riskLevel: 'HIGH', impactProbability: 0.78 },
  geometry: {
    type: 'Polygon' as const,
    coordinates: [
      [
        [68.800, 15.680],
        [68.840, 15.668],
        [68.876, 15.674],
        [68.900, 15.690],
        [68.908, 15.708],
        [68.898, 15.726],
        [68.876, 15.736],
        [68.846, 15.738],
        [68.818, 15.730],
        [68.800, 15.714],
        [68.796, 15.696],
        [68.800, 15.680],
      ],
    ],
  },
};

/** Response deployment zone 1 */
export const DEMO_RESPONSE_ZONE_1 = {
  type: 'Feature' as const,
  properties: { label: 'RESPONSE ZONE R-1', priority: 'PRIMARY', resources: '2 Skimmers, 2 Booms' },
  geometry: {
    type: 'Polygon' as const,
    coordinates: [
      [
        [68.740, 15.790],
        [68.758, 15.784],
        [68.770, 15.790],
        [68.768, 15.800],
        [68.754, 15.808],
        [68.740, 15.802],
        [68.736, 15.794],
        [68.740, 15.790],
      ],
    ],
  },
};

/** Response deployment zone 2 */
export const DEMO_RESPONSE_ZONE_2 = {
  type: 'Feature' as const,
  properties: { label: 'RESPONSE ZONE R-2', priority: 'SECONDARY', resources: '1 Boom' },
  geometry: {
    type: 'Polygon' as const,
    coordinates: [
      [
        [68.770, 15.762],
        [68.786, 15.756],
        [68.796, 15.762],
        [68.794, 15.772],
        [68.780, 15.778],
        [68.768, 15.772],
        [68.766, 15.764],
        [68.770, 15.762],
      ],
    ],
  },
};

// ---------------------------------------------------------------------------
// PREDICTED vs OBSERVED (Prediction vs Reality)
// ---------------------------------------------------------------------------

/** Model-predicted spill polygon (from earlier 6h forecast) */
export const DEMO_PREDICTED_POLYGON = {
  type: 'Feature' as const,
  properties: { label: 'PREDICTED', area_km2: 46.1 },
  geometry: {
    type: 'Polygon' as const,
    coordinates: [
      [
        [68.698, 15.798],
        [68.712, 15.790],
        [68.726, 15.786],
        [68.742, 15.788],
        [68.758, 15.794],
        [68.772, 15.803],
        [68.780, 15.813],
        [68.782, 15.825],
        [68.778, 15.837],
        [68.766, 15.847],
        [68.750, 15.851],
        [68.732, 15.849],
        [68.716, 15.841],
        [68.702, 15.830],
        [68.694, 15.818],
        [68.692, 15.806],
        [68.696, 15.800],
        [68.698, 15.798],
      ],
    ],
  },
};

/** Newly observed spill polygon (current satellite pass) */
export const DEMO_OBSERVED_POLYGON = DEMO_SPILL_POLYGON;

// ---------------------------------------------------------------------------
// CONVENIENCE EXPORT — All polygons as array for the CommandMapFrame
// ---------------------------------------------------------------------------

export const DEMO_ALL_SPILL_POLYGONS = [DEMO_SPILL_POLYGON, DEMO_SPILL_CORE];
