import React, { useState } from 'react';
import { SectionHeader } from '../components/ui/SectionHeader';
import { CrystallinePanel } from '../components/ui/CrystallinePanel';
import { TrendingDown, TrendingUp, AlertTriangle, CheckCircle2, Minus, Play } from 'lucide-react';
import { DEMO_INCIDENT } from '../data/demoIncident';
import { DEMO_WHATIF_SCENARIOS } from '../data/demoResources';
import { usePipelineStore } from '../stores/pipelineStore';
import { useIncidentStore } from '../stores/incidentStore';
import { useRunPipeline } from '../hooks/usePipeline';
import { CommandButton } from '../components/ui/CommandButton';

const BASE_SCENARIO_ID = 'current';

export const WhatIfPage: React.FC = () => {
  const [selectedId, setSelectedId] = useState<string>(BASE_SCENARIO_ID);
  const { pipelineExecuted, isPipelineRunning } = usePipelineStore();
  const { selectedSceneId, pipelineMode } = useIncidentStore();
  const runPipelineMutation = useRunPipeline();
  const inc = DEMO_INCIDENT;
  const base = DEMO_WHATIF_SCENARIOS.find((s) => s.id === BASE_SCENARIO_ID)!;
  const selected = DEMO_WHATIF_SCENARIOS.find((s) => s.id === selectedId)!;

  const handleRunPipeline = () => {
    runPipelineMutation.mutate({
      scene_id: selectedSceneId,
      include_modules_11_15: pipelineMode === 'EXTENDED' || pipelineMode === 'FULL_DECISION_SUPPORT',
      include_modules_16_17: pipelineMode === 'FULL_DECISION_SUPPORT',
    });
  };

  const priorityColor = (p: string) => {
    if (p === 'CRITICAL') return 'text-red-400 bg-red-950/40 border-red-500/40';
    if (p === 'HIGH') return 'text-amber-400 bg-amber-950/30 border-amber-500/40';
    if (p === 'MEDIUM') return 'text-sky-400 bg-sky-950/20 border-sky-500/40';
    return 'text-emerald-400 bg-emerald-950/20 border-emerald-500/40';
  };

  const deltaIcon = (val: number, base: number, lowerIsBetter = true) => {
    const better = lowerIsBetter ? val < base : val > base;
    const same = val === base;
    if (same) return <Minus className="w-3 h-3 text-slate-400" />;
    if (better) return <TrendingDown className="w-3 h-3 text-emerald-400" />;
    return <TrendingUp className="w-3 h-3 text-red-400" />;
  };

  const deltaColor = (val: number, base: number, lowerIsBetter = true) => {
    if (val === base) return 'text-slate-400';
    const better = lowerIsBetter ? val < base : val > base;
    return better ? 'text-emerald-400' : 'text-red-400';
  };

  return (
    <div className="space-y-5 font-mono text-xs">
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

      {/* Hero Banner */}
      <div className="crystalline-panel rounded-xl px-5 py-4 text-center border-sky-500/30 bg-sky-950/10">
        <div className="text-sky-400 font-black text-base tracking-widest uppercase mb-1">
          COMPARE BEFORE YOU COMMIT RESOURCES
        </div>
        <p className="text-slate-400 text-[11px]">
          Select a response scenario to see how it changes the predicted environmental impact, expected oil recovery, and operational priority.
        </p>
      </div>

      {/* Scenario Selector */}
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

      {/* Comparison Table */}
      <CrystallinePanel
        title="Scenario Comparison"
        subtitle="All 6 scenarios side-by-side"
        headerAction={
          <span className="text-[10px] text-slate-400">
            <span className="text-sky-400">■</span> Selected: <span className="text-sky-300 font-bold">{selected.label}</span>
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
                const isBase = s.id === BASE_SCENARIO_ID;
                return (
                  <tr
                    key={s.id}
                    onClick={() => setSelectedId(s.id)}
                    className={`border-b border-slate-800/60 cursor-pointer transition-colors ${
                      isSelected
                        ? 'bg-blue-950/30'
                        : isBase
                        ? 'bg-emerald-950/10'
                        : 'hover:bg-slate-800/20'
                    }`}
                  >
                    <td className="py-2.5 pr-4">
                      <div className="flex items-center gap-1.5">
                        {isBase && <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />}
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

      {/* Selected Scenario Deep-Dive */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* Visual comparison bars */}
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
              {
                label: 'Predicted Impact', baseVal: base.impactPct, selVal: selected.impactPct,
                lowerBetter: true, unit: '%', color: 'bg-red-500',
              },
              {
                label: 'Expected Recovery', baseVal: base.recoveryPct, selVal: selected.recoveryPct,
                lowerBetter: false, unit: '%', color: 'bg-emerald-500',
              },
              {
                label: 'ETA to Deploy', baseVal: base.etaHours, selVal: selected.etaHours,
                lowerBetter: true, unit: 'h', color: 'bg-amber-500',
              },
            ].map(({ label, baseVal, selVal, lowerBetter, unit, color }) => {
              const better = lowerBetter ? selVal < baseVal : selVal > baseVal;
              const diff = selVal - baseVal;
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
                    {/* Base bar */}
                    <div
                      className="absolute top-0 left-0 h-full bg-slate-600 rounded-full opacity-50"
                      style={{ width: `${Math.min(baseVal, 100)}%` }}
                    />
                    {/* Scenario bar */}
                    <div
                      className={`absolute top-0 left-0 h-full ${color} rounded-full opacity-80 transition-all duration-500`}
                      style={{ width: `${Math.min(selVal, 100)}%` }}
                    />
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

        {/* Recommendation */}
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
                  className={`flex items-center gap-3 p-2 rounded cursor-pointer transition-colors ${s.id === selectedId ? 'bg-blue-950/30 border border-sky-500/30' : 'hover:bg-slate-800/20'}`}
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
