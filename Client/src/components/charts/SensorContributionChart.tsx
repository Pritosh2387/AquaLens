import React from 'react';
import { ChartContainer } from './ChartContainer';
import { cn } from '../../utils/cn';

interface SensorContributionChartProps {
  sarContribution?: number; // 0 to 1
  opticalContribution?: number; // 0 to 1
  hasOptical?: boolean;
  className?: string;
}

export const SensorContributionChart: React.FC<SensorContributionChartProps> = ({
  sarContribution = 0.58,
  opticalContribution = 0.27,
  hasOptical = true,
  className,
}) => {
  const sarPct = Math.round(sarContribution * 100);
  const optPct = hasOptical ? Math.round(opticalContribution * 100) : 0;
  const envPct = Math.max(0, 100 - sarPct - optPct);

  return (
    <ChartContainer
      title="SENSOR FUSION CONTRIBUTIONS (M3)"
      subtitle="Weighted confidence breakdown across surveillance modalities"
      provenance="INFERRED"
      height={180}
      className={className}
    >
      <div className="flex flex-col justify-center h-full space-y-4 px-2">
        {/* Stacked Multi-Sensor Horizontal Bar */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-between text-[11px] text-slate-300">
            <span className="text-slate-400">COMBINED SENSOR WEIGHT DISTRIBUTION</span>
            <span className="text-sky-300 font-bold">100% TELEMETRY</span>
          </div>

          <div className="w-full h-4 rounded-full overflow-hidden flex bg-slate-900 border border-slate-800 p-0.5 gap-0.5">
            <div
              className="h-full rounded-l-full bg-blue-600 shadow-[0_0_10px_rgba(37,99,235,0.5)] transition-all duration-500"
              style={{ width: `${sarPct}%` }}
              title={`SAR Synthetic Aperture Radar: ${sarPct}%`}
            />
            {hasOptical && (
              <div
                className="h-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.4)] transition-all duration-500"
                style={{ width: `${optPct}%` }}
                title={`Optical Sentinel-2 MSI: ${optPct}%`}
              />
            )}
            <div
              className="h-full rounded-r-full bg-indigo-500/80 transition-all duration-500"
              style={{ width: `${envPct}%` }}
              title={`Hydrodynamic & Wind Baseline: ${envPct}%`}
            />
          </div>
        </div>

        {/* Breakdown Legend with Badges */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2 border-t border-slate-800/60 font-mono text-xs">
          <div className="flex items-center gap-2 p-2 rounded bg-blue-950/40 border border-blue-500/30">
            <div className="w-2.5 h-2.5 rounded-full bg-sky-400 shrink-0 shadow-[0_0_6px_#38bdf8]" />
            <div className="overflow-hidden">
              <span className="text-[10px] text-slate-400 block truncate">SENTINEL-1 SAR</span>
              <span className="text-sky-300 font-bold">{sarPct}%</span>
            </div>
          </div>

          <div
            className={cn(
              'flex items-center gap-2 p-2 rounded border',
              hasOptical
                ? 'bg-emerald-950/20 border-emerald-500/20'
                : 'bg-slate-900/40 border-slate-800 text-slate-500'
            )}
          >
            <div
              className={cn(
                'w-2.5 h-2.5 rounded-full shrink-0',
                hasOptical ? 'bg-emerald-400 shadow-[0_0_6px_#10b981]' : 'bg-slate-600'
              )}
            />
            <div className="overflow-hidden">
              <span className="text-[10px] text-slate-400 block truncate">
                {hasOptical ? 'SENTINEL-2 OPTICAL' : 'OPTICAL (CLOUD COVER)'}
              </span>
              <span className={hasOptical ? 'text-emerald-300 font-bold' : 'text-slate-500'}>
                {hasOptical ? `${optPct}%` : 'N/A'}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2 p-2 rounded bg-indigo-950/20 border border-indigo-500/20">
            <div className="w-2.5 h-2.5 rounded-full bg-indigo-400 shrink-0" />
            <div className="overflow-hidden">
              <span className="text-[10px] text-slate-400 block truncate">HYDRO / METOCEAN</span>
              <span className="text-indigo-300 font-bold">{envPct}%</span>
            </div>
          </div>
        </div>
      </div>
    </ChartContainer>
  );
};

