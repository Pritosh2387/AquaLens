import React from 'react';
import { SectionHeader } from '../components/ui/SectionHeader';
import { CrystallinePanel } from '../components/ui/CrystallinePanel';
import { CommandMapFrame } from '../components/maps/CommandMapFrame';
import { RadialGauge } from '../components/ui/RadialGauge';
import { ForecastProgressionChart } from '../components/charts/ForecastProgressionChart';
import { useNavigate } from 'react-router-dom';
import {
  Radio,
  Ship,
  MapPin,
  AlertTriangle,
  ArrowRight,
  ShieldAlert,
  Activity,
  ExternalLink,
  Zap,
  Clock,
  TrendingUp,
} from 'lucide-react';
import { CommandButton } from '../components/ui/CommandButton';
import { DEMO_INCIDENT } from '../data/demoIncident';
import {
  DEMO_ALL_SPILL_POLYGONS,
  DEMO_SPILL_CORE,
  DEMO_ORIGIN_ZONE,
  DEMO_HINDCAST_TRAJECTORY,
  DEMO_FORWARD_TRAJECTORY,
  DEMO_FORECAST_6H,
  DEMO_FORECAST_12H,
  DEMO_FORECAST_24H,
} from '../data/demoMapData';
import { DEMO_VESSELS } from '../data/demoVessels';
import { DEMO_METOCEAN } from '../data/demoForecast';

