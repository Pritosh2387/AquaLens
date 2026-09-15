import React, { useState } from 'react';
import { MaritimeMap, MapOriginZone, MapImpactAsset, MapMetoceanData } from './MaritimeMap';
import { TimeSlider } from '../ui/TimeSlider';
import { DataProvenanceBadge } from '../ui/DataProvenanceBadge';
import { DataProvenance } from '../../types/provenance';
import { formatCoordinates } from '../../utils/formatters';
import { useMapStore } from '../../stores/mapStore';
import { Navigation, Compass, Layers, Maximize2, Minimize2, MapPin } from 'lucide-react';
import { cn } from '../../utils/cn';

interface CommandMapFrameProps {
  title?: string;
  subtitle?: string;
  provenance?: DataProvenance;
  status?: string;
  coordinates?: string;
  layers?: { id: string; label: string; active: boolean; color?: string }[];
  spillPolygons?: any[];
  spillCore?: any | null;
  vessels?: any[];
  originZone?: MapOriginZone | null;
  secondaryOriginZones?: MapOriginZone[];
  forecastPolygon?: any | null;
  forecast6h?: any | null;
  forecast12h?: any | null;
  forecast24h?: any | null;
  forwardTrajectory?: [number, number][];
  impactAssets?: MapImpactAsset[];
  impactZonePolygon?: any | null;
  responseZone1?: any | null;
  responseZone2?: any | null;
  metocean?: MapMetoceanData | null;
  backwardTrajectory?: [number, number][];
  showCalloutLabels?: boolean;
  predictedPolygon?: any | null;
  observedPolygon?: any | null;
  height?: string;
  showTimeSlider?: boolean;
  className?: string;
  children?: React.ReactNode;
}

