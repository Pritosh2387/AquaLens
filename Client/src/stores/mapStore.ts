import { create } from 'zustand';
import { MAP_DEFAULTS } from '../config/constants';

export interface MapLayers {
  // Detection
  satelliteImagery: boolean;
  slicks: boolean;
  spillProbability: boolean;
  // Metocean
  currentVectors: boolean;
  windVectors: boolean;
  // Vessels
  vessels: boolean;
  darkVessels: boolean;
  aisTracks: boolean;
  // Hindcast / Forecast
  hindcastOrigin: boolean;
  forecast6h: boolean;
  forecast12h: boolean;
  forecast24h: boolean;
  forecastPlume: boolean;
  // Impact / Response
  impactAssets: boolean;
  impactZones: boolean;
  responseZones: boolean;
  // Other
  bathymetry: boolean;
}

interface MapState {
  center: [number, number];
  zoom: number;
  layers: MapLayers;
  bounds: [[number, number], [number, number]] | null;
  selectedFeature: {
    type: 'vessel' | 'slick' | 'origin' | 'asset';
    id: string;
    data?: any;
  } | null;

  setCenter: (center: [number, number]) => void;
  setZoom: (zoom: number) => void;
  setBounds: (bounds: [[number, number], [number, number]] | null) => void;
  toggleLayer: (layer: keyof MapLayers) => void;
  setSelectedFeature: (feature: MapState['selectedFeature']) => void;
  resetView: () => void;
}

export const useMapStore = create<MapState>((set) => ({
  center: MAP_DEFAULTS.center,
  zoom: MAP_DEFAULTS.zoom,
  bounds: null,
  layers: {
    satelliteImagery: false,
    slicks: true,
    spillProbability: true,
    currentVectors: true,
    windVectors: true,
    vessels: true,
    darkVessels: true,
    aisTracks: true,
    hindcastOrigin: true,
    forecast6h: true,
    forecast12h: true,
    forecast24h: true,
    forecastPlume: true,
    impactAssets: true,
    impactZones: true,
    responseZones: true,
    bathymetry: false,
  },
  selectedFeature: null,

  setCenter: (center) => set({ center }),
  setZoom: (zoom) => set({ zoom }),
  setBounds: (bounds) => set({ bounds }),
  toggleLayer: (layer) =>
    set((state) => ({
      layers: { ...state.layers, [layer]: !state.layers[layer] },
    })),
  setSelectedFeature: (feature) => set({ selectedFeature: feature }),
  resetView: () => set({ center: MAP_DEFAULTS.center, zoom: MAP_DEFAULTS.zoom }),
}));
