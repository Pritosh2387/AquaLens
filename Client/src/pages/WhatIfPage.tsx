import React, { useState } from 'react';
import { SectionHeader } from '../components/ui/SectionHeader';
import { CrystallinePanel } from '../components/ui/CrystallinePanel';
import {
  TrendingDown, TrendingUp, AlertTriangle, CheckCircle2,
  Minus, Play, Sliders, Zap, RefreshCw, ChevronRight,
} from 'lucide-react';
import { DEMO_INCIDENT } from '../data/demoIncident';
import { DEMO_WHATIF_SCENARIOS } from '../data/demoResources';
import { usePipelineStore } from '../stores/pipelineStore';
import { useIncidentStore } from '../stores/incidentStore';
import { useRunPipeline } from '../hooks/usePipeline';
import { CommandButton } from '../components/ui/CommandButton';

const BASE_SCENARIO_ID = 'current';

/* ════════════════════════════════════════════════════════════════════════════
   HARDCODED SIMULATION ENGINE
   Per-value lookup tables for every slider position → instant offline results
   ════════════════════════════════════════════════════════════════════════════ */

/** Coverage delta contributed by each skimmer count (0-8) */
const SKIMMER_EFFECT: Record<number, number> = {
  0: -0.38, 1: -0.18, 2: 0.00, 3: 0.08, 4: 0.14,
  5: 0.18,  6: 0.21,  7: 0.23, 8: 0.24,
};

/** Coverage delta contributed by each boom count (0-10) */
const BOOM_EFFECT: Record<number, number> = {
  0: -0.22, 1: -0.14, 2: -0.06, 3: 0.00, 4: 0.05,
  5: 0.09,  6: 0.12,  7: 0.14,  8: 0.15, 9: 0.16, 10: 0.165,
};

/** Coverage delta contributed by each ship count (0-5) */
const SHIP_EFFECT: Record<number, number> = {
  0: -0.22, 1: 0.00, 2: 0.11, 3: 0.19, 4: 0.25, 5: 0.29,
};

/** Coverage delta contributed by each dispersal count (0-4) */
const DISPERSAL_EFFECT: Record<number, number> = {
  0: -0.09, 1: 0.00, 2: 0.06, 3: 0.10, 4: 0.13,
};

/**
 * Coverage penalty per hour of delay (non-linear — first hours hurt most).
 * Index = delay * 2 (step 0.5h) → 0 … 48
 */
function delayPenalty(hours: number): number {
  // First 4h: -2.2%/h, 4-12h: -1.6%/h, 12-24h: -1.0%/h
  if (hours <= 4)  return hours * 0.022;
  if (hours <= 12) return 4 * 0.022 + (hours - 4) * 0.016;
  return 4 * 0.022 + 8 * 0.016 + (hours - 12) * 0.010;
}

/** Clamp helper */
const clamp = (v: number, lo: number, hi: number) => Math.max(lo, Math.min(hi, v));
const r2 = (v: number) => Math.round(v * 100) / 100;
const r4 = (v: number) => Math.round(v * 10000) / 10000;

interface SliderValues {
  skimmers: number;
  booms: number;
  ships: number;
  dispersal: number;
  delay: number;
}

interface ScenarioResult {
  label: string;
  coverage_fraction: number;
  assets_covered: number;
  estimated_impact_reduction: number;
  total_deployment_cost_index: number;
  additional_resources_needed: number;
}

interface SimResult {
  reference_priority_score: number;
  scenarios: Record<string, ScenarioResult>;
  recommended_scenario: string;
  disclaimer: string;
}

