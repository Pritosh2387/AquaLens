import React, { useState, useMemo } from 'react';
import { SectionHeader } from '../components/ui/SectionHeader';
import { CrystallinePanel } from '../components/ui/CrystallinePanel';
import { CommandMapFrame } from '../components/maps/CommandMapFrame';
import { Ship, Search, AlertTriangle, ShieldCheck, ArrowUpDown, Eye, Play } from 'lucide-react';
import { getDemoIncident } from '../data/demoIncident';
import { DEMO_VESSELS, DemoVessel } from '../data/demoVessels';
import {
  DEMO_ALL_SPILL_POLYGONS,
  DEMO_ORIGIN_ZONE,
  DEMO_HINDCAST_TRAJECTORY,
} from '../data/demoMapData';
import { DEMO_METOCEAN } from '../data/demoForecast';
import { VesselDetailModal, SuspectVesselDetail } from '../components/maritime/VesselDetailModal';
import { usePipelineStore } from '../stores/pipelineStore';
import { useIncidentStore } from '../stores/incidentStore';
import { useRunPipeline } from '../hooks/usePipeline';
import { CommandButton } from '../components/ui/CommandButton';

export const AttributionPage: React.FC = () => {
  const { pipelineExecuted, isPipelineRunning } = usePipelineStore();
  const { selectedSceneId, pipelineMode } = useIncidentStore();
  const runPipelineMutation = useRunPipeline();
  const inc = getDemoIncident(selectedSceneId);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState<'ALL' | 'DARK' | 'HIGH_SCORE'>('ALL');
  const [sortField, setSortField] = useState<'rank' | 'score'>('rank');
  const [sortAsc, setSortAsc] = useState(true);
  const [selectedVessel, setSelectedVessel] = useState<DemoVessel | null>(null);

  const handleRunPipeline = () => {
    runPipelineMutation.mutate({
      scene_id: selectedSceneId,
      include_modules_11_15: pipelineMode === 'EXTENDED' || pipelineMode === 'FULL_DECISION_SUPPORT',
      include_modules_16_17: pipelineMode === 'FULL_DECISION_SUPPORT',
    });
  };

  const filtered = useMemo(() => {
    let list = [...DEMO_VESSELS];
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      list = list.filter(
        (v) => v.vessel_name.toLowerCase().includes(q) || String(v.mmsi).includes(q),
      );
    }
    if (filterType === 'DARK') list = list.filter((v) => v.isDark);
    if (filterType === 'HIGH_SCORE') list = list.filter((v) => v.attribution_score > 0.65);
    list.sort((a, b) => {
      const av = sortField === 'rank' ? a.rank : a.attribution_score;
      const bv = sortField === 'rank' ? b.rank : b.attribution_score;
      return sortAsc ? av - bv : bv - av;
    });
    return list;
  }, [searchQuery, filterType, sortField, sortAsc]);

  const toggleSort = (f: 'rank' | 'score') => {
    if (sortField === f) setSortAsc(!sortAsc);
    else { setSortField(f); setSortAsc(f === 'rank'); }
  };

  const scoreColor = (s: number) =>
    s > 0.7 ? 'text-red-400' : s > 0.4 ? 'text-amber-400' : 'text-sky-400';

  const riskBadge = (level: string) => {
    if (level === 'HIGH') return 'bg-red-950/60 text-red-300 border-red-500/40';
    if (level === 'MEDIUM') return 'bg-amber-950/60 text-amber-300 border-amber-500/40';
    return 'bg-slate-800 text-slate-400 border-slate-700';
  };

  const modalVessel: SuspectVesselDetail | null = selectedVessel
    ? {
        rank: selectedVessel.rank,
        name: selectedVessel.vessel_name,
        imo: selectedVessel.imo,
        mmsi: selectedVessel.mmsi,
        type: selectedVessel.vessel_type,
        flag: selectedVessel.flag,
        score: selectedVessel.attribution_score,
        aisEvidence: selectedVessel.aisEvidence,
        sarEvidence: selectedVessel.sarEvidence,
        trajectory: selectedVessel.trajectory,
        isDark: selectedVessel.isDark,
        aisGapDuration: selectedVessel.aisGapDuration,
        positionErrorKm: selectedVessel.positionErrorKm,
        anomalyScore: selectedVessel.anomalyScore,
        originProximityKm: selectedVessel.originProximityKm,
        timingDeltaHours: selectedVessel.timingDeltaHours,
      }
    : null;


  return (
    <div className="space-y-5 font-mono text-xs">
      {!pipelineExecuted && (
        <div className="crystalline-panel rounded-xl p-6 flex flex-col items-center gap-4 border-blue-500/30 bg-blue-950/10">
          <div className="text-slate-400 text-sm font-mono text-center">
            Run the pipeline to populate AIS correlation, suspect vessel ranking and attribution evidence.
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
        title="Vessel Attribution"
        subtitle={`AIS correlation & suspect ranking — Incident ${inc.incidentId} (Modules M5, M6, M8)`}
        provenance="INFERRED"
        moduleTag="M5,M6,M8"
      />

      {/* Primary Suspect Banner */}
      <div className="crystalline-panel rounded-xl px-4 py-3 flex flex-wrap items-center justify-between gap-3 border-red-500/40 bg-red-950/15">
        <div className="flex items-center gap-3">
          <AlertTriangle className="w-5 h-5 text-red-400 animate-pulse" />
          <div>
            <div className="text-[10px] text-red-300 uppercase font-bold tracking-wider">Primary Suspect — Rank #1</div>
            <div className="text-base font-black text-white">{inc.suspectedVessel}</div>
          </div>
        </div>
        <div className="flex items-center gap-4 text-[11px]">
          <div className="text-center">
            <div className="text-[9px] text-slate-400 uppercase">Attribution</div>
            <div className="text-red-400 font-black text-lg">{(inc.attributionScore * 100).toFixed(0)}%</div>
          </div>
          <div className="text-center">
            <div className="text-[9px] text-slate-400 uppercase">AIS Evidence</div>
            <div className="text-emerald-300 font-bold">Strong</div>
          </div>
          <div className="text-center">
            <div className="text-[9px] text-slate-400 uppercase">SAR Evidence</div>
            <div className="text-emerald-300 font-bold">Strong</div>
          </div>
          <div className="text-center">
            <div className="text-[9px] text-slate-400 uppercase">Dark Vessel</div>
            <div className="text-purple-300 font-bold">DETECTED</div>
          </div>
          <div className="text-center">
            <div className="text-[9px] text-slate-400 uppercase">AIS Gap</div>
            <div className="text-amber-300 font-bold">3h 22m</div>
          </div>
        </div>
      </div>

      {/* Main Grid: Map + Table */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Map (2/3) */}
        <div className="lg:col-span-2 space-y-3">
          <CommandMapFrame
            title={`ATTRIBUTION MAP — ${inc.sceneId}`}
            subtitle="AIS vessel tracks • Dark vessel detection • Origin correlation"
            provenance="INFERRED"
            spillPolygons={DEMO_ALL_SPILL_POLYGONS}
            originZone={DEMO_ORIGIN_ZONE}
            backwardTrajectory={DEMO_HINDCAST_TRAJECTORY}
            vessels={DEMO_VESSELS}
            metocean={DEMO_METOCEAN}
            showCalloutLabels={true}
            height="460px"
          />
          <div className="crystalline-panel p-2.5 rounded-lg text-[11px] flex flex-wrap items-center gap-4 text-slate-300">
            <span className="text-slate-400 font-bold">MAP KEY:</span>
            <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-full bg-red-500" /> HIGH (score &gt;0.7)</span>
            <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-full bg-amber-500" /> MEDIUM (0.4–0.7)</span>
            <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-full bg-emerald-500" /> LOW (&lt;0.4)</span>
            <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-full bg-purple-500" /> DARK VESSEL</span>
            <span className="flex items-center gap-1.5 border-l border-slate-700 pl-3"><span className="w-8 h-0.5 bg-red-400 border-b-2 border-dashed" /> AIS Track (HIGH)</span>
          </div>
        </div>

        {/* Right: flex column filling map height — small top spacer aligns Evidence with map legend line */}
        <div className="flex flex-col gap-4" style={{ minHeight: '495px' }}>
          {/* Small spacer nudges evidence up near the map legend bar */}
          <div className="h-8" />

          <CrystallinePanel title="Evidence Summary" subtitle={inc.suspectedVessel}>
            <div className="space-y-2 text-[11px]">
              {[
                { label: 'AIS Gap Duration', value: '3h 22m', highlight: true },
                { label: 'AIS Gap Start', value: '2026-09-14 19:08 UTC', highlight: false },
                { label: 'Origin Proximity', value: '1.4 km', highlight: true },
                { label: 'Timing Delta', value: '0.6 hours', highlight: true },
                { label: 'Trajectory Match', value: 'High (0.93)', highlight: true },
                { label: 'Anomaly Score', value: '93%', highlight: true },
                { label: 'SAR Match', value: 'Dark vessel detected at origin', highlight: false },
                { label: 'Speed at T-4h', value: '4.2 knots (slow)', highlight: false },
              ].map(({ label, value, highlight }) => (
                <div key={label} className="flex justify-between border-b border-slate-800/70 pb-1.5">
                  <span className="text-slate-400">{label}:</span>
                  <span className={highlight ? 'text-amber-300 font-bold' : 'text-slate-200'}>{value}</span>
                </div>
              ))}
            </div>
          </CrystallinePanel>

          {/* Flex spacer — pushes Search & Filter to the bottom */}
          <div className="flex-1" />

          {/* Bottom: Search & Filter pinned to bottom */}
          <CrystallinePanel title="Search & Filter" subtitle="Refine candidate list">
            <div className="space-y-2">
              <div className="relative">
                <Search className="absolute left-2.5 top-2 w-3.5 h-3.5 text-slate-400" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Vessel name or MMSI…"
                  className="w-full bg-[#030814] border border-slate-700 rounded-lg pl-8 pr-3 py-2 text-xs text-slate-200 placeholder-slate-500 focus:border-sky-500 outline-none transition-colors"
                />
              </div>
              <div className="flex gap-1">
                {(['ALL', 'HIGH_SCORE', 'DARK'] as const).map((f) => (
                  <button
                    key={f}
                    onClick={() => setFilterType(f)}
                    className={`flex-1 px-2 py-1 rounded text-[10px] font-bold transition-all cursor-pointer ${
                      filterType === f
                        ? 'bg-blue-600 text-white shadow-[0_0_6px_rgba(37,99,235,0.4)]'
                        : 'bg-[#030814] text-slate-400 border border-slate-700 hover:border-slate-500'
                    }`}
                  >
                    {f === 'HIGH_SCORE' ? 'High Score' : f === 'DARK' ? 'Dark' : 'All'}
                  </button>
                ))}
              </div>
              {(searchQuery || filterType !== 'ALL') && (
                <div className="flex items-center justify-between text-[10px]">
                  <span className="text-slate-500">
                    Showing <span className="text-sky-300 font-bold">{filtered.length}</span> of 5
                  </span>
                  <button
                    onClick={() => { setSearchQuery(''); setFilterType('ALL'); }}
                    className="text-slate-500 hover:text-sky-400 underline cursor-pointer transition-colors"
                  >
                    Clear
                  </button>
                </div>
              )}
            </div>
          </CrystallinePanel>
        </div>
      </div>



      {/* Suspect Vessel Table */}
      <CrystallinePanel
        title="Ranked Suspect Vessels"
        subtitle={`${filtered.length} candidates — sorted by ${sortField}`}
        headerAction={
          <span className="text-[10px] text-slate-400">
            <ShieldCheck className="w-3.5 h-3.5 inline mr-1 text-sky-400" />
            Attribution requires human verification
          </span>
        }
      >
        <div className="overflow-x-auto">
          <table className="w-full text-[11px]">
            <thead>
              <tr className="border-b border-slate-800 text-slate-400 text-[10px] uppercase">
                {[
                  { key: 'rank', label: 'Rank', id: 'col-rank' },
                  { key: null, label: 'Vessel', id: 'col-vessel' },
                  { key: null, label: 'Type', id: 'col-type' },
                  { key: null, label: 'Flag', id: 'col-flag' },
                  { key: 'score', label: 'Attribution', id: 'col-attribution' },
                  { key: null, label: 'AIS', id: 'col-ais' },
                  { key: null, label: 'SAR', id: 'col-sar' },
                  { key: null, label: 'Traj.', id: 'col-traj' },
                  { key: null, label: 'Dark', id: 'col-dark' },
                  { key: null, label: 'AIS Gap', id: 'col-gap' },
                  { key: null, label: 'Status', id: 'col-status' },
                  { key: null, label: '', id: 'col-action' },
                ].map(({ key, label, id }) => (
                  <th
                    key={id}
                    className={`pb-2 pr-4 text-left font-bold ${key ? 'cursor-pointer hover:text-sky-300 select-none' : ''}`}
                    onClick={key ? () => toggleSort(key as 'rank' | 'score') : undefined}
                  >
                    <span className="flex items-center gap-1">
                      {label}
                      {key && <ArrowUpDown className="w-2.5 h-2.5" />}
                    </span>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={12} className="py-8 text-center text-slate-500 text-[11px]">
                    <div className="flex flex-col items-center gap-2">
                      <Search className="w-5 h-5 text-slate-600" />
                      <span>No vessels match the current filter.</span>
                      <button
                        onClick={() => { setSearchQuery(''); setFilterType('ALL'); }}
                        className="text-sky-400 hover:text-sky-300 underline text-[10px] cursor-pointer"
                      >
                        Clear filters
                      </button>
                    </div>
                  </td>
                </tr>
              ) : (
                filtered.map((v) => (
                  <tr
                    key={v.mmsi}
                    onClick={() => setSelectedVessel(v as any)}
                    className={`border-b border-slate-800/60 hover:bg-slate-800/30 cursor-pointer transition-colors ${v.rank === 1 ? 'bg-red-950/20' : ''}`}
                  >
                    <td className="py-2.5 pr-4">
                      <span className={`font-black text-sm ${v.rank === 1 ? 'text-red-400' : 'text-slate-300'}`}>
                        #{v.rank}
                      </span>
                    </td>
                    <td className="pr-4">
                      <div className="font-bold text-slate-100">{v.vessel_name}</div>
                      <div className="text-[9px] text-slate-500">MMSI: {v.mmsi}</div>
                    </td>
                    <td className="pr-4 text-slate-400">{v.vessel_type}</td>
                    <td className="pr-4 text-slate-400">{v.flag}</td>
                    <td className="pr-4">
                      <div className={`font-black text-sm tabular-nums ${scoreColor(v.attribution_score)}`}>
                        {(v.attribution_score * 100).toFixed(0)}%
                      </div>
                      <div className="w-16 h-1 bg-slate-800 rounded-full mt-0.5">
                        <div
                          className={`h-full rounded-full ${v.attribution_score > 0.7 ? 'bg-red-500' : v.attribution_score > 0.4 ? 'bg-amber-500' : 'bg-sky-500'}`}
                          style={{ width: `${v.attribution_score * 100}%` }}
                        />
                      </div>
                    </td>
                    <td className={`pr-4 font-bold ${v.aisEvidence === 'Strong' ? 'text-emerald-400' : v.aisEvidence === 'Medium' ? 'text-amber-400' : 'text-slate-400'}`}>
                      {v.aisEvidence}
                    </td>
                    <td className={`pr-4 font-bold ${v.sarEvidence === 'Strong' ? 'text-emerald-400' : v.sarEvidence === 'Medium' ? 'text-amber-400' : 'text-slate-400'}`}>
                      {v.sarEvidence}
                    </td>
                    <td className={`pr-4 font-bold ${v.trajectory === 'High' ? 'text-emerald-400' : v.trajectory === 'Medium' ? 'text-amber-400' : 'text-slate-400'}`}>
                      {v.trajectory}
                    </td>
                    <td className="pr-4">
                      {v.isDark ? (
                        <span className="px-1.5 py-0.5 rounded bg-purple-950 text-purple-300 text-[9px] font-bold border border-purple-500/40">DARK</span>
                      ) : (
                        <span className="text-slate-500">—</span>
                      )}
                    </td>
                    <td className={`pr-4 tabular-nums ${v.isDark ? 'text-amber-300' : 'text-slate-400'}`}>{v.aisGapDuration}</td>
                    <td className="pr-4">
                      <span className={`px-2 py-0.5 rounded text-[9px] font-bold border ${riskBadge(v.risk_level)}`}>
                        {v.status}
                      </span>
                    </td>
                    <td>
                      <button className="text-sky-400 hover:text-sky-300 cursor-pointer">
                        <Eye className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </CrystallinePanel>

      {selectedVessel && modalVessel && (
        <VesselDetailModal vessel={modalVessel} onClose={() => setSelectedVessel(null)} />
      )}
      </>)}
    </div>
  );
};