export const OverviewPage: React.FC = () => {
  const navigate = useNavigate();
  const inc = DEMO_INCIDENT;

  const kpiCards = [
    {
      label: 'Spill Probability',
      value: `${(inc.spillProbability * 100).toFixed(0)}%`,
      sub: 'SAR + Optical Fusion',
      icon: Radio,
      color: 'emerald',
    },
    {
      label: 'Detection Confidence',
      value: `${(inc.confidence * 100).toFixed(0)}%`,
      sub: 'DeepOilNet v2.1',
      icon: Activity,
      color: 'sky',
    },
    {
      label: 'Estimated Area',
      value: inc.estimatedAreaStr,
      sub: 'Multi-sensor estimate',
      icon: TrendingUp,
      color: 'sky',
    },
    {
      label: 'Estimated Origin',
      value: `${inc.origin.latitude.toFixed(2)}° N`,
      sub: `${inc.origin.longitude.toFixed(2)}° E  ±${inc.origin.uncertaintyRadiusKm} km`,
      icon: MapPin,
      color: 'blue',
    },
    {
      label: 'Suspected Vessel',
      value: inc.suspectedVessel,
      sub: `Attribution ${(inc.attributionScore * 100).toFixed(0)}%`,
      icon: Ship,
      color: 'purple',
    },
  ];

  const colorMap: Record<string, string> = {
    emerald: 'text-emerald-300 bg-emerald-500/15 border-emerald-400/40',
    sky: 'text-sky-300 bg-sky-500/15 border-sky-400/40',
    blue: 'text-blue-300 bg-blue-500/15 border-blue-400/40',
    purple: 'text-purple-300 bg-purple-500/15 border-purple-400/40',
  };

  return (
    <div className="space-y-5 font-mono">
      {/* Incident status banner */}
      <div className="crystalline-panel rounded-xl px-4 py-3 flex flex-wrap items-center justify-between gap-3 border-amber-500/30 bg-amber-950/10">
        <div className="flex items-center gap-3">
          <span className="text-[10px] font-bold text-amber-400 uppercase tracking-widest">
            Active Incident
          </span>
          <span className="text-sm font-black text-slate-100 tracking-widest">
            {inc.sceneId}
          </span>
          <span className="text-[10px] text-slate-400">•</span>
          <span className="text-[10px] text-slate-300">{inc.location.region}</span>
        </div>
        <div className="flex items-center gap-3 text-[10px]">
          <span className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-red-400 animate-pulse shadow-[0_0_6px_#f87171]" />
            <span className="text-red-300 font-bold">INCIDENT ACTIVE</span>
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-amber-400 shadow-[0_0_6px_#fbbf24]" />
            <span className="text-amber-300 font-bold">SPILL CONFIRMED</span>
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-rose-500 shadow-[0_0_6px_#f43f5e]" />
            <span className="text-rose-300 font-bold">HIGH PRIORITY</span>
          </span>
        </div>
      </div>

      {/* Page Header */}
      <SectionHeader
        title="Mission Overview"
        subtitle={`Ocean intelligence command — Incident ${inc.incidentId} • ${inc.location.region}`}
        moduleTag="M1-M17"
        provenance="OBSERVED"
      />

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3.5">
        {kpiCards.map((card) => {
          const Icon = card.icon;
          const cls = colorMap[card.color];
          return (
            <div key={card.label} className={`crystalline-panel p-3.5 rounded-xl flex items-center gap-3`}>
              <div className={`w-10 h-10 rounded-lg border flex items-center justify-center shrink-0 ${cls}`}>
                <Icon className="w-5 h-5" />
              </div>
              <div>
                <div className="text-[10px] text-slate-400 uppercase tracking-wider">{card.label}</div>
                <div className={`text-sm font-bold tabular-nums ${cls.split(' ')[0]}`}>{card.value}</div>
                <div className="text-[10px] text-slate-400">{card.sub}</div>
              </div>
            </div>
          );
        })}
        {/* Priority card */}
        <div className="crystalline-panel p-3.5 rounded-xl flex items-center gap-3 border-red-500/30 bg-red-950/20">
          <div className="w-10 h-10 rounded-lg bg-red-500/15 border border-red-400/40 flex items-center justify-center shrink-0 text-red-400">
            <AlertTriangle className="w-5 h-5" />
          </div>
          <div>
            <div className="text-[10px] text-slate-400 uppercase tracking-wider">Priority Score</div>
            <div className="text-lg font-bold text-red-400 tabular-nums">{inc.priorityScore} / 10</div>
            <div className="text-[9px] text-red-300 font-bold">{inc.priorityLabel} — Immediate Action</div>
          </div>
        </div>
      </div>

      {/* Main: Map + Right Sidebar */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Left 2/3: Central command map */}
        <div className="lg:col-span-2 space-y-3">
          <CommandMapFrame
            title={`AQUALENS — ${inc.sceneId}`}
            subtitle={`${inc.location.region} • ${inc.location.latitude}° N, ${inc.location.longitude}° E • Acquired ${inc.sensor.passTime}`}
            provenance="OBSERVED"
            status="INCIDENT ACTIVE"
            spillPolygons={DEMO_ALL_SPILL_POLYGONS}
            spillCore={DEMO_SPILL_CORE}
            originZone={DEMO_ORIGIN_ZONE}
            backwardTrajectory={DEMO_HINDCAST_TRAJECTORY}
            forwardTrajectory={DEMO_FORWARD_TRAJECTORY}
            forecast6h={DEMO_FORECAST_6H}
            forecast12h={DEMO_FORECAST_12H}
            forecast24h={DEMO_FORECAST_24H}
            vessels={DEMO_VESSELS}
            metocean={DEMO_METOCEAN}
            showCalloutLabels={true}
            height="460px"
          />
          {/* Map Legend Strip */}
          <div className="crystalline-panel p-2.5 rounded-lg text-[11px] flex flex-wrap items-center justify-between gap-3 text-slate-300">
            <span className="text-slate-400 font-bold">MAP LAYERS:</span>
            <div className="flex flex-wrap items-center gap-4">
              {[
                { bg: 'bg-amber-700/80 border-amber-500', label: 'Detected Spill' },
                { bg: 'bg-orange-600/55 border-orange-400', label: '+6h Forecast' },
                { bg: 'bg-amber-500/40 border-amber-400', label: '+12h Forecast' },
                { bg: 'bg-purple-600/35 border-purple-400', label: '+24h Forecast' },
                { bg: 'bg-indigo-600/30 border-indigo-400', label: 'Origin Zone' },
                { bg: 'bg-red-500/80 border-red-400', label: 'Vessel (HIGH)' },
              ].map((l) => (
                <span key={l.label} className="flex items-center gap-1.5">
                  <span className={`w-3 h-3 rounded-sm border ${l.bg}`} />
                  <span>{l.label}</span>
                </span>
              ))}
            </div>
          </div>
        </div>

        {/* Right 1/3: Spill movement + Impact gauges */}
        <div className="space-y-4">
          {/* Release time card */}
          <div className="crystalline-panel p-3.5 rounded-xl border-amber-500/30">
            <div className="flex items-center gap-2 mb-2">
              <Clock className="w-4 h-4 text-amber-400" />
              <span className="text-[10px] text-slate-400 uppercase font-bold tracking-wider">Release Window</span>
            </div>
            <div className="text-xs font-bold text-amber-300">{inc.releaseWindow.start}</div>
            <div className="text-[10px] text-slate-400">to {inc.releaseWindow.end}</div>
            <div className="mt-2 text-[10px] text-slate-400">Hindcast Confidence: <span className="text-emerald-400 font-bold">{(inc.origin.confidence * 100).toFixed(0)}%</span></div>
          </div>

          {/* Spill movement */}
          <CrystallinePanel title="Spill Movement Forecast" subtitle="Predicted drift vector">
            <div className="p-3 bg-[#030814] rounded-lg border border-slate-800 space-y-3">
              <div className="flex items-center justify-between text-xs">
                <span className="text-sky-400 font-bold">Direction:</span>
                <span className="text-slate-200">{inc.metocean.driftDirectionLabel} ({inc.metocean.driftDirectionDeg}°)</span>
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className="text-sky-400 font-bold">Speed:</span>
                <span className="text-slate-200">{inc.metocean.currentSpeedMs} m/s</span>
              </div>
              <div className="flex items-center justify-between text-[11px] text-slate-400 border-t border-slate-800/80 pt-2">
                <span>Now</span>
                <ArrowRight className="w-3.5 h-3.5 text-sky-400" />
                <span>+6h</span>
                <ArrowRight className="w-3.5 h-3.5 text-sky-400" />
                <span>+24h</span>
                <ArrowRight className="w-3.5 h-3.5 text-sky-400" />
                <span className="text-amber-400 font-bold">Shore</span>
              </div>
              <div className="text-[10px] text-red-400 font-bold">⚠ Shore impact: {inc.forecast.shoreImpactEta}</div>
            </div>
          </CrystallinePanel>

          {/* Impact Risk Gauges */}
          <CrystallinePanel title="Impact Risk (72h)" subtitle="Multi-criteria risk breakdown">
            <div className="grid grid-cols-2 gap-4 py-2">
              <RadialGauge value={inc.impactAssessment.ecologicalRisk} label="Ecological" color="red" />
              <RadialGauge value={inc.impactAssessment.fisheriesRisk} label="Fisheries" color="amber" />
              <RadialGauge value={inc.impactAssessment.populationRisk} label="Population" color="blue" />
              <RadialGauge value={inc.impactAssessment.economicRisk} label="Economic" color="blue" />
            </div>
          </CrystallinePanel>
        </div>
      </div>

      {/* Bottom row: Vessels + Forecast chart + Recommended Action */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Suspect vessels */}
        <CrystallinePanel
          title="Top Suspect Vessels"
          subtitle="AIS attribution ranking"
          headerAction={
            <button
              onClick={() => navigate('/attribution')}
              className="text-[10px] text-sky-400 hover:underline flex items-center gap-1 cursor-pointer"
            >
              <span>View All</span>
              <ExternalLink className="w-3 h-3" />
            </button>
          }
        >
          <div className="space-y-2 text-xs">
            <div className="grid grid-cols-4 text-[10px] text-slate-400 border-b border-slate-800 pb-1.5 font-bold uppercase">
              <span>#</span>
              <span className="col-span-2">Vessel</span>
              <span className="text-right">Score</span>
            </div>
            {DEMO_VESSELS.slice(0, 5).map((v) => (
              <div
                key={v.rank}
                onClick={() => navigate('/attribution')}
                className="grid grid-cols-4 items-center py-1.5 border-b border-slate-800/60 hover:bg-slate-800/40 rounded px-1 cursor-pointer transition-colors"
              >
                <span className="text-slate-400 font-bold">{v.rank}</span>
                <span className="col-span-2 text-slate-100 font-bold truncate">{v.vessel_name}</span>
                <span
                  className={`text-right font-bold tabular-nums ${v.attribution_score > 0.7 ? 'text-red-400' : v.attribution_score > 0.4 ? 'text-amber-400' : 'text-sky-400'}`}
                >
                  {v.attribution_score.toFixed(2)}
                </span>
              </div>
            ))}
          </div>
        </CrystallinePanel>

        {/* Forecast progression chart */}
        <ForecastProgressionChart />

        {/* Recommended Action */}
        <CrystallinePanel
          title="Recommended Action"
          subtitle="AI decision support directive"
          headerAction={
            <span className="px-2 py-0.5 rounded bg-emerald-950 text-emerald-400 text-[10px] font-bold border border-emerald-500/40">
              OPTIMAL PLAN
            </span>
          }
        >
          <div className="space-y-3.5 text-xs">
            <div className="p-3 rounded-lg bg-emerald-950/30 border border-emerald-500/40 space-y-1">
              <div className="flex items-center gap-2 text-emerald-300 font-bold">
                <ShieldAlert className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>{inc.recommendation.action}</span>
              </div>
              <p className="text-[11px] text-slate-300 leading-relaxed">
                {inc.recommendation.reasoning[0]}
              </p>
            </div>
            <div className="grid grid-cols-3 gap-2 text-center py-1 border-y border-slate-800">
              <div>
                <div className="text-[10px] text-slate-400">Recovery</div>
                <div className="text-sm font-bold text-emerald-400">{inc.recommendation.estimatedRecovery}</div>
              </div>
              <div>
                <div className="text-[10px] text-slate-400">Resources</div>
                <div className="text-[11px] font-bold text-sky-300">
                  {inc.recommendation.resources.skimmers}S + {inc.recommendation.resources.booms}B
                </div>
              </div>
              <div>
                <div className="text-[10px] text-slate-400">Deploy In</div>
                <div className="text-sm font-bold text-amber-400">{inc.recommendation.deploymentWindow}</div>
              </div>
            </div>
            <CommandButton
              variant="primary"
              size="sm"
              icon={<Zap className="w-3.5 h-3.5" />}
              onClick={() => navigate('/evidence')}
              className="w-full justify-center"
            >
              View Full Recommendation
            </CommandButton>
          </div>
        </CrystallinePanel>
      </div>
    </div>
  );
};