function computeSimulation(s: SliderValues): SimResult {
  const PRIORITY = 50.0;
  const TOTAL_ASSETS = 14;

  // Baseline coverage (optimized, no delay)
  const baseCov = clamp(
    0.72
    + (SKIMMER_EFFECT[s.skimmers]  ?? 0)
    + (BOOM_EFFECT[s.booms]        ?? 0)
    + (SHIP_EFFECT[s.ships]        ?? 0)
    + (DISPERSAL_EFFECT[s.dispersal] ?? 0),
    0.04, 0.99,
  );

  // Deployed resource count (for cost index)
  const deployed = s.skimmers + s.booms + s.ships + s.dispersal;
  const baseDeployed = 2 + 3 + 1 + 1; // 7

  // ── Scenario: Optimised (current sliders, no delay) ──────────────────────
  const optCov = r4(baseCov);
  const optimized: ScenarioResult = {
    label: 'Optimised Response',
    coverage_fraction: optCov,
    assets_covered: Math.round(optCov * TOTAL_ASSETS),
    estimated_impact_reduction: r2(optCov * PRIORITY),
    total_deployment_cost_index: r4(deployed / baseDeployed),
    additional_resources_needed: Math.max(0, baseDeployed - deployed),
  };

  // ── Scenario: Delayed (current sliders + delay slider) ───────────────────
  const delayCov = r4(clamp(baseCov - delayPenalty(s.delay), 0.02, 0.99));
  const delayed: ScenarioResult = {
    label: `Delayed Response (+${s.delay}h)`,
    coverage_fraction: delayCov,
    assets_covered: Math.round(delayCov * TOTAL_ASSETS),
    estimated_impact_reduction: r2(delayCov * PRIORITY),
    total_deployment_cost_index: r4(deployed / baseDeployed),
    additional_resources_needed: Math.max(0, baseDeployed - deployed),
  };

  // ── Scenario: No Action ──────────────────────────────────────────────────
  const no_action: ScenarioResult = {
    label: 'No Action (Baseline)',
    coverage_fraction: 0.0,
    assets_covered: 0,
    estimated_impact_reduction: 0.0,
    total_deployment_cost_index: 0.0,
    additional_resources_needed: deployed,
  };

  // ── Scenario: Additional Resources (+2 skimmers on top) ──────────────────
  const addSkm = Math.min(s.skimmers + 2, 8);
  const addCov = r4(clamp(
    0.72
    + (SKIMMER_EFFECT[addSkm]       ?? 0)
    + (BOOM_EFFECT[s.booms]         ?? 0)
    + (SHIP_EFFECT[s.ships]         ?? 0)
    + (DISPERSAL_EFFECT[s.dispersal] ?? 0),
    0.04, 0.99,
  ));
  const additional_resources: ScenarioResult = {
    label: `Additional 2× Skimmer`,
    coverage_fraction: addCov,
    assets_covered: Math.round(addCov * TOTAL_ASSETS),
    estimated_impact_reduction: r2(addCov * PRIORITY),
    total_deployment_cost_index: r4((deployed + 2) / baseDeployed),
    additional_resources_needed: 0,
  };

  // ── Scenario: Alternative (chem dispersal focus, 60 % of current ships & skimmers) ─
  const altSkm = Math.max(1, Math.round(s.skimmers * 0.5));
  const altShp = Math.max(0, Math.round(s.ships * 0.5));
  const altDsp = Math.min(s.dispersal + 1, 4);
  const altDeployed = altSkm + s.booms + altShp + altDsp;
  const altCov = r4(clamp(
    0.72
    + (SKIMMER_EFFECT[altSkm]  ?? 0)
    + (BOOM_EFFECT[s.booms]    ?? 0)
    + (SHIP_EFFECT[altShp]     ?? 0)
    + (DISPERSAL_EFFECT[altDsp] ?? 0),
    0.04, 0.99,
  ));
  const alternative: ScenarioResult = {
    label: 'Alternative Allocation',
    coverage_fraction: altCov,
    assets_covered: Math.round(altCov * TOTAL_ASSETS),
    estimated_impact_reduction: r2(altCov * PRIORITY),
    total_deployment_cost_index: r4(altDeployed / baseDeployed),
    additional_resources_needed: Math.max(0, baseDeployed - altDeployed),
  };

  const scenarios: Record<string, ScenarioResult> = {
    optimized, delayed, no_action, additional_resources, alternative,
  };

  // Best by impact reduction
  const recommended = Object.entries(scenarios).reduce(
    (best, [k, v]) =>
      v.estimated_impact_reduction > scenarios[best].estimated_impact_reduction ? k : best,
    'optimized',
  );

  return {
    reference_priority_score: PRIORITY,
    scenarios,
    recommended_scenario: recommended,
    disclaimer:
      'Scenario results are computed from hardcoded simulation heuristics calibrated to AQL-047 mock data. Not operationally validated.',
  };
}

/* ════════════════════════════════════════════════════════════════════════════
   COMPONENT
   ════════════════════════════════════════════════════════════════════════════ */

interface ResourceDef {
  key: keyof SliderValues;
  label: string;
  unit: string;
  min: number;
  max: number;
  step: number;
  color: string;
  trackColor: string;
  icon: string;
}

