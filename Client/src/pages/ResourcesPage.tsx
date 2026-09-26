import React, { useState } from 'react';
import { SectionHeader } from '../components/ui/SectionHeader';
import { CrystallinePanel } from '../components/ui/CrystallinePanel';
import { CommandMapFrame } from '../components/maps/CommandMapFrame';
import { Zap, CheckCircle2, Package, Anchor, Ship, Wind, Users, Play } from 'lucide-react';
import { CommandButton } from '../components/ui/CommandButton';
import { getDemoIncident } from '../data/demoIncident';
import {
  DEMO_AVAILABLE_RESOURCES,
  DEMO_REQUIRED_RESOURCES,
  DEMO_OPTIMAL_PLAN,
} from '../data/demoResources';
import {
  DEMO_ALL_SPILL_POLYGONS,
  DEMO_FORECAST_24H,
  DEMO_RESPONSE_ZONE_1,
  DEMO_RESPONSE_ZONE_2,
  DEMO_IMPACT_ZONE_HIGH,
} from '../data/demoMapData';
import { DEMO_METOCEAN } from '../data/demoForecast';
import { usePipelineStore } from '../stores/pipelineStore';
import { useIncidentStore } from '../stores/incidentStore';
import { useRunPipeline } from '../hooks/usePipeline';

