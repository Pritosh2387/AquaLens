import React from 'react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import { ChartContainer } from './ChartContainer';

export interface HorizonProgressionPoint {
  horizon: string;
  hours: number;
  areaKm2: number;
  driftKm: number;
  confidence: number;
}

interface ForecastProgressionChartProps {
  data?: HorizonProgressionPoint[];
  title?: string;
  subtitle?: string;
  className?: string;
}

const defaultData: HorizonProgressionPoint[] = [
  { horizon: '0h (Observed)', hours: 0, areaKm2: 3.8, driftKm: 0, confidence: 92 },
  { horizon: '+6h', hours: 6, areaKm2: 5.4, driftKm: 4.2, confidence: 88 },
  { horizon: '+12h', hours: 12, areaKm2: 8.1, driftKm: 9.6, confidence: 82 },
  { horizon: '+24h', hours: 24, areaKm2: 12.6, driftKm: 18.3, confidence: 75 },
  { horizon: '+48h', hours: 48, areaKm2: 19.5, driftKm: 34.8, confidence: 64 },
  { horizon: '+72h', hours: 72, areaKm2: 27.2, driftKm: 51.2, confidence: 52 },
];

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="crystalline-panel p-2.5 rounded border border-blue-500/40 shadow-xl bg-slate-950/95 font-mono text-xs">
        <p className="text-sky-300 font-bold mb-1">{label}</p>
        <div className="space-y-1 text-slate-300">
          <p className="flex justify-between gap-4">
            <span className="text-slate-400">Plume Area:</span>
            <span className="font-bold text-amber-400">{payload[0].value} km²</span>
          </p>
          {payload[1] && (
            <p className="flex justify-between gap-4">
              <span className="text-slate-400">Confidence:</span>
              <span className="font-bold text-sky-400">{payload[1].value}%</span>
            </p>
          )}
        </div>
      </div>
    );
  }
  return null;
};

export const ForecastProgressionChart: React.FC<ForecastProgressionChartProps> = ({
  data = defaultData,
  title = 'FORECAST DRIFT & DISPERSION ENVELOPE (M9)',
  subtitle = 'Projected slick growth & model uncertainty over 72h trajectory',
  className,
}) => {
  return (
    <ChartContainer
      title={title}
      subtitle={subtitle}
      provenance="SIMULATED"
      height={240}
      className={className}
    >
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data} margin={{ top: 10, right: 15, left: -10, bottom: 0 }}>
          <defs>
            <linearGradient id="areaGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.4} />
              <stop offset="95%" stopColor="#f59e0b" stopOpacity={0.0} />
            </linearGradient>
            <linearGradient id="confidenceGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#38bdf8" stopOpacity={0.3} />
              <stop offset="95%" stopColor="#38bdf8" stopOpacity={0.0} />
            </linearGradient>
          </defs>

          <CartesianGrid stroke="rgba(56, 189, 248, 0.08)" strokeDasharray="3 3" vertical={false} />

          <XAxis
            dataKey="horizon"
            stroke="#64748b"
            tick={{ fill: '#94a3b8', fontSize: 10, fontFamily: 'JetBrains Mono' }}
            axisLine={{ stroke: 'rgba(56, 189, 248, 0.2)' }}
          />

          <YAxis
            stroke="#64748b"
            tick={{ fill: '#94a3b8', fontSize: 10, fontFamily: 'JetBrains Mono' }}
            axisLine={{ stroke: 'rgba(56, 189, 248, 0.2)' }}
            unit=" km²"
          />

          <Tooltip content={<CustomTooltip />} />

          <Area
            type="monotone"
            dataKey="areaKm2"
            stroke="#f59e0b"
            strokeWidth={2}
            fillOpacity={1}
            fill="url(#areaGradient)"
            name="Slick Area"
          />

          <Area
            type="monotone"
            dataKey="confidence"
            stroke="#38bdf8"
            strokeWidth={1.5}
            strokeDasharray="4 4"
            fillOpacity={1}
            fill="url(#confidenceGradient)"
            name="Model Confidence"
          />
        </AreaChart>
      </ResponsiveContainer>
    </ChartContainer>
  );
};

