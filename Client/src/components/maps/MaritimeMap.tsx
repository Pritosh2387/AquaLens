import React, { useEffect } from 'react';
import {
  MapContainer,
  TileLayer,
  Polygon,
  Circle,
  Marker,
  Popup,
  Polyline,
  useMap,
} from 'react-leaflet';
import L from 'leaflet';
import { useMapStore } from '../../stores/mapStore';
import { MapLegend } from './MapLegend';
import { LayerControl } from './LayerControl';
import { Crosshair, Maximize2, Wind, Compass, Clock, Ship } from 'lucide-react';
import { cn } from '../../utils/cn';

// Leaflet default icon fix
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

// ─── Icon Factories ─────────────────────────────────────────────────────────

const createCandidateVesselIcon = (
  rank: number,
  name: string,
  score: number,
  riskLevel: string = 'HIGH',
  isDark = false,
) => {
  const isHigh = riskLevel === 'HIGH' || score > 0.7;
  const isMed = riskLevel === 'MEDIUM' || (score > 0.4 && score <= 0.7);
  const color = isHigh ? '#ef4444' : isMed ? '#f59e0b' : '#10b981';
  const darkBadge = isDark
    ? `<span style="margin-left:4px;background:#7c3aed;color:#fff;font-size:8px;padding:1px 4px;border-radius:3px;font-weight:900;">DARK</span>`
    : '';
  return L.divIcon({
    className: 'custom-vessel-badge-marker',
    html: `
      <div style="display:inline-flex;align-items:center;gap:5px;background:rgba(4,9,21,0.94);border:1.5px solid ${color};border-radius:6px;padding:3px 8px;box-shadow:0 0 12px ${color}60;font-family:monospace;white-space:nowrap;">
        <div style="width:9px;height:9px;border-radius:50%;background:${color};box-shadow:0 0 6px ${color};animation:pulse 2s infinite;flex-shrink:0;"></div>
        <div style="display:flex;flex-direction:column;align-items:flex-start;">
          <span style="color:#ffffff;font-size:10px;font-weight:bold;line-height:1.2;">#${rank} ${name}${darkBadge}</span>
          <span style="color:${color};font-size:9px;font-weight:bold;">ATTR: ${(score * 100).toFixed(0)}% [${riskLevel}]</span>
        </div>
      </div>
    `,
    iconSize: [160, 32],
    iconAnchor: [80, 16],
  });
};

const createOriginBadgeIcon = (label = 'PROBABLE RELEASE POINT') =>
  L.divIcon({
    className: 'custom-origin-badge-marker',
    html: `
      <div style="display:inline-flex;align-items:center;gap:6px;background:rgba(67,56,202,0.96);border:1.5px solid #a5b4fc;border-radius:6px;padding:4px 10px;box-shadow:0 0 18px rgba(99,102,241,0.8);font-family:monospace;white-space:nowrap;color:#ffffff;font-size:10px;font-weight:bold;">
        <span style="display:inline-block;width:8px;height:8px;background:#38bdf8;border-radius:50%;animation:pulse 1.5s infinite;"></span>
        <span>${label}</span>
      </div>
    `,
    iconSize: [210, 26],
    iconAnchor: [105, 13],
  });

const createMapLabelIcon = (label: string, color = '#22d3ee') =>
  L.divIcon({
    className: 'custom-map-label',
    html: `
      <div style="display:inline-flex;align-items:center;gap:4px;background:rgba(3,8,20,0.9);border:1px solid ${color}55;border-radius:4px;padding:2px 7px;font-family:monospace;white-space:nowrap;color:${color};font-size:9px;font-weight:bold;letter-spacing:0.05em;">
        <span>${label}</span>
      </div>
    `,
    iconSize: [180, 20],
    iconAnchor: [90, 10],
  });