export const CommandMapFrame: React.FC<CommandMapFrameProps> = ({
  title = 'TACTICAL MARITIME SENSOR VIEW',
  subtitle = 'Sentinel-1 SAR / Sentinel-2 Optical / AIS Surveillance Grid',
  provenance = 'OBSERVED',
  status,
  coordinates,
  layers: customLayers,
  spillPolygons = [],
  spillCore = null,
  vessels = [],
  originZone = null,
  secondaryOriginZones = [],
  forecastPolygon = null,
  forecast6h = null,
  forecast12h = null,
  forecast24h = null,
  forwardTrajectory = [],
  impactAssets = [],
  impactZonePolygon = null,
  responseZone1 = null,
  responseZone2 = null,
  metocean = null,
  backwardTrajectory = [],
  showCalloutLabels = true,
  predictedPolygon = null,
  observedPolygon = null,
  height = '520px',
  showTimeSlider = false,
  className,
  children,
}) => {
  const { center, zoom, layers: storeLayers } = useMapStore();
  const [isFullscreen, setIsFullscreen] = useState(false);

  const activeLayersCount = customLayers
    ? customLayers.filter((l) => l.active).length
    : Object.values(storeLayers).filter(Boolean).length;

  return (
    <div className="space-y-3">
      <div
        className={cn(
          'crystalline-panel rounded-xl flex flex-col font-mono relative transition-all duration-300 shadow-[0_8px_32px_rgba(0,0,0,0.8)]',
          isFullscreen && 'fixed inset-4 z-50 shadow-2xl bg-[#020713]/98',
          className
        )}
      >
        {/* 1. Tactical Command Header */}
        <div className="flex flex-wrap items-center justify-between gap-3 px-4 py-2.5 bg-[#08152e]/95 border-b border-[rgba(56,189,248,0.18)]">
          <div className="flex items-center gap-3">
            <div className="w-7 h-7 rounded-lg bg-blue-600/20 border border-blue-500/40 flex items-center justify-center text-sky-300 shrink-0 shadow-[0_0_12px_rgba(37,99,235,0.35)]">
              <Compass className="w-4 h-4 animate-spin-slow" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-xs font-bold tracking-wider text-slate-100 uppercase">
                  {title}
                </h3>
                <DataProvenanceBadge provenance={provenance} size="xs" />
                {status && (
                  <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-emerald-950/60 text-emerald-300 border border-emerald-500/30">
                    {status}
                  </span>
                )}
              </div>
              <p className="text-[10px] text-slate-400 font-normal">{subtitle}</p>
            </div>
          </div>

          {/* Tactical Telemetry Readout & Controls */}
          <div className="flex items-center gap-3 text-xs">
            {/* North Compass Indicator */}
            <div
              className="flex items-center gap-1.5 px-2 py-1 rounded bg-[#030916] border border-blue-900/60 text-[10px] text-sky-300 font-bold"
              title="Nautical Orientation: Grid North"
            >
              <Navigation className="w-3 h-3 text-sky-400 rotate-0" />
              <span>N 000°</span>
            </div>

            {/* Coordinate Readout */}
            <div className="hidden sm:flex items-center gap-1 px-2 py-1 rounded bg-[#030916] border border-blue-900/60 text-[10px] text-slate-300">
              <MapPin className="w-3 h-3 text-sky-400" />
              <span>{coordinates ?? formatCoordinates(center[0], center[1])}</span>
            </div>

            {/* Scale Indicator */}
            <div className="hidden md:flex items-center gap-1 px-2 py-1 rounded bg-[#030916] border border-blue-900/60 text-[10px] text-slate-400">
              <span>SCALE:</span>
              <span className="text-slate-200 font-semibold">1:250,000</span>
            </div>

            {/* Fullscreen Toggle */}
            <button
              onClick={() => setIsFullscreen(!isFullscreen)}
              className="p-1 rounded text-slate-400 hover:text-sky-300 hover:bg-blue-950/60 transition-colors"
              title={isFullscreen ? 'Exit Fullscreen' : 'Expand Fullscreen'}
            >
              {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
            </button>
          </div>
        </div>

        {/* 2. Interactive Maritime Map Viewport */}
        <div className="flex-1 relative">
          {children ? (
            children
          ) : (
            <MaritimeMap
              height={isFullscreen ? 'calc(100vh - 120px)' : height}
              spillPolygons={spillPolygons}
              spillCore={spillCore}
              vessels={vessels}
              originZone={originZone}
              secondaryOriginZones={secondaryOriginZones}
              forecastPolygon={forecastPolygon}
              forecast6h={forecast6h}
              forecast12h={forecast12h}
              forecast24h={forecast24h}
              forwardTrajectory={forwardTrajectory}
              impactAssets={impactAssets}
              impactZonePolygon={impactZonePolygon}
              responseZone1={responseZone1}
              responseZone2={responseZone2}
              metocean={metocean}
              backwardTrajectory={backwardTrajectory}
              showCalloutLabels={showCalloutLabels}
              predictedPolygon={predictedPolygon}
              observedPolygon={observedPolygon}
            />
          )}
        </div>

        {/* 3. Bottom Status & Telemetry Bar */}
        <div className="flex flex-wrap items-center justify-between gap-2 px-4 py-1.5 bg-[#051126]/95 border-t border-[rgba(56,189,248,0.14)] text-[10px] text-slate-400">
          <div className="flex items-center gap-3">
            <span className="flex items-center gap-1">
              <Layers className="w-3 h-3 text-sky-400" />
              <span>ACTIVE LAYERS: {activeLayersCount}</span>
            </span>
            <span className="hidden sm:inline text-slate-600">|</span>
            <span className="hidden sm:inline">ZOOM: {zoom}x</span>
            <span className="hidden md:inline text-slate-600">|</span>
            <span className="hidden md:inline">PROJECTION: EPSG:3857 (SPHERICAL MERCATOR)</span>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-slate-500">BASEMAP:</span>
            <span className="text-slate-300 font-medium">ESRI WORLD IMAGERY</span>
          </div>
        </div>
      </div>

      {/* Render TimeSlider if enabled */}
      {showTimeSlider && <TimeSlider />}
    </div>
  );
};