const RESOURCE_DEFS: ResourceDef[] = [
  { key: 'skimmers',  label: 'Skimmers',           unit: 'units', min: 0, max: 8,  step: 1,   color: '#38bdf8', trackColor: 'rgba(56,189,248,0.22)',  icon: '🚢' },
  { key: 'booms',     label: 'Containment Booms',  unit: 'units', min: 0, max: 10, step: 1,   color: '#f59e0b', trackColor: 'rgba(245,158,11,0.22)',   icon: '⛽' },
  { key: 'ships',     label: 'Response Ships',      unit: 'units', min: 0, max: 5,  step: 1,   color: '#818cf8', trackColor: 'rgba(129,140,248,0.22)',  icon: '🛥️' },
  { key: 'dispersal', label: 'Chemical Dispersal', unit: 'units', min: 0, max: 4,  step: 1,   color: '#34d399', trackColor: 'rgba(52,211,153,0.22)',   icon: '🧪' },
  { key: 'delay',     label: 'Response Delay',     unit: 'hours', min: 0, max: 24, step: 0.5, color: '#f87171', trackColor: 'rgba(248,113,113,0.22)',  icon: '⏱️' },
];

const DEFAULT_SLIDERS: SliderValues = { skimmers: 2, booms: 3, ships: 1, dispersal: 1, delay: 0 };

const SCENARIO_COLORS: Record<string, { bg: string; border: string; badge: string }> = {
  optimized:            { bg: 'rgba(16,185,129,0.08)',  border: 'rgba(16,185,129,0.55)',  badge: 'text-emerald-300 border-emerald-500/40 bg-emerald-950/30' },
  delayed:              { bg: 'rgba(248,113,113,0.08)', border: 'rgba(248,113,113,0.55)', badge: 'text-red-300 border-red-500/40 bg-red-950/30' },
  no_action:            { bg: 'rgba(148,163,184,0.06)', border: 'rgba(148,163,184,0.4)',  badge: 'text-slate-400 border-slate-600 bg-slate-800/30' },
  additional_resources: { bg: 'rgba(56,189,248,0.08)',  border: 'rgba(56,189,248,0.55)',  badge: 'text-sky-300 border-sky-500/40 bg-sky-950/30' },
  alternative:          { bg: 'rgba(129,140,248,0.08)', border: 'rgba(129,140,248,0.55)', badge: 'text-violet-300 border-violet-500/40 bg-violet-950/30' },
};

