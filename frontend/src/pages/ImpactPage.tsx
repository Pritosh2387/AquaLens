import React from 'react';
import { SectionHeader } from '../components/ui/SectionHeader';
import { CrystallinePanel } from '../components/ui/CrystallinePanel';
import { CommandMapFrame } from '../components/maps/CommandMapFrame';
import { RadialGauge } from '../components/ui/RadialGauge';
import { AlertTriangle, Clock, Fish, Leaf, Users, DollarSign } from 'lucide-react';
import { DEMO_INCIDENT } from '../data/demoIncident';
import { DEMO_IMPACT_ASSETS, DEMO_IMPACT_SUMMARY } from '../data/demoImpact';
import {
  DEMO_ALL_SPILL_POLYGONS,
  DEMO_FORECAST_24H,
  DEMO_IMPACT_ZONE_HIGH,
  DEMO_UNCERTAINTY_ZONE,
} from '../data/demoMapData';
import { DEMO_METOCEAN } from '../data/demoForecast';

export const ImpactPage: React.FC = () => {
  const inc = DEMO_INCIDENT;
  const summary = DEMO_IMPACT_SUMMARY;

  const riskGauges = [
    { value: summary.ecologicalRisk, label: 'Ecological Risk', color: 'red' as const, icon: Leaf },
    { value: summary.fisheriesRisk, label: 'Fisheries Risk', color: 'amber' as const, icon: Fish },
    { value: summary.populationRisk, label: 'Population Risk', color: 'blue' as const, icon: Users },
    { value: summary.economicRisk, label: 'Economic Risk', color: 'amber' as const, icon: DollarSign },
  ];

  const sensitivityColor = (s: string) => {
    if (s === 'CRITICAL') return 'text-red-400 border-red-500/40 bg-red-950/30';
    if (s === 'HIGH') return 'text-amber-400 border-amber-500/40 bg-amber-950/20';
    return 'text-sky-400 border-sky-500/30 bg-sky-950/10';
  };

  return (
    <div className="space-y-5 font-mono text-xs">
      <SectionHeader
        title="Impact & Uncertainty"
        subtitle={`Environmental & economic risk assessment — Incident ${inc.incidentId} (Modules M11–M13)`}
        provenance="INFERRED"
        moduleTag="M11-M13"
      />

      {/* Risk Summary Row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          { label: 'Overall Severity', value: summary.overallSeverity, sub: 'Multi-criteria', color: 'text-red-400', bg: 'bg-red-950/20 border-red-500/30', icon: AlertTriangle },
          { label: 'Affected Area', value: `${summary.totalAffectedAreaKm2} km²`, sub: '24h risk zone', color: 'text-amber-400', bg: 'bg-amber-950/20 border-amber-500/30', icon: AlertTriangle },
          { label: 'Population at Risk', value: summary.populationAtRisk.toLocaleString(), sub: 'Coastal zone', color: 'text-blue-300', bg: 'bg-blue-950/20 border-blue-500/30', icon: Users },
          { label: 'Economic Loss Est.', value: `₹ ${summary.estimatedEconomicLossMillion} Cr`, sub: '72h scenario', color: 'text-purple-300', bg: 'bg-purple-950/20 border-purple-500/30', icon: DollarSign },
        ].map(({ label, value, sub, color, bg, icon: Icon }) => (
          <div key={label} className={`crystalline-panel p-3.5 rounded-xl flex items-center gap-3 border ${bg}`}>
            <div className={`w-10 h-10 rounded-lg flex items-center justify-center shrink-0 ${bg}`}>
              <Icon className={`w-5 h-5 ${color}`} />
            </div>
            <div>
              <div className="text-[10px] text-slate-400 uppercase tracking-wider">{label}</div>
              <div className={`text-sm font-bold ${color}`}>{value}</div>
              <div className="text-[10px] text-slate-400">{sub}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Main Grid: Map + Gauges */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Map (2/3) */}
        <div className="lg:col-span-2 space-y-3">
          <CommandMapFrame
            title={`IMPACT ASSESSMENT MAP — ${inc.sceneId}`}
            subtitle="Forecast zone • Uncertainty band • At-risk assets • High impact zone"
            provenance="INFERRED"
            spillPolygons={DEMO_ALL_SPILL_POLYGONS}
            forecast24h={DEMO_FORECAST_24H}
            impactAssets={DEMO_IMPACT_ASSETS}
            impactZonePolygon={DEMO_IMPACT_ZONE_HIGH}
            metocean={DEMO_METOCEAN}
            showCalloutLabels={true}
            height="460px"
          />
          <div className="crystalline-panel p-2.5 rounded-lg text-[11px] flex flex-wrap items-center gap-4 text-slate-300">
            <span className="text-slate-400 font-bold">RISK ZONES:</span>
            <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-sm bg-red-700/80 border border-red-500" /> HIGH RISK (78%)</span>
            <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-sm bg-purple-600/40 border border-purple-400" /> 24h Forecast Zone</span>
            <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-sm bg-purple-500/20 border border-purple-400 border-dashed" /> Uncertainty Buffer</span>
            <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-sm bg-purple-600/30" /> ◆ At-risk Asset</span>
          </div>
        </div>

        {/* Right: Gauges + Asset list */}
        <div className="space-y-4">
          <CrystallinePanel title="Risk Assessment" subtitle="Multi-criteria impact scoring">
            <div className="grid grid-cols-2 gap-4 py-2">
              {riskGauges.map((g) => (
                <RadialGauge key={g.label} value={g.value} label={g.label} color={g.color} showPercent />
              ))}
            </div>
          </CrystallinePanel>

          <CrystallinePanel title="Probability Bands" subtitle="Zone impact likelihood">
            <div className="space-y-2">
              {[
                { zone: 'Core Impact Zone', prob: 91, severity: 'CRITICAL', color: '#dc2626' },
                { zone: 'Secondary Zone', prob: 71, severity: 'HIGH', color: '#ea580c' },
                { zone: 'Uncertainty Buffer', prob: 45, severity: 'MEDIUM', color: '#d97706' },
                { zone: 'Extended Zone', prob: 23, severity: 'LOW', color: '#4b5563' },
              ].map((r) => (
                <div key={r.zone} className="space-y-0.5">
                  <div className="flex justify-between text-[11px]">
                    <span className="text-slate-300">{r.zone}</span>
                    <span className="font-bold" style={{ color: r.color }}>{r.prob}%</span>
                  </div>
                  <div className="w-full h-2 bg-slate-800 rounded-full">
                    <div className="h-full rounded-full transition-all" style={{ width: `${r.prob}%`, background: r.color }} />
                  </div>
                  <div className="text-[9px] text-slate-500">{r.severity}</div>
                </div>
              ))}
            </div>
          </CrystallinePanel>
        </div>
      </div>

      {/* At-risk assets table */}
      <CrystallinePanel title="At-Risk Assets" subtitle="Environmental & economic exposure analysis">
        <div className="overflow-x-auto">
          <table className="w-full text-[11px]">
            <thead>
              <tr className="border-b border-slate-800 text-slate-400 text-[10px] uppercase">
                {['Asset', 'Type', 'Sensitivity', 'Risk Score', 'Impact Prob.', 'ETA', 'Description'].map((h) => (
                  <th key={h} className="pb-2 pr-4 text-left font-bold">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {DEMO_IMPACT_ASSETS.map((a) => (
                <tr key={a.name} className="border-b border-slate-800/60 hover:bg-slate-800/20 transition-colors">
                  <td className="py-2.5 pr-4 font-bold text-slate-100">{a.name}</td>
                  <td className="pr-4 text-slate-400">{a.type}</td>
                  <td className="pr-4">
                    <span className={`px-1.5 py-0.5 rounded text-[9px] font-bold border ${sensitivityColor(a.sensitivity)}`}>
                      {a.sensitivity}
                    </span>
                  </td>
                  <td className="pr-4">
                    <div className="flex items-center gap-2">
                      <div className="w-12 h-1.5 bg-slate-800 rounded-full">
                        <div
                          className="h-full rounded-full"
                          style={{ width: `${a.riskScore * 100}%`, background: a.riskScore > 0.7 ? '#dc2626' : a.riskScore > 0.5 ? '#d97706' : '#3b82f6' }}
                        />
                      </div>
                      <span className={`font-bold tabular-nums ${a.riskScore > 0.7 ? 'text-red-400' : a.riskScore > 0.5 ? 'text-amber-400' : 'text-sky-400'}`}>
                        {(a.riskScore * 100).toFixed(0)}%
                      </span>
                    </div>
                  </td>
                  <td className="pr-4 text-emerald-300 font-bold tabular-nums">{(a.impactProbability * 100).toFixed(0)}%</td>
                  <td className="pr-4">
                    <span className="flex items-center gap-1">
                      <Clock className="w-3 h-3 text-amber-400" />
                      <span className="text-amber-300 font-bold">{a.etaHours}h</span>
                    </span>
                  </td>
                  <td className="text-slate-400 text-[10px] max-w-[200px]">{a.description.slice(0, 70)}…</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </CrystallinePanel>
    </div>
  );
};
