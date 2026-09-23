import React from 'react';
import { SectionHeader } from '../components/ui/SectionHeader';
import { CrystallinePanel } from '../components/ui/CrystallinePanel';
import { CommandMapFrame } from '../components/maps/CommandMapFrame';
import { RadialGauge } from '../components/ui/RadialGauge';
import { CheckCircle2, Info, Eye, Satellite, Layers, Signal, Zap } from 'lucide-react';
import { DEMO_INCIDENT } from '../data/demoIncident';
import { DEMO_ALL_SPILL_POLYGONS, DEMO_SPILL_CORE } from '../data/demoMapData';
import { DEMO_METOCEAN } from '../data/demoForecast';

const SPECTRAL_DATA = [
  { wl: '0.4μm', oil: 12, water: 68, land: 42 },
  { wl: '0.5μm', oil: 18, water: 74, land: 55 },
  { wl: '0.6μm', oil: 14, water: 71, land: 62 },
  { wl: '0.7μm', oil: 9, water: 38, land: 78 },
  { wl: '0.8μm', oil: 7, water: 28, land: 85 },
  { wl: '1.0μm', oil: 5, water: 14, land: 71 },
  { wl: '1.2μm', oil: 4, water: 9, land: 63 },
  { wl: '1.6μm', oil: 3, water: 6, land: 54 },
  { wl: '2.0μm', oil: 2, water: 4, land: 44 },
];