export const ResourcesPage: React.FC = () => {
  const [planGenerated, setPlanGenerated] = useState(false);
  const { pipelineExecuted, isPipelineRunning } = usePipelineStore();
  const { selectedSceneId, pipelineMode } = useIncidentStore();
  const runPipelineMutation = useRunPipeline();
  const inc = getDemoIncident(selectedSceneId);
  const avail = DEMO_AVAILABLE_RESOURCES;
  const req = DEMO_REQUIRED_RESOURCES;
  const plan = DEMO_OPTIMAL_PLAN;

  const handleRunPipeline = () => {
    runPipelineMutation.mutate({
      scene_id: selectedSceneId,
      include_modules_11_15: pipelineMode === 'EXTENDED' || pipelineMode === 'FULL_DECISION_SUPPORT',
      include_modules_16_17: pipelineMode === 'FULL_DECISION_SUPPORT',
    });
  };

  const resourceTypes = [
    { icon: Package, label: 'Skimmers', available: avail.skimmers, required: req.skimmers, color: 'sky', unallocated: plan.unallocated.skimmers },
    { icon: Anchor, label: 'Booms', available: avail.booms, required: req.booms, color: 'amber', unallocated: plan.unallocated.booms },
    { icon: Ship, label: 'Response Ships', available: avail.responseShips, required: req.responseShips, color: 'purple', unallocated: plan.unallocated.responseShips },
    { icon: Wind, label: 'Dispersal Units', available: avail.chemicalDispersal, required: req.chemicalDispersal, color: 'emerald', unallocated: plan.unallocated.chemicalDispersal },
    { icon: Users, label: 'Dive Teams', available: avail.divingTeams, required: req.divingTeams, color: 'blue', unallocated: 1 },
  ];

  const colorCls: Record<string, { text: string; bg: string; border: string }> = {
    sky: { text: 'text-sky-400', bg: 'bg-sky-500/15', border: 'border-sky-400/40' },
    amber: { text: 'text-amber-400', bg: 'bg-amber-500/15', border: 'border-amber-400/40' },
    purple: { text: 'text-purple-400', bg: 'bg-purple-500/15', border: 'border-purple-400/40' },
    emerald: { text: 'text-emerald-400', bg: 'bg-emerald-500/15', border: 'border-emerald-400/40' },
    blue: { text: 'text-blue-400', bg: 'bg-blue-500/15', border: 'border-blue-400/40' },
  };

  return (
    <div className="space-y-5 font-mono text-xs">
      {!pipelineExecuted && (
        <div className="crystalline-panel rounded-xl p-6 flex flex-col items-center gap-4 border-blue-500/30 bg-blue-950/10">
          <div className="text-slate-400 text-sm font-mono text-center">
            Run the pipeline to load resource availability, requirements and generate the optimal response plan.
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
        title="Resource Planner"
        subtitle={`Optimal response allocation — Incident ${inc.incidentId} (Module M14)`}
        provenance="INFERRED"
        moduleTag="M14"
      />

      {/* Resource Overview Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3.5">
        {resourceTypes.map((r) => {
          const Icon = r.icon;
          const cls = colorCls[r.color];
          return (
            <div key={r.label} className={`crystalline-panel p-3.5 rounded-xl border ${cls.border}`}>
              <div className={`w-9 h-9 rounded-lg ${cls.bg} border ${cls.border} flex items-center justify-center mb-2`}>
                <Icon className={`w-4 h-4 ${cls.text}`} />
              </div>
              <div className="text-[10px] text-slate-400 uppercase tracking-wider mb-1">{r.label}</div>
              <div className="space-y-1 text-[11px]">
                <div className="flex justify-between">
                  <span className="text-slate-400">Available:</span>
                  <span className="font-bold text-slate-100">{r.available}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Required:</span>
                  <span className={`font-bold ${cls.text}`}>{r.required}</span>
                </div>
                {planGenerated && (
                  <div className="flex justify-between border-t border-slate-800 pt-1 mt-1">
                    <span className="text-slate-500">Unallocated:</span>
                    <span className="text-slate-400">{r.unallocated}</span>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Main Grid: Map + Plan Controls */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Response Map */}
        <div className="lg:col-span-2 space-y-3">
          <CommandMapFrame
            title={`RESPONSE PLAN MAP — ${inc.sceneId}`}
            subtitle="Response zones • Forecast extent • Impact zone • Resource deployment"
            provenance="INFERRED"
            spillPolygons={DEMO_ALL_SPILL_POLYGONS}
            forecast24h={DEMO_FORECAST_24H}
            impactZonePolygon={DEMO_IMPACT_ZONE_HIGH}
            responseZone1={planGenerated ? DEMO_RESPONSE_ZONE_1 : null}
            responseZone2={planGenerated ? DEMO_RESPONSE_ZONE_2 : null}
            metocean={DEMO_METOCEAN}
            showCalloutLabels={true}
            height="460px"
          />
          <div className="crystalline-panel p-2.5 rounded-lg text-[11px] flex flex-wrap items-center gap-4 text-slate-300">
            <span className="text-slate-400 font-bold">MAP KEY:</span>
            <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-sm bg-amber-700/80 border border-amber-500" /> Detected Spill</span>
            <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-sm bg-purple-500/40 border border-purple-400 border-dashed" /> +24h Forecast</span>
            <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-sm bg-red-800/60 border border-red-500 border-dashed" /> Impact Zone</span>
            {planGenerated && <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-sm bg-emerald-800/60 border border-emerald-500" /> Response Zones</span>}
          </div>
        </div>

        {/* Right: Generate Plan + Results */}
        <div className="space-y-4">
          {/* Generate Plan CTA */}
          <CrystallinePanel
            title="Optimal Response Plan"
            subtitle="AI-powered resource optimization"
            headerAction={
              planGenerated ? (
                <span className="px-2 py-0.5 rounded bg-emerald-950 text-emerald-400 text-[10px] font-bold border border-emerald-500/40 flex items-center gap-1">
                  <CheckCircle2 className="w-3 h-3" /> Generated
                </span>
              ) : undefined
            }
          >
            {!planGenerated ? (
              <div className="text-center space-y-4 py-4">
                <div className="text-slate-400 text-[11px]">
                  Click to generate the optimal allocation of available resources across the response zones.
                </div>
                <CommandButton
                  variant="primary"
                  size="sm"
                  icon={<Zap className="w-3.5 h-3.5" />}
                  onClick={() => setPlanGenerated(true)}
                  className="w-full justify-center"
                >
                  GENERATE OPTIMAL RESPONSE PLAN
                </CommandButton>
              </div>
            ) : (
              <div className="space-y-3">
                <div className="p-3 rounded-lg bg-emerald-950/30 border border-emerald-500/30">
                  <div className="text-emerald-400 font-bold text-[11px] mb-2">✓ OPTIMAL PLAN GENERATED</div>
                  <div className="space-y-1 text-[11px]">
                    <div className="flex justify-between"><span className="text-slate-400">Plan ID:</span><span className="text-slate-200">{plan.id}</span></div>
                    <div className="flex justify-between"><span className="text-slate-400">Generated:</span><span className="text-slate-200">{plan.generatedAt}</span></div>
                    <div className="flex justify-between"><span className="text-slate-400">Est. Recovery:</span><span className="text-emerald-400 font-bold">{plan.estimatedRecovery}</span></div>
                    <div className="flex justify-between"><span className="text-slate-400">Coverage:</span><span className="text-emerald-400 font-bold">{plan.estimatedCoverage}</span></div>
                    <div className="flex justify-between"><span className="text-slate-400">Deploy Window:</span><span className="text-amber-400 font-bold">{plan.deploymentWindow}</span></div>
                  </div>
                </div>

                {plan.zones.map((z) => (
                  <div key={z.id} className="p-2.5 rounded bg-[#030814] border border-slate-800 space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-emerald-300">{z.name}</span>
                      <span className={`text-[9px] px-1.5 py-0.5 rounded border ${z.priority === 'PRIMARY' ? 'bg-emerald-950 text-emerald-300 border-emerald-500/40' : 'bg-slate-800 text-slate-400 border-slate-700'}`}>
                        {z.priority}
                      </span>
                    </div>
                    <div className="text-slate-400 text-[10px]">Resources: <span className="text-sky-300 font-bold">{z.resources}</span></div>
                    <div className="text-slate-400 text-[10px]">Expected containment: <span className="text-emerald-300 font-bold">{z.expectedContainment}</span></div>
                  </div>
                ))}

                <div className="p-2.5 rounded bg-amber-950/20 border border-amber-500/30 text-[10px]">
                  <div className="text-amber-400 font-bold mb-1">Unallocated Resources:</div>
                  <div className="text-slate-300">
                    {plan.unallocated.skimmers} Skimmer • {plan.unallocated.booms} Booms • {plan.unallocated.responseShips} Ship • {plan.unallocated.chemicalDispersal} Dispersal Unit
                  </div>
                </div>
              </div>
            )}
          </CrystallinePanel>

          {/* Priority Score */}
          <div className="crystalline-panel p-3.5 rounded-xl border-red-500/30 bg-red-950/10">
            <div className="text-[10px] text-slate-400 uppercase mb-1 tracking-wider">Response Priority</div>
            <div className="text-3xl font-black text-red-400">{inc.priorityScore} / 10</div>
            <div className="text-[10px] text-red-300 font-bold">{inc.recommendation.deploymentWindow} deployment recommended</div>
          </div>
        </div>
      </div>
      </>)}
    </div>
  );
};
