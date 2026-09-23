export interface MapFeature {
  id: string;
  type: 'slick' | 'vessel' | 'origin' | 'forecast' | 'asset';
  geometry?: any;
  lat?: number;
  lon?: number;
  properties?: Record<string, any>;
}

export interface MapViewport {
  center: [number, number];
  zoom: number;
}