const createAssetIcon = (name: string, riskScore = 0.5, sensitivity = '') => {
  const isHigh = riskScore > 0.7 || sensitivity === 'CRITICAL';
  const borderColor = isHigh ? '#f43f5e' : '#a78bfa';
  return L.divIcon({
    className: 'custom-asset-marker',
    html: `
      <div style="display:inline-flex;align-items:center;gap:5px;background:rgba(15,10,30,0.92);border:1.5px solid ${borderColor};border-radius:5px;padding:2px 7px;box-shadow:0 0 8px ${borderColor}50;font-family:monospace;white-space:nowrap;">
        <div style="width:10px;height:10px;background:#8b5cf6;border-radius:2px;display:flex;align-items:center;justify-content:center;flex-shrink:0;"><span style="color:#fff;font-size:7px;font-weight:900;">◆</span></div>
        <span style="color:#e9d5ff;font-size:9.5px;font-weight:bold;">${name}</span>
      </div>
    `,
    iconSize: [160, 22],
    iconAnchor: [80, 11],
  });
};

// ─── Types ──────────────────────────────────────────────────────────────────

export interface MapOriginZone {
  lat: number;
  lon: number;
  radiusKm: number;
  probability?: number;
  label?: string;
}

export interface MapImpactAsset {
  name: string;
  lat: number;
  lon: number;
  type?: string;
  riskScore?: number;
  sensitivity?: string;
}

export interface MapMetoceanData {
  currentSpeedMs?: number;
  currentDirectionDeg?: number;
  windSpeedMs?: number;
  windDirectionDeg?: number;
  waveHeightM?: number;
}

interface MaritimeMapProps {
  interactive?: boolean;
  showHUD?: boolean;
  className?: string;
  height?: string;
  // Spill
  spillPolygons?: any[];
  spillCore?: any | null;
  // Origin
  originZone?: MapOriginZone | null;
  secondaryOriginZones?: MapOriginZone[];
  // Trajectories
  backwardTrajectory?: [number, number][];
  forwardTrajectory?: [number, number][];
  // Forecast horizons
  forecast6h?: any | null;
  forecast12h?: any | null;
  forecast24h?: any | null;
  forecastPolygon?: any | null; // single horizon override
  // Vessels
  vessels?: any[];
  // Impact
  impactAssets?: MapImpactAsset[];
  impactZonePolygon?: any | null;
  responseZone1?: any | null;
  responseZone2?: any | null;
  // Metocean
  metocean?: MapMetoceanData | null;
  // Overlay labels
  showCalloutLabels?: boolean;
  // Prediction vs Reality
  predictedPolygon?: any | null;
  observedPolygon?: any | null;
  // Time
  timeOffset?: number;
}

// ─── Map Controller ──────────────────────────────────────────────────────────