export const WhatIfPage: React.FC = () => {
  const [selectedId, setSelectedId]     = useState<string>(BASE_SCENARIO_ID);
  const [sliders, setSliders]           = useState<SliderValues>(DEFAULT_SLIDERS);
  const [simResult, setSimResult]       = useState<SimResult | null>(null);
  const [isSimulating, setIsSimulating] = useState(false);

  const { pipelineExecuted, isPipelineRunning } = usePipelineStore();
  const { selectedSceneId, pipelineMode }       = useIncidentStore();
  const runPipelineMutation = useRunPipeline();

  const inc      = DEMO_INCIDENT;
  const base     = DEMO_WHATIF_SCENARIOS.find((s) => s.id === BASE_SCENARIO_ID)!;
  const selected = DEMO_WHATIF_SCENARIOS.find((s) => s.id === selectedId)!;

  const handleRunPipeline = () => {
    runPipelineMutation.mutate({
      scene_id: selectedSceneId,
      include_modules_11_15: pipelineMode === 'EXTENDED' || pipelineMode === 'FULL_DECISION_SUPPORT',
      include_modules_16_17: pipelineMode === 'FULL_DECISION_SUPPORT',
    });
  };

  /** Simulate with a short artificial delay so the button feels responsive */
  const handleSimulate = () => {
    setIsSimulating(true);
    setTimeout(() => {
      setSimResult(computeSimulation(sliders));
      setIsSimulating(false);
    }, 420);
  };

  const handleReset = () => {
    setSliders(DEFAULT_SLIDERS);
    setSimResult(null);
  };

  const setSlider = (key: keyof SliderValues, val: number) =>
    setSliders((prev) => ({ ...prev, [key]: val }));

  const priorityColor = (p: string) => {
    if (p === 'CRITICAL') return 'text-red-400 bg-red-950/40 border-red-500/40';
    if (p === 'HIGH')     return 'text-amber-400 bg-amber-950/30 border-amber-500/40';
    if (p === 'MEDIUM')   return 'text-sky-400 bg-sky-950/20 border-sky-500/40';
    return 'text-emerald-400 bg-emerald-950/20 border-emerald-500/40';
  };

  const deltaIcon = (val: number, baseV: number, lowerIsBetter = true) => {
    const better = lowerIsBetter ? val < baseV : val > baseV;
    if (val === baseV) return <Minus className="w-3 h-3 text-slate-400" />;
    return better
      ? <TrendingDown className="w-3 h-3 text-emerald-400" />
      : <TrendingUp   className="w-3 h-3 text-red-400" />;
  };

  const deltaColor = (val: number, baseV: number, lowerIsBetter = true) => {
    if (val === baseV) return 'text-slate-400';
    return (lowerIsBetter ? val < baseV : val > baseV) ? 'text-emerald-400' : 'text-red-400';
  };

  const sliderStyle = (def: ResourceDef, val: number): React.CSSProperties => {
    const pct = ((val - def.min) / (def.max - def.min)) * 100;
    return {
      background: `linear-gradient(to right, ${def.color} 0%, ${def.color} ${pct}%, rgba(30,41,59,0.8) ${pct}%, rgba(30,41,59,0.8) 100%)`,
      WebkitAppearance: 'none',
      appearance: 'none',
      height: '6px',
      borderRadius: '3px',
      outline: 'none',
      cursor: 'pointer',
      width: '100%',
    };
  };

  /* Live preview of optimised coverage as sliders move (before running) */
  const livePreview = computeSimulation(sliders);
  const liveOptCov  = (livePreview.scenarios.optimized.coverage_fraction * 100).toFixed(1);
  const liveDelCov  = (livePreview.scenarios.delayed.coverage_fraction   * 100).toFixed(1);

  return (
    <div className="space-y-5 font-mono text-xs">

      {/* ── Pipeline gate ─────────────────────────────────────────────────── */}
      {!pipelineExecuted && (
        <div className="crystalline-panel rounded-xl p-6 flex flex-col items-center gap-4 border-blue-500/30 bg-blue-950/10">
          <div className="text-slate-400 text-sm font-mono text-center">
            Run the pipeline to unlock the what-if scenario simulator and compare response strategies.
          </div>
          <CommandButton
            variant="primary"
            size="lg"
            loading={isPipelineRunning}
            icon={<Play className="w-4 h-4 fill-current" />}
            onClick={handleRunPipeline}
            className="px-8"
          >
            {isPipelineRunning ? 'Running Pipeline...' : 'RUN PIPELINE'}
          </CommandButton>
        </div>
      )}

      {pipelineExecuted && (<>
      <SectionHeader
        title="What-If Simulator"
        subtitle={`Response scenario comparison — Incident ${inc.incidentId} (Module M15)`}
        provenance="SIMULATED"
        moduleTag="M15"
      />

      {/* ── Hero Banner ───────────────────────────────────────────────────── */}
      <div className="crystalline-panel rounded-xl px-5 py-4 text-center border-sky-500/30 bg-sky-950/10">
        <div className="text-sky-400 font-black text-base tracking-widest uppercase mb-1">
          COMPARE BEFORE YOU COMMIT RESOURCES
        </div>
        <p className="text-slate-400 text-[11px]">
          Adjust sliders for any combination of resources and delay — results update instantly from the simulation engine.
        </p>
      </div>

      {/* ── Resource Slider Panel ─────────────────────────────────────────── */}
      <CrystallinePanel
        title="Resource Simulator"
        subtitle="Adjust deployment parameters · every slider combination produces hardcoded simulation results"
        headerAction={
          <div className="flex items-center gap-1.5">
            <Sliders className="w-3.5 h-3.5 text-sky-400" />
            <span className="text-[10px] text-sky-400 font-bold uppercase tracking-wider">Offline Engine</span>
          </div>
        }
      >
        <div className="space-y-5">

          {/* Live preview banner */}
          <div className="flex flex-wrap items-center gap-3 px-3 py-2 rounded-lg bg-slate-900/60 border border-slate-700/60">
            <span className="text-[10px] text-slate-500 uppercase tracking-wider font-bold">Live preview →</span>
            <span className="flex items-center gap-1 text-[11px] font-black text-emerald-400">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              Optimised {liveOptCov}%
            </span>
            {sliders.delay > 0 && (
              <span className="flex items-center gap-1 text-[11px] font-black text-red-400">
                <span className="w-1.5 h-1.5 rounded-full bg-red-400 animate-pulse" />
                Delayed {liveDelCov}%
              </span>
            )}
            <span className="text-[10px] text-slate-600 ml-auto italic">Click RUN to see full results</span>
          </div>

          {/* Slider grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-x-8 gap-y-6">
            {RESOURCE_DEFS.map((def) => {
              const val = sliders[def.key];
              return (
                <div key={def.key} className="space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5">
                      <span className="text-sm leading-none">{def.icon}</span>
                      <span className="text-[11px] font-bold uppercase tracking-wider" style={{ color: def.color }}>
                        {def.label}
                      </span>
                    </div>
                    <div
                      className="font-black text-sm tabular-nums px-2 py-0.5 rounded"
                      style={{ color: def.color, background: def.trackColor }}
                    >
                      {def.unit === 'hours' ? `${val}h` : `${val}`}
                      {def.unit !== 'hours' && (
                        <span className="text-[9px] font-normal text-slate-500 ml-1">{def.unit}</span>
                      )}
                    </div>
                  </div>

                  <input
                    id={`slider-${def.key}`}
                    type="range"
                    min={def.min}
                    max={def.max}
                    step={def.step}
                    value={val}
                    onChange={(e) => setSlider(def.key, Number(e.target.value))}
                    style={sliderStyle(def, val)}
                  />

                  <div className="flex justify-between">
                    <span className="text-[9px] text-slate-600">{def.min}{def.unit === 'hours' ? 'h' : ''}</span>
                    {val !== DEFAULT_SLIDERS[def.key] && (
                      <span
                        className="text-[9px] font-bold flex items-center gap-0.5"
                        style={{ color: def.key === 'delay' && val > 0 ? '#f87171' : def.color }}
                      >
                        <ChevronRight className="w-3 h-3" />
                        {val > DEFAULT_SLIDERS[def.key] ? '+' : ''}
                        {(val - DEFAULT_SLIDERS[def.key]).toFixed(def.step < 1 ? 1 : 0)} from base
                      </span>
                    )}
                    <span className="text-[9px] text-slate-600">{def.max}{def.unit === 'hours' ? 'h' : ''}</span>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Config summary tags */}
          <div className="flex flex-wrap items-center gap-2 p-3 rounded-lg bg-slate-900/50 border border-slate-800">
            <span className="text-[10px] text-slate-500 uppercase tracking-wider font-bold mr-1">Config:</span>
            {[
              { label: `${sliders.skimmers} Skimmers`,   color: '#38bdf8' },
              { label: `${sliders.booms} Booms`,         color: '#f59e0b' },
              { label: `${sliders.ships} Ships`,         color: '#818cf8' },
              { label: `${sliders.dispersal} Dispersal`, color: '#34d399' },
              { label: `${sliders.delay}h Delay`,        color: sliders.delay > 0 ? '#f87171' : '#64748b' },
            ].map(({ label, color }) => (
              <span
                key={label}
                className="text-[10px] font-bold px-2 py-0.5 rounded border"
                style={{ color, borderColor: `${color}55`, background: `${color}18` }}
              >
                {label}
              </span>
            ))}
          </div>

          {/* Action buttons */}
          <div className="flex items-center gap-3 pt-1">
            <CommandButton
              variant="primary"
              size="md"
              loading={isSimulating}
              icon={<Zap className="w-4 h-4" />}
              onClick={handleSimulate}
              className="flex-1 sm:flex-none px-8"
            >
              {isSimulating ? 'Simulating…' : 'RUN SIMULATION'}
            </CommandButton>
            <button
              onClick={handleReset}
              className="flex items-center gap-1.5 px-4 py-2 rounded-lg border border-slate-700 text-slate-400 hover:border-slate-600 hover:text-slate-300 transition-all text-[11px] font-bold uppercase tracking-wider cursor-pointer"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              Reset
            </button>
          </div>
        </div>
      </CrystallinePanel>

      {/* ── Simulation Results ────────────────────────────────────────────── */}
      {simResult && (
        <CrystallinePanel
          title="Simulation Results"
          subtitle={`Priority score: ${simResult.reference_priority_score.toFixed(1)} · Recommended: ${simResult.recommended_scenario}`}
          headerAction={
            <div className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span className="text-[10px] text-emerald-400 font-bold uppercase tracking-wider">Complete</span>
            </div>
          }
        >
          <div className="space-y-3">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {Object.entries(simResult.scenarios).map(([key, sc]) => {
                const meta = SCENARIO_COLORS[key] ?? SCENARIO_COLORS.optimized;
                const isRec = key === simResult.recommended_scenario;
                return (
                  <div
                    key={key}
                    className="relative rounded-xl border p-3 transition-all"
                    style={{
                      background: meta.bg,
                      borderColor: isRec ? meta.border : 'rgba(51,65,85,0.6)',
                      boxShadow: isRec ? `0 0 22px -4px ${meta.border}` : 'none',
                    }}
                  >
                    {isRec && (
                      <div
                        className="absolute -top-2.5 right-3 text-[9px] font-black uppercase tracking-widest px-2 py-0.5 rounded"
                        style={{ background: meta.border, color: '#030712' }}
                      >
                        ★ Recommended
                      </div>
                    )}

                    <div className="mb-2">
                      <span className={`text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded border ${meta.badge}`}>
                        {sc.label}
                      </span>
                    </div>

                    <div className="space-y-2">
                      {/* Coverage bar */}
                      <div>
                        <div className="flex justify-between text-[10px] mb-1">
                          <span className="text-slate-400">Coverage</span>
                          <span className="font-black text-slate-200">{(sc.coverage_fraction * 100).toFixed(1)}%</span>
                        </div>
                        <div className="h-1.5 bg-slate-800 rounded-full overflow-hidden">
                          <div
                            className="h-full rounded-full transition-all duration-700"
                            style={{ width: `${sc.coverage_fraction * 100}%`, background: meta.border }}
                          />
                        </div>
                      </div>

                      {/* Impact reduction bar */}
                      <div>
                        <div className="flex justify-between text-[10px] mb-1">
                          <span className="text-slate-400">Impact Reduction</span>
                          <span className="font-black" style={{ color: meta.border }}>
                            {sc.estimated_impact_reduction.toFixed(1)}
                          </span>
                        </div>
                        <div className="h-1.5 bg-slate-800 rounded-full overflow-hidden">
                          <div
                            className="h-full rounded-full transition-all duration-700"
                            style={{
                              width: `${Math.min((sc.estimated_impact_reduction / simResult.reference_priority_score) * 100, 100)}%`,
                              background: meta.border,
                            }}
                          />
                        </div>
                      </div>

                      {/* Stats row */}
                      <div className="grid grid-cols-3 gap-1 pt-1 border-t border-slate-800">
                        <div className="text-center">
                          <div className="text-[9px] text-slate-500 uppercase">Assets</div>
                          <div className="text-[11px] font-black text-slate-200">{sc.assets_covered}</div>
                        </div>
                        <div className="text-center">
                          <div className="text-[9px] text-slate-500 uppercase">Cost Idx</div>
                          <div className="text-[11px] font-black text-slate-200">{sc.total_deployment_cost_index.toFixed(2)}</div>
                        </div>
                        <div className="text-center">
                          <div className="text-[9px] text-slate-500 uppercase">Δ Needed</div>
                          <div className={`text-[11px] font-black ${sc.additional_resources_needed > 0 ? 'text-amber-400' : 'text-emerald-400'}`}>
                            {sc.additional_resources_needed > 0 ? `+${sc.additional_resources_needed}` : '✓'}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            <p className="text-[9px] text-slate-600 italic border-t border-slate-800 pt-2">
              ⚠ {simResult.disclaimer}
            </p>
          </div>
        </CrystallinePanel>
      )}

      {/* ── Scenario Selector ─────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        {DEMO_WHATIF_SCENARIOS.map((s) => (
          <button
            key={s.id}
            onClick={() => setSelectedId(s.id)}
            className={`p-3 rounded-xl border text-left transition-all cursor-pointer ${
              selectedId === s.id
                ? 'bg-blue-950/60 border-sky-400 shadow-[0_0_16px_rgba(56,189,248,0.3)]'
                : 'bg-[#030814] border-slate-800 hover:border-slate-700'
            }`}
          >
            <div className={`text-[10px] font-black mb-1 ${selectedId === s.id ? 'text-sky-300' : 'text-slate-300'}`}>
              {s.label}
            </div>
            <div className={`text-[9px] font-bold px-1.5 py-0.5 rounded border inline-block ${priorityColor(s.priority)}`}>
              {s.priority}
            </div>
            <div className="mt-1.5 text-[9px] text-slate-500">{s.description.slice(0, 42)}…</div>
          </button>
        ))}
      </div>

      {/* ── Comparison Table ──────────────────────────────────────────────── */}
      <CrystallinePanel
        title="Scenario Comparison"
        subtitle="All 6 scenarios side-by-side"
        headerAction={
          <span className="text-[10px] text-slate-400">
            <span className="text-sky-400">■</span> Selected:{' '}
            <span className="text-sky-300 font-bold">{selected.label}</span>
          </span>
        }
      >
        <div className="overflow-x-auto">
          <table className="w-full text-[11px]">
            <thead>
              <tr className="border-b border-slate-800 text-slate-400 text-[10px] uppercase">
                <th className="pb-2 pr-4 text-left font-bold">Scenario</th>
                <th className="pb-2 pr-4 text-left font-bold">Resources</th>
                <th className="pb-2 pr-4 text-center font-bold">Impact Reduction</th>
                <th className="pb-2 pr-4 text-center font-bold">Recovery</th>
                <th className="pb-2 pr-4 text-center font-bold">Priority</th>
                <th className="pb-2 pr-4 text-center font-bold">ETA Deploy</th>
                <th className="pb-2 text-center font-bold">Cost</th>
              </tr>
            </thead>
            <tbody>
              {DEMO_WHATIF_SCENARIOS.map((s) => {
                const isSelected = s.id === selectedId;
                const isBase     = s.id === BASE_SCENARIO_ID;
                return (
                  <tr
                    key={s.id}
                    onClick={() => setSelectedId(s.id)}
                    className={`border-b border-slate-800/60 cursor-pointer transition-colors ${
                      isSelected ? 'bg-blue-950/30' : isBase ? 'bg-emerald-950/10' : 'hover:bg-slate-800/20'
                    }`}
                  >
                    <td className="py-2.5 pr-4">
                      <div className="flex items-center gap-1.5">
                        {isBase    && <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />}
                        {isSelected && !isBase && <span className="w-3 h-3 rounded-full bg-sky-400 shrink-0 animate-pulse" />}
                        <span className={`font-bold ${isSelected ? 'text-sky-300' : 'text-slate-200'}`}>{s.label}</span>
                        {isBase && <span className="text-[9px] text-emerald-400 font-bold">(BASE)</span>}
                      </div>
                    </td>
                    <td className="pr-4 text-slate-400 text-[10px]">{s.resources}</td>
                    <td className="pr-4 text-center">
                      <div className="flex items-center justify-center gap-1">
                        <span className={`font-black ${s.impactPct > base.impactPct ? 'text-red-400' : s.impactPct < base.impactPct ? 'text-emerald-400' : 'text-slate-300'}`}>
                          {s.impactPct}%
                        </span>
                        {!isBase && deltaIcon(s.impactPct, base.impactPct, true)}
                      </div>
                    </td>
                    <td className="pr-4 text-center">
                      <div className="flex items-center justify-center gap-1">
                        <span className={`font-black ${deltaColor(s.recoveryPct, base.recoveryPct, false)}`}>
                          {s.recoveryPct}%
                        </span>
                        {!isBase && deltaIcon(s.recoveryPct, base.recoveryPct, false)}
                      </div>
                    </td>
                    <td className="pr-4 text-center">
                      <span className={`px-2 py-0.5 rounded text-[9px] font-bold border ${priorityColor(s.priority)}`}>
                        {s.priority}
                      </span>
                    </td>
                    <td className="pr-4 text-center text-amber-300 font-bold">{s.etaHours}h</td>
                    <td className="text-center text-slate-300">{s.cost}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </CrystallinePanel>

      {/* ── Selected Scenario Deep-Dive ───────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <CrystallinePanel
          title={`Scenario: ${selected.label}`}
          subtitle={selected.description}
          headerAction={
            selected.id !== BASE_SCENARIO_ID ? (
              <span className={`text-[10px] px-2 py-0.5 rounded border font-bold ${priorityColor(selected.priority)}`}>
                {selected.priority}
              </span>
            ) : undefined
          }
        >
          <div className="space-y-4">
            {[
              { label: 'Predicted Impact',  baseVal: base.impactPct,   selVal: selected.impactPct,   lowerBetter: true,  unit: '%', color: 'bg-red-500' },
              { label: 'Expected Recovery', baseVal: base.recoveryPct, selVal: selected.recoveryPct, lowerBetter: false, unit: '%', color: 'bg-emerald-500' },
              { label: 'ETA to Deploy',     baseVal: base.etaHours,    selVal: selected.etaHours,    lowerBetter: true,  unit: 'h', color: 'bg-amber-500' },
            ].map(({ label, baseVal, selVal, lowerBetter, unit, color }) => {
              const better = lowerBetter ? selVal < baseVal : selVal > baseVal;
              const diff   = selVal - baseVal;
              return (
                <div key={label} className="space-y-1.5">
                  <div className="flex justify-between text-[11px]">
                    <span className="text-slate-300 font-bold">{label}</span>
                    <div className="flex items-center gap-2">
                      <span className="text-slate-400">Base: {baseVal}{unit}</span>
                      <span className={`font-black ${better ? 'text-emerald-400' : diff === 0 ? 'text-slate-300' : 'text-red-400'}`}>
                        → {selVal}{unit} ({diff > 0 ? '+' : ''}{diff}{unit})
                      </span>
                    </div>
                  </div>
                  <div className="relative h-3 bg-slate-800 rounded-full overflow-hidden">
                    <div className="absolute top-0 left-0 h-full bg-slate-600 rounded-full opacity-50"
                      style={{ width: `${Math.min(baseVal, 100)}%` }} />
                    <div className={`absolute top-0 left-0 h-full ${color} rounded-full opacity-80 transition-all duration-500`}
                      style={{ width: `${Math.min(selVal, 100)}%` }} />
                  </div>
                </div>
              );
            })}

            <div className="pt-2 border-t border-slate-800 text-[11px] space-y-1">
              <div className="flex justify-between">
                <span className="text-slate-400">Resources:</span>
                <span className="text-sky-300 font-bold">{selected.resources}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Estimated Cost:</span>
                <span className="text-slate-200 font-bold">{selected.cost}</span>
              </div>
            </div>
          </div>
        </CrystallinePanel>

        <CrystallinePanel title="Recommendation" subtitle="Based on scenario analysis">
          <div className="space-y-3">
            {selectedId === 'delay_6h' || selectedId === 'no_resources' ? (
              <div className="p-3 rounded-lg bg-red-950/30 border border-red-500/40 flex items-start gap-2">
                <AlertTriangle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
                <div>
                  <div className="font-bold text-red-300 text-[11px] mb-1">NOT RECOMMENDED</div>
                  <p className="text-[10px] text-slate-300">
                    {selectedId === 'delay_6h'
                      ? 'A 6-hour delay significantly increases environmental impact from 72% to 88% and reduces recovery from 81% to 63%. Every hour of delay matters.'
                      : 'Relying on natural attenuation alone leaves 96% of the spill uncontained. Ecological damage would be severe and long-lasting.'}
                  </p>
                </div>
              </div>
            ) : selectedId === 'current' ? (
              <div className="p-3 rounded-lg bg-emerald-950/30 border border-emerald-500/40 flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                <div>
                  <div className="font-bold text-emerald-300 text-[11px] mb-1">RECOMMENDED — OPTIMAL BASELINE</div>
                  <p className="text-[10px] text-slate-300">
                    The current plan achieves 81% recovery with available resources within the critical 6-hour deployment window.
                  </p>
                </div>
              </div>
            ) : (
              <div className="p-3 rounded-lg bg-sky-950/30 border border-sky-500/40 flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 text-sky-400 shrink-0 mt-0.5" />
                <div>
                  <div className="font-bold text-sky-300 text-[11px] mb-1">VIABLE ALTERNATIVE</div>
                  <p className="text-[10px] text-slate-300">
                    This scenario improves recovery to {selected.recoveryPct}% but at additional cost ({selected.cost}).
                    Consider if additional resources are available within the deployment window.
                  </p>
                </div>
              </div>
            )}

            <div className="space-y-2 text-[11px]">
              <div className="font-bold text-slate-300 uppercase text-[10px] tracking-wider">Scenario Impact Matrix:</div>
              {DEMO_WHATIF_SCENARIOS.map((s) => (
                <div
                  key={s.id}
                  className={`flex items-center gap-3 p-2 rounded cursor-pointer transition-colors ${
                    s.id === selectedId ? 'bg-blue-950/30 border border-sky-500/30' : 'hover:bg-slate-800/20'
                  }`}
                  onClick={() => setSelectedId(s.id)}
                >
                  <div className="w-24 shrink-0 truncate text-slate-300">{s.label}</div>
                  <div className="flex-1">
                    <div className="flex gap-1 items-center">
                      <span className="text-[9px] text-slate-500 w-8">Imp:</span>
                      <div className="flex-1 h-2 bg-slate-800 rounded-full">
                        <div className="h-full rounded-full bg-red-500" style={{ width: `${s.impactPct}%` }} />
                      </div>
                      <span className="text-[9px] text-slate-300 w-6 text-right">{s.impactPct}%</span>
                    </div>
                    <div className="flex gap-1 items-center mt-0.5">
                      <span className="text-[9px] text-slate-500 w-8">Rec:</span>
                      <div className="flex-1 h-2 bg-slate-800 rounded-full">
                        <div className="h-full rounded-full bg-emerald-500" style={{ width: `${s.recoveryPct}%` }} />
                      </div>
                      <span className="text-[9px] text-slate-300 w-6 text-right">{s.recoveryPct}%</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </CrystallinePanel>
      </div>
      </>)}
    </div>
  );
};