export const DetectionPage: React.FC = () => {
  const inc = DEMO_INCIDENT;

  const detailRows = [
    { label: 'Model Architecture', value: inc.sensor.model, color: 'text-sky-300' },
    { label: 'SAR Contribution', value: `${(inc.sensor.sarContribution * 100).toFixed(0)}%`, color: 'text-amber-300' },
    { label: 'Optical Contribution', value: `${(inc.sensor.opticalContribution * 100).toFixed(0)}%`, color: 'text-emerald-300' },
    { label: 'Fusion Confidence', value: `${(inc.sensor.fusionConfidence * 100).toFixed(0)}%`, color: 'text-cyan-300' },
    { label: 'False Positive Risk', value: `Low (${inc.sensor.fusionConfidence < 0.5 ? 'HIGH' : (1 - inc.sensor.fusionConfidence).toFixed(2)})`, color: 'text-emerald-400' },
    { label: 'Satellite Pass', value: inc.sensor.satellite, color: 'text-slate-200' },
    { label: 'Acquisition Time', value: inc.sensor.passTime, color: 'text-slate-200' },
    { label: 'Processing Time', value: inc.sensor.processingTime, color: 'text-slate-200' },
    { label: 'Spill Type', value: inc.spillType, color: 'text-amber-200' },
    { label: 'Status', value: inc.detectionStatus, color: 'text-emerald-400 font-bold' },
  ];

  const evidencePoints = [
    'Dark, smooth surface pattern in SAR (VV polarization) matches oil dielectric signature. Backscatter anomaly: −12.4 dB vs ocean background.',
    'Optical cross-validation corroborates reduced NIR reflectance (Band 8: 0.04 vs ocean 0.14) consistent with hydrocarbon film.',
    'Spill boundary confirmed by segmentation model (IoU 0.93 on validation set). No wind-slick or biogenic-film false positive indicators detected.',
    'Spectral analysis shows crude oil signature consistent with API gravity 28-35°. Emulsion state: water-in-oil (mousse).',
  ];

  return (
    <div className="space-y-5 font-mono text-xs">
      <SectionHeader
        title="Spill Detection"
        subtitle={`AI-powered multi-sensor detection — Incident ${inc.incidentId} (Modules M1–M4)`}
        provenance="OBSERVED"
        moduleTag="M1-M4"
      />

      {/* Pipeline Stepper */}
      <div className="crystalline-panel p-3 rounded-xl flex items-center justify-between gap-2 overflow-x-auto">
        {[
          { step: 1, label: 'SAR Ingest', done: true, active: false },
          { step: 2, label: 'Optical Fusion', done: true, active: false },
          { step: 3, label: 'AI Detection', done: true, active: false },
          { step: 4, label: 'Verification', done: false, active: true },
          { step: 5, label: 'Confirmed', done: false, active: false },
        ].map((item, i, arr) => (
          <div key={item.step} className="flex items-center gap-2 shrink-0">
            <div
              className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold ${
                item.done
                  ? 'bg-emerald-600 text-white'
                  : item.active
                  ? 'bg-blue-600 text-white shadow-[0_0_12px_#38bdf8]'
                  : 'bg-slate-800 text-slate-400 border border-slate-700'
              }`}
            >
              {item.done ? <CheckCircle2 className="w-4 h-4" /> : item.step}
            </div>
            <span className={item.active ? 'text-sky-300 font-bold' : item.done ? 'text-emerald-300' : 'text-slate-400'}>
              {item.label}
            </span>
            {i < arr.length - 1 && <div className="w-8 sm:w-12 h-0.5 bg-slate-800" />}
          </div>
        ))}
      </div>

      {/* Main grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Map (2/3) */}
        <div className="lg:col-span-2 space-y-3">
          <CommandMapFrame
            title={`DETECTION MAP — ${inc.sceneId}`}
            subtitle={`${inc.location.latitude}° N, ${inc.location.longitude}° E • ${inc.sensor.passTime}`}
            provenance="OBSERVED"
            status="SPILL CONFIRMED"
            spillPolygons={DEMO_ALL_SPILL_POLYGONS}
            spillCore={DEMO_SPILL_CORE}
            metocean={DEMO_METOCEAN}
            showCalloutLabels={true}
            height="460px"
          />
          {/* Detection overlay legend */}
          <div className="crystalline-panel p-2.5 rounded-lg text-[11px] flex flex-wrap items-center justify-between gap-3 text-slate-300">
            <span className="text-slate-400 font-bold">DETECTION OVERLAYS:</span>
            <div className="flex flex-wrap items-center gap-4">
              <span className="flex items-center gap-1.5">
                <span className="w-3 h-3 rounded-sm bg-amber-700/90 border border-amber-500" />
                <span>SAR Detected Slick</span>
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-3 h-3 rounded-sm bg-amber-500/60 border border-amber-400" />
                <span>High Confidence Core</span>
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-3 h-3 rounded-sm bg-cyan-500/30 border border-cyan-400" />
                <span>Current Vector</span>
              </span>
            </div>
          </div>
        </div>

        {/* Right: Detection result + Evidence */}
        <div className="space-y-4">
          {/* Detection result card */}
          <CrystallinePanel
            title="Detection Result"
            subtitle={`${inc.sensor.model} Dual-Sensor Engine`}
            headerAction={
              <span className="px-2 py-0.5 rounded bg-emerald-950 text-emerald-400 text-[10px] font-bold border border-emerald-500/40 flex items-center gap-1">
                <CheckCircle2 className="w-3 h-3" />
                CONFIRMED
              </span>
            }
          >
            <div className="grid grid-cols-2 gap-3 py-2 border-b border-slate-800">
              <RadialGauge value={inc.spillProbability} label="Spill Probability" color="emerald" showPercent />
              <div className="flex flex-col justify-center">
                <span className="text-[10px] text-slate-400 uppercase">Est. Area</span>
                <span className="text-xl font-bold text-sky-300 tabular-nums">{inc.estimatedAreaStr}</span>
                <span className="text-[10px] text-slate-400 mt-1">Volume: {inc.estimatedVolume}</span>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-2 mt-3">
              <div className="p-2 rounded bg-[#030814] border border-slate-800">
                <span className="text-slate-400 block text-[9px] uppercase">SAR</span>
                <span className="text-amber-300 font-bold">{(inc.sensor.sarContribution * 100).toFixed(0)}%</span>
              </div>
              <div className="p-2 rounded bg-[#030814] border border-slate-800">
                <span className="text-slate-400 block text-[9px] uppercase">Optical</span>
                <span className="text-emerald-300 font-bold">{(inc.sensor.opticalContribution * 100).toFixed(0)}%</span>
              </div>
              <div className="p-2 rounded bg-[#030814] border border-slate-800">
                <span className="text-slate-400 block text-[9px] uppercase">Fusion</span>
                <span className="text-cyan-300 font-bold">{(inc.sensor.fusionConfidence * 100).toFixed(0)}%</span>
              </div>
              <div className="p-2 rounded bg-[#030814] border border-slate-800">
                <span className="text-slate-400 block text-[9px] uppercase">Spill Type</span>
                <span className="text-amber-200 font-bold text-[10px]">{inc.spillType}</span>
              </div>
            </div>
          </CrystallinePanel>

          {/* Sensor Evidence Thumbnails */}
          <CrystallinePanel title="Sensor Evidence" subtitle="Multi-spectral imagery layers">
            <div className="grid grid-cols-3 gap-2">
              {[
                { icon: Signal, color: 'text-sky-400', label: 'SAR (VV)', value: '92%', note: 'Backscatter anomaly' },
                { icon: Eye, color: 'text-emerald-400', label: 'Optical NIR', value: '88%', note: 'Reflectance diff' },
                { icon: Layers, color: 'text-amber-400', label: 'AI Overlay', value: '91%', note: 'Fusion score' },
              ].map(({ icon: Icon, color, label, value, note }) => (
                <div key={label} className="p-1.5 rounded bg-[#030814] border border-slate-800 text-center">
                  <div className="aspect-square rounded bg-slate-900 overflow-hidden mb-1 border border-slate-700 flex flex-col items-center justify-center gap-1">
                    <Icon className={`w-5 h-5 ${color}`} />
                    <span className={`text-[10px] font-bold ${color}`}>{value}</span>
                  </div>
                  <span className="text-[9px] text-slate-300 font-bold block">{label}</span>
                  <span className="text-[8px] text-slate-500 block">{note}</span>
                </div>
              ))}
            </div>
          </CrystallinePanel>
        </div>
      </div>

      {/* Bottom panels: Spectral signature + Details + Insights */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Spectral signature chart */}
        <CrystallinePanel title="Spectral Signature" subtitle="Reflectance vs Wavelength (μm)">
          <div className="p-3 bg-[#030814] rounded-lg border border-slate-800 space-y-2">
            <div className="h-36 flex items-end justify-between gap-1 px-2 border-b border-l border-slate-700">
              {SPECTRAL_DATA.map((d) => (
                <div key={d.wl} className="flex flex-col items-center flex-1 gap-0.5">
                  <div className="w-full flex gap-0.5 items-end" style={{ height: '100px' }}>
                    <div className="flex-1 bg-red-500/70 rounded-t" style={{ height: `${d.oil}%` }} title={`Oil: ${d.oil}%`} />
                    <div className="flex-1 bg-sky-500/70 rounded-t" style={{ height: `${d.water}%` }} title={`Water: ${d.water}%`} />
                    <div className="flex-1 bg-emerald-500/70 rounded-t" style={{ height: `${d.land}%` }} title={`Land: ${d.land}%`} />
                  </div>
                  <span className="text-[7px] text-slate-500 rotate-45 origin-left mt-2">{d.wl}</span>
                </div>
              ))}
            </div>
            <div className="flex justify-around text-[10px] pt-1">
              <span className="text-red-400">● Oil (detected)</span>
              <span className="text-sky-400">● Ocean water</span>
              <span className="text-emerald-400">● Land reference</span>
            </div>
          </div>
        </CrystallinePanel>

        {/* Detection details table */}
        <CrystallinePanel title="Detection Details" subtitle="Model & sensor metrics">
          <div className="space-y-1.5 text-[11px]">
            {detailRows.map((r) => (
              <div key={r.label} className="flex justify-between border-b border-slate-800/80 pb-1.5">
                <span className="text-slate-400">{r.label}:</span>
                <span className={r.color}>{r.value}</span>
              </div>
            ))}
          </div>
        </CrystallinePanel>

        {/* Key Insights */}
        <CrystallinePanel title="Detection Evidence" subtitle="Multi-sensor verification">
          <div className="space-y-2.5">
            {evidencePoints.map((pt, i) => (
              <div key={i} className="flex items-start gap-2 p-2 rounded bg-blue-950/20 border border-blue-900/40">
                <Info className="w-3.5 h-3.5 text-sky-400 shrink-0 mt-0.5" />
                <p className="text-[11px] text-slate-300 leading-relaxed">{pt}</p>
              </div>
            ))}
            <div className="flex items-center gap-2 p-2 rounded bg-emerald-950/30 border border-emerald-500/40 mt-1">
              <Zap className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
              <p className="text-[11px] text-emerald-300 font-bold">Detection Status: CONFIRMED — No false positive indicators.</p>
            </div>
          </div>
        </CrystallinePanel>
      </div>
    </div>
  );
};