function MapController({
  center,
  zoom,
  bounds,
}: {
  center: [number, number];
  zoom: number;
  bounds: [[number, number], [number, number]] | null;
}) {
  const map = useMap();
  useEffect(() => {
    if (bounds) {
      map.fitBounds(bounds, { padding: [40, 40] });
    } else {
      map.setView(center, zoom);
    }
  }, [center, zoom, bounds, map]);
  return null;
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function geoJsonToLatLngs(geom: any): [number, number][] {
  if (!geom?.coordinates?.[0]) return [];
  return geom.coordinates[0].map((pt: [number, number]) => [pt[1], pt[0]] as [number, number]);
}

function formatCoord(lat: number, lon: number) {
  const latStr = `${Math.abs(lat).toFixed(2)}° ${lat >= 0 ? 'N' : 'S'}`;
  const lonStr = `${Math.abs(lon).toFixed(2)}° ${lon >= 0 ? 'E' : 'W'}`;
  return `${latStr}, ${lonStr}`;
}

// ─── Main Component ──────────────────────────────────────────────────────────

export const MaritimeMap: React.FC<MaritimeMapProps> = ({
  interactive = true,
  showHUD = true,
  className,
  height = '500px',
  spillPolygons = [],
  spillCore = null,
  originZone = null,
  secondaryOriginZones = [],
  backwardTrajectory = [],
  forwardTrajectory = [],
  forecast6h = null,
  forecast12h = null,
  forecast24h = null,
  forecastPolygon = null,
  vessels = [],
  impactAssets = [],
  impactZonePolygon = null,
  responseZone1 = null,
  responseZone2 = null,
  metocean = null,
  showCalloutLabels = true,
  predictedPolygon = null,
  observedPolygon = null,
  timeOffset = 0,
}) => {
  const { center, zoom, layers, bounds, resetView, setBounds } = useMapStore();

  // Auto-fit to spill on mount
  const didAutoFit = React.useRef(false);
  React.useEffect(() => {
    if (!didAutoFit.current && spillPolygons.length > 0) {
      didAutoFit.current = true;
      const pts: [number, number][] = [];
      spillPolygons.forEach((p) => {
        geoJsonToLatLngs(p.geometry || p).forEach((pt) => pts.push(pt));
      });
      if (pts.length > 0) {
        const lats = pts.map((p) => p[0]);
        const lons = pts.map((p) => p[1]);
        setBounds([
          [Math.min(...lats) - 0.08, Math.min(...lons) - 0.08],
          [Math.max(...lats) + 0.08, Math.max(...lons) + 0.08],
        ]);
      }
    }
  }, [spillPolygons, setBounds]);

  const handleFit = () => {
    const pts: [number, number][] = [];
    spillPolygons.forEach((p) =>
      geoJsonToLatLngs(p.geometry || p).forEach((pt) => pts.push(pt)),
    );
    if (originZone) pts.push([originZone.lat, originZone.lon]);
    if (pts.length > 0) {
      const lats = pts.map((p) => p[0]);
      const lons = pts.map((p) => p[1]);
      setBounds([
        [Math.min(...lats) - 0.08, Math.min(...lons) - 0.08],
        [Math.max(...lats) + 0.08, Math.max(...lons) + 0.08],
      ]);
    } else {
      resetView();
    }
  };

  // Centroid of main spill for label placement
  const spillCentroid: [number, number] = spillPolygons.length > 0
    ? (() => {
        const pts = geoJsonToLatLngs(spillPolygons[0].geometry || spillPolygons[0]);
        if (pts.length === 0) return [15.82, 68.74] as [number, number];
        const lat = pts.reduce((s, p) => s + p[0], 0) / pts.length;
        const lon = pts.reduce((s, p) => s + p[1], 0) / pts.length;
        return [lat, lon] as [number, number];
      })()
    : [15.82, 68.74];

  return (
    <div
      className={cn(
        'relative w-full rounded-lg overflow-hidden border border-[rgba(56,189,248,0.2)] bg-[#040915]',
        className,
      )}
      style={{ height }}
    >
      <MapContainer
        center={center}
        zoom={zoom}
        zoomControl={interactive}
        scrollWheelZoom={interactive}
        dragging={interactive}
        className="w-full h-full"
      >
        <MapController center={center} zoom={zoom} bounds={bounds} />

        {/* Dark Satellite Basemap */}
        <TileLayer
          attribution="&copy; Esri, Maxar, Earthstar Geographics"
          url="https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}"
          maxZoom={19}
        />

        {/* ── SPILL POLYGONS ──────────────────────────────────────────── */}
        {layers.slicks &&
          spillPolygons.map((poly, idx) => {
            const latLngs = geoJsonToLatLngs(poly.geometry || poly);
            if (latLngs.length === 0) return null;
            const props = poly.properties ?? poly;
            const prob = props.mean_probability ?? 0.94;
            const area = props.area_km2;
            return (
              <Polygon
                key={`slick-${idx}`}
                positions={latLngs}
                pathOptions={{
                  color: '#f59e0b',
                  fillColor: '#92400e',
                  fillOpacity: 0.62,
                  weight: 2.5,
                  className: 'spill-polygon-animate',
                }}
              >
                <Popup>
                  <div className="text-xs font-mono text-slate-200">
                    <p className="font-bold text-amber-400">DETECTED OIL SPILL — AQL-047</p>
                    <p>Probability: <span className="text-amber-300 font-bold">{(prob * 100).toFixed(0)}%</span></p>
                    {area && <p>Area: <span className="text-sky-300 font-bold">{area.toFixed(1)} km²</span></p>}
                    <p>Status: <span className="text-emerald-400 font-bold">CONFIRMED</span></p>
                  </div>
                </Popup>
              </Polygon>
            );
          })}

        {/* Spill High-Confidence Core */}
        {layers.spillProbability && spillCore?.geometry && (
          <Polygon
            positions={geoJsonToLatLngs(spillCore.geometry)}
            pathOptions={{
              color: '#fbbf24',
              fillColor: '#b45309',
              fillOpacity: 0.82,
              weight: 1.5,
            }}
          >
            <Popup>
              <div className="text-xs font-mono">
                <p className="font-bold text-amber-300">HIGH CONFIDENCE CORE</p>
                <p>Probability: 97%</p>
                <p>Area: 18.3 km²</p>
              </div>
            </Popup>
          </Polygon>
        )}

        {/* Spill Centroid Label */}
        {layers.slicks && spillPolygons.length > 0 && showCalloutLabels && (
          <Marker
            position={[spillCentroid[0] + 0.018, spillCentroid[1]]}
            icon={createMapLabelIcon('◉ DETECTED SPILL — AQL-047', '#fbbf24')}
          />
        )}

        {/* ── HINDCAST TRAJECTORY ─────────────────────────────────────── */}
        {layers.hindcastOrigin && backwardTrajectory.length > 1 && (
          <Polyline
            positions={backwardTrajectory}
            pathOptions={{
              color: '#818cf8',
              weight: 2.5,
              dashArray: '8, 6',
              opacity: 0.88,
            }}
          >
            <Popup>
              <div className="text-xs font-mono">
                <p className="font-bold text-indigo-400">BACKWARD DRIFT TRAJECTORY</p>
                <p className="text-slate-400">Lagrangian Reverse Particle Model</p>
                <p>Duration: 3h 50m</p>
              </div>
            </Popup>
          </Polyline>
        )}

        {/* Backward trajectory label */}
        {layers.hindcastOrigin && backwardTrajectory.length > 3 && showCalloutLabels && (
          <Marker
            position={backwardTrajectory[Math.floor(backwardTrajectory.length / 2)]}
            icon={createMapLabelIcon('← BACKWARD TRAJECTORY', '#818cf8')}
          />
        )}

        {/* ── ORIGIN ZONE ─────────────────────────────────────────────── */}
        {layers.hindcastOrigin && originZone && (
          <>
            <Circle
              center={[originZone.lat, originZone.lon]}
              radius={originZone.radiusKm * 1000}
              pathOptions={{
                color: '#818cf8',
                fillColor: '#6366f1',
                fillOpacity: 0.30,
                weight: 2,
                dashArray: '4, 4',
              }}
            >
              <Popup>
                <div className="text-xs font-mono text-slate-200">
                  <p className="font-bold text-indigo-300">PROBABLE RELEASE POINT</p>
                  <p>Coordinates: {formatCoord(originZone.lat, originZone.lon)}</p>
                  <p>Uncertainty Radius: {originZone.radiusKm.toFixed(1)} km</p>
                  <p>Release Window: 18:20 – 22:10 UTC</p>
                  {originZone.probability !== undefined && (
                    <p className="text-cyan-300 font-bold">Confidence: {(originZone.probability * 100).toFixed(0)}%</p>
                  )}
                </div>
              </Popup>
            </Circle>
            <Marker
              position={[originZone.lat, originZone.lon]}
              icon={createOriginBadgeIcon(originZone.label || 'PROBABLE RELEASE POINT')}
            />
          </>
        )}

        {/* Secondary origin zones */}
        {layers.hindcastOrigin &&
          secondaryOriginZones.map((zone, i) => (
            <Circle
              key={`sec-origin-${i}`}
              center={[zone.lat, zone.lon]}
              radius={zone.radiusKm * 1000}
              pathOptions={{
                color: '#a5b4fc',
                fillColor: '#818cf8',
                fillOpacity: 0.14,
                weight: 1.5,
                dashArray: '3, 5',
              }}
            >
              <Popup>
                <div className="text-xs font-mono">
                  <p className="font-bold text-indigo-300">{zone.label || `ORIGIN ZONE ${i + 2}`}</p>
                  <p>Coords: {formatCoord(zone.lat, zone.lon)}</p>
                  <p>Radius: {zone.radiusKm.toFixed(1)} km</p>
                  {zone.probability !== undefined && (
                    <p>Confidence: {(zone.probability * 100).toFixed(0)}%</p>
                  )}
                </div>
              </Popup>
            </Circle>
          ))}

        {/* ── FORECAST POLYGONS ──────────────────────────────────────────── */}

        {/* +24h (widest, drawn first so overlapping draws on top) */}
        {layers.forecast24h && (forecast24h?.geometry || forecast24h?.coordinates) && (
          <Polygon
            positions={geoJsonToLatLngs(forecast24h.geometry || forecast24h)}
            pathOptions={{
              color: '#7c3aed',
              fillColor: '#6d28d9',
              fillOpacity: 0.28,
              weight: 1.5,
              dashArray: '6, 4',
            }}
          >
            <Popup>
              <div className="text-xs font-mono">
                <p className="font-bold text-purple-400">FORECAST +24H</p>
                <p>Area: {forecast24h?.properties?.area_km2 ?? 312.4} km²</p>
                <p>Probability: {((forecast24h?.properties?.probability ?? 0.64) * 100).toFixed(0)}%</p>
              </div>
            </Popup>
          </Polygon>
        )}
        {layers.forecast24h && showCalloutLabels && (forecast24h?.geometry || forecast24h?.coordinates) && (() => {
          const pts = geoJsonToLatLngs(forecast24h.geometry || forecast24h);
          if (!pts.length) return null;
          const lat = Math.min(...pts.map(p => p[0]));
          const lon = pts.reduce((s, p) => s + p[1], 0) / pts.length;
          return <Marker position={[lat - 0.01, lon]} icon={createMapLabelIcon('+24H FORECAST', '#a78bfa')} />;
        })()}

        {/* +12h */}
        {layers.forecast12h && (forecast12h?.geometry || forecast12h?.coordinates) && (
          <Polygon
            positions={geoJsonToLatLngs(forecast12h.geometry || forecast12h)}
            pathOptions={{
              color: '#d97706',
              fillColor: '#b45309',
              fillOpacity: 0.38,
              weight: 1.8,
              dashArray: '5, 4',
            }}
          >
            <Popup>
              <div className="text-xs font-mono">
                <p className="font-bold text-amber-400">FORECAST +12H</p>
                <p>Area: {forecast12h?.properties?.area_km2 ?? 156.8} km²</p>
                <p>Probability: {((forecast12h?.properties?.probability ?? 0.79) * 100).toFixed(0)}%</p>
              </div>
            </Popup>
          </Polygon>
        )}

        {/* +6h */}
        {layers.forecast6h && (forecast6h?.geometry || forecast6h?.coordinates) && (
          <Polygon
            positions={geoJsonToLatLngs(forecast6h.geometry || forecast6h)}
            pathOptions={{
              color: '#ea580c',
              fillColor: '#c2410c',
              fillOpacity: 0.46,
              weight: 2,
              dashArray: '4, 4',
            }}
          >
            <Popup>
              <div className="text-xs font-mono">
                <p className="font-bold text-orange-400">FORECAST +6H</p>
                <p>Area: {forecast6h?.properties?.area_km2 ?? 89.3} km²</p>
                <p>Probability: {((forecast6h?.properties?.probability ?? 0.88) * 100).toFixed(0)}%</p>
              </div>
            </Popup>
          </Polygon>
        )}
        {layers.forecast6h && showCalloutLabels && (forecast6h?.geometry || forecast6h?.coordinates) && (() => {
          const pts = geoJsonToLatLngs(forecast6h.geometry || forecast6h);
          if (!pts.length) return null;
          const lat = Math.min(...pts.map(p => p[0]));
          const lon = pts.reduce((s, p) => s + p[1], 0) / pts.length;
          return <Marker position={[lat - 0.01, lon]} icon={createMapLabelIcon('+6H FORECAST', '#fb923c')} />;
        })()}

        {/* Generic forecastPolygon override */}
        {layers.forecastPlume && forecastPolygon?.coordinates && !forecast6h && (
          <Polygon
            positions={geoJsonToLatLngs(forecastPolygon)}
            pathOptions={{
              color: '#06b6d4',
              fillColor: '#0891b2',
              fillOpacity: 0.42,
              weight: 2,
              dashArray: '5, 5',
            }}
          />
        )}

        {/* Forward drift line */}
        {layers.forecastPlume && forwardTrajectory.length > 1 && (
          <Polyline
            positions={forwardTrajectory}
            pathOptions={{ color: '#38bdf8', weight: 2, dashArray: '4, 4', opacity: 0.75 }}
          />
        )}

        {/* ── VESSELS ─────────────────────────────────────────────────── */}
        {layers.vessels &&
          vessels.map((v: any, idx: number) => {
            const lat = v.lat ?? v.last_known_position?.[0];
            const lon = v.lon ?? v.last_known_position?.[1];
            if (!lat || !lon) return null;
            const rank = v.rank || idx + 1;
            const name = v.vessel_name || v.name || v.ship_id || `VESSEL_${rank}`;
            const score = v.attribution_score ?? 0.5;
            const riskLevel = v.risk_level || (score > 0.7 ? 'HIGH' : score > 0.4 ? 'MEDIUM' : 'LOW');
            const isDark = v.isDark ?? false;

            return (
              <React.Fragment key={`vessel-${idx}`}>
                {v.historical_track && v.historical_track.length > 1 && layers.aisTracks && (
                  <Polyline
                    positions={v.historical_track}
                    pathOptions={{
                      color: riskLevel === 'HIGH' ? '#f87171' : '#fbbf24',
                      weight: 1.6,
                      dashArray: '5, 5',
                      opacity: 0.65,
                    }}
                  />
                )}
                <Marker
                  position={[lat, lon]}
                  icon={createCandidateVesselIcon(rank, name, score, riskLevel, isDark)}
                >
                  <Popup>
                    <div className="text-xs font-mono text-slate-200">
                      <p className="font-bold text-cyan-300 flex items-center gap-1">
                        <Ship className="w-3.5 h-3.5 inline" /> #{rank} {name}
                      </p>
                      {v.mmsi && <p>MMSI: {v.mmsi}</p>}
                      {v.imo && v.imo !== '—' && <p>IMO: {v.imo}</p>}
                      {v.vessel_type && <p>Type: {v.vessel_type}</p>}
                      {v.flag && <p>Flag: {v.flag}</p>}
                      <p>Coords: {formatCoord(lat, lon)}</p>
                      {v.speed_knots !== undefined && <p>Speed: {v.speed_knots} kn</p>}
                      <p className="text-amber-300 font-bold mt-1">
                        Attribution: {(score * 100).toFixed(1)}% [{riskLevel}]
                      </p>
                      {isDark && <p className="text-purple-400 font-bold">⚠ DARK VESSEL — AIS Gap Detected</p>}
                      {v.explanation && (
                        <p className="text-[10px] text-slate-400 mt-1 italic border-t border-slate-700 pt-1 max-w-[200px] whitespace-normal">
                          {v.explanation}
                        </p>
                      )}
                    </div>
                  </Popup>
                </Marker>
              </React.Fragment>
            );
          })}

        {/* ── IMPACT ASSETS ───────────────────────────────────────────── */}
        {layers.impactAssets &&
          impactAssets.map((asset, idx) => (
            <Marker
              key={`asset-${idx}`}
              position={[asset.lat, asset.lon]}
              icon={createAssetIcon(asset.name, asset.riskScore ?? 0.6, asset.sensitivity)}
            >
              <Popup>
                <div className="text-xs font-mono text-slate-200">
                  <p className="font-bold text-purple-300">◆ {asset.name}</p>
                  <p className="text-[10px] text-slate-400 uppercase">{asset.type || 'Asset'}</p>
                  {asset.riskScore !== undefined && (
                    <p className="text-amber-400 font-bold mt-1">
                      Risk: {(asset.riskScore * 100).toFixed(0)}%
                    </p>
                  )}
                </div>
              </Popup>
            </Marker>
          ))}

        {/* ── IMPACT ZONE ─────────────────────────────────────────────── */}
        {layers.impactZones && impactZonePolygon?.geometry && (
          <Polygon
            positions={geoJsonToLatLngs(impactZonePolygon.geometry)}
            pathOptions={{
              color: '#dc2626',
              fillColor: '#7f1d1d',
              fillOpacity: 0.26,
              weight: 1.5,
              dashArray: '3, 5',
            }}
          >
            <Popup>
              <div className="text-xs font-mono">
                <p className="font-bold text-red-400">HIGH RISK IMPACT ZONE</p>
                <p>Impact Probability: 78%</p>
                <p>ETA: ~22 hours</p>
              </div>
            </Popup>
          </Polygon>
        )}
        {layers.impactZones && impactZonePolygon?.geometry && showCalloutLabels && (() => {
          const pts = geoJsonToLatLngs(impactZonePolygon.geometry);
          if (!pts.length) return null;
          const lat = pts.reduce((s, p) => s + p[0], 0) / pts.length;
          const lon = pts.reduce((s, p) => s + p[1], 0) / pts.length;
          return <Marker position={[lat, lon]} icon={createMapLabelIcon('⚠ IMPACT ZONE', '#f87171')} />;
        })()}

        {/* ── RESPONSE ZONES ──────────────────────────────────────────── */}
        {layers.responseZones && responseZone1?.geometry && (
          <Polygon
            positions={geoJsonToLatLngs(responseZone1.geometry)}
            pathOptions={{
              color: '#10b981',
              fillColor: '#065f46',
              fillOpacity: 0.40,
              weight: 2,
            }}
          >
            <Popup>
              <div className="text-xs font-mono">
                <p className="font-bold text-emerald-400">RESPONSE ZONE R-1 (PRIMARY)</p>
                <p>Resources: 2 Skimmers + 2 Booms</p>
                <p>Expected Containment: 58%</p>
              </div>
            </Popup>
          </Polygon>
        )}
        {layers.responseZones && responseZone2?.geometry && (
          <Polygon
            positions={geoJsonToLatLngs(responseZone2.geometry)}
            pathOptions={{
              color: '#34d399',
              fillColor: '#064e3b',
              fillOpacity: 0.36,
              weight: 1.5,
              dashArray: '4, 4',
            }}
          >
            <Popup>
              <div className="text-xs font-mono">
                <p className="font-bold text-emerald-300">RESPONSE ZONE R-2 (SECONDARY)</p>
                <p>Resources: 1 Boom</p>
                <p>Expected Containment: 14%</p>
              </div>
            </Popup>
          </Polygon>
        )}

        {/* ── PREDICTION vs REALITY ───────────────────────────────────── */}
        {predictedPolygon?.geometry && (
          <Polygon
            positions={geoJsonToLatLngs(predictedPolygon.geometry)}
            pathOptions={{
              color: '#06b6d4',
              fillColor: '#0e7490',
              fillOpacity: 0.32,
              weight: 2.5,
              dashArray: '6, 4',
            }}
          >
            <Popup>
              <div className="text-xs font-mono">
                <p className="font-bold text-cyan-400">MODEL PREDICTION</p>
                <p>Area: {predictedPolygon.properties?.area_km2 ?? 46.1} km²</p>
              </div>
            </Popup>
          </Polygon>
        )}
        {observedPolygon?.geometry && (
          <Polygon
            positions={geoJsonToLatLngs(observedPolygon.geometry)}
            pathOptions={{
              color: '#f59e0b',
              fillColor: '#92400e',
              fillOpacity: 0.48,
              weight: 2.5,
            }}
          >
            <Popup>
              <div className="text-xs font-mono">
                <p className="font-bold text-amber-400">OBSERVED (SATELLITE)</p>
                <p>Area: 42.7 km²</p>
                <p>Confidence: 91%</p>
              </div>
            </Popup>
          </Polygon>
        )}
      </MapContainer>

      {/* ── HUD OVERLAYS ──────────────────────────────────────────────── */}
      {showHUD && (
        <>
          {/* Top-Left: Tactical Sensor HUD */}
          <div className="absolute top-4 left-4 z-[400] crystalline-panel px-3 py-2 rounded-lg font-mono text-[11px] shadow-lg flex items-center gap-3">
            <div className="flex items-center gap-1.5 text-cyan-300">
              <Crosshair
                className="w-3.5 h-3.5"
                style={{ animation: 'spin 10s linear infinite' }}
              />
              <span className="font-bold">TACTICAL HUD</span>
            </div>
            <div className="text-slate-400 border-l border-slate-700 pl-3 tabular-nums">
              {formatCoord(center[0], center[1])}
            </div>
            <button
              onClick={handleFit}
              className="text-slate-400 hover:text-cyan-300 transition-colors ml-1 px-1.5 py-0.5 rounded bg-slate-900 border border-slate-700 text-[10px] flex items-center gap-1 cursor-pointer"
            >
              <Maximize2 className="w-3 h-3" />
              <span>FIT</span>
            </button>
          </div>

          {/* Time offset banner */}
          {timeOffset !== 0 && (
            <div className="absolute top-4 left-1/2 -translate-x-1/2 z-[400] px-4 py-1.5 rounded-full font-mono text-xs font-bold shadow-xl border flex items-center gap-2 bg-[#050e24]/95 text-cyan-300 border-cyan-500/40">
              <Clock className="w-3.5 h-3.5 text-cyan-400 animate-pulse" />
              <span>
                {timeOffset < 0
                  ? `HINDCAST: ${timeOffset}h`
                  : `FORECAST: +${timeOffset}h`}
              </span>
            </div>
          )}

          {/* Metocean Readout */}
          {layers.currentVectors && metocean && (
            <div className="absolute top-16 left-4 z-[400] crystalline-panel p-2.5 rounded-lg font-mono text-[10px] shadow-lg text-slate-300 space-y-1.5 border-cyan-500/20 max-w-[200px]">
              <div className="flex items-center gap-1.5 font-bold text-cyan-400 border-b border-slate-800 pb-1">
                <Compass className="w-3.5 h-3.5" />
                <span>METOCEAN VECTORS</span>
              </div>
              {metocean.currentSpeedMs !== undefined && (
                <div className="flex justify-between">
                  <span className="text-slate-400">Current:</span>
                  <span className="text-cyan-300 font-bold tabular-nums">
                    {metocean.currentSpeedMs.toFixed(2)} m/s @ {metocean.currentDirectionDeg ?? 0}°
                  </span>
                </div>
              )}
              {metocean.windSpeedMs !== undefined && (
                <div className="flex justify-between">
                  <span className="text-slate-400">Wind:</span>
                  <span className="text-amber-300 font-bold tabular-nums flex items-center gap-1">
                    <Wind className="w-2.5 h-2.5" />
                    {metocean.windSpeedMs.toFixed(1)} m/s @ {metocean.windDirectionDeg ?? 0}°
                  </span>
                </div>
              )}
              {metocean.waveHeightM !== undefined && (
                <div className="flex justify-between">
                  <span className="text-slate-400">Wave Ht:</span>
                  <span className="text-blue-300 tabular-nums">{metocean.waveHeightM.toFixed(1)} m</span>
                </div>
              )}
            </div>
          )}

          <LayerControl />
          <MapLegend />
        </>
      )}
    </div>
  );
};
