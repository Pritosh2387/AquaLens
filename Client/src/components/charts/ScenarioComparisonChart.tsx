import React from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from 'recharts';
import { ChartContainer } from './ChartContainer';

export interface ScenarioDataPoint {
  scenario: string;
  impactScore: number; // 0 to 100
  reductionPercent: number; // e.g. 0%, 45%, 68%
  color: string;
}

interface ScenarioComparisonChartProps {
  data?: ScenarioDataPoint[];
  title?: string;
  subtitle?: string;
  className?: string;
}

const defaultScenarioData: ScenarioDataPoint[] = [
  { scenario: 'No Action (Drift)', impactScore: 94.0, reductionPercent: 0, color: '#ef4444' },
  { scenario: 'Delayed (+4h)', impactScore: 78.5, reductionPercent: 16.5, color: '#f59e0b' },
  { scenario: 'Baseline (Current)', impactScore: 66.9, reductionPercent: 28.8, color: '#2563eb' },
  { scenario: 'Surge Optimized', impactScore: 31.2, reductionPercent: 66.8, color: '#10b981' },
];

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    const item = payload[0].payload as ScenarioDataPoint;
    return (
      <div className="crystalline-panel p-2.5 rounded border border-blue-500/40 shadow-xl bg-slate-950/95 font-mono text-xs">
        <p className="text-sky-300 font-bold mb-1">{label}</p>
        <p className="text-slate-300 flex justify-between gap-3">
          <span className="text-slate-400">Residual Impact:</span>
          <span className="font-bold text-slate-100">{item.impactScore} / 100</span>
        </p>
        <p className="text-slate-300 flex justify-between gap-3">
          <span className="text-slate-400">Risk Reduction:</span>
          <span className="font-bold text-emerald-400">+{item.reductionPercent}%</span>
        </p>
      </div>
    );
  }
  return null;
};

export const ScenarioComparisonChart: React.FC<ScenarioComparisonChartProps> = ({
  data = defaultScenarioData,
  title = 'COUNTERFACTUAL SCENARIO COMPARISON (M14)',
  subtitle = 'Projected residual asset impact across intervention strategies',
  className,
}) => {
  return (
    <ChartContainer
      title={title}
      subtitle={subtitle}
      provenance="SIMULATED"
      height={220}
      className={className}
    >
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ top: 15, right: 15, left: -10, bottom: 5 }}>
          <CartesianGrid stroke="rgba(56, 189, 248, 0.08)" strokeDasharray="3 3" vertical={false} />
          <XAxis
            dataKey="scenario"
            stroke="#64748b"
            tick={{ fill: '#94a3b8', fontSize: 10, fontFamily: 'JetBrains Mono' }}
            axisLine={{ stroke: 'rgba(56, 189, 248, 0.2)' }}
          />
          <YAxis
            stroke="#64748b"
            domain={[0, 100]}
            tick={{ fill: '#94a3b8', fontSize: 10, fontFamily: 'JetBrains Mono' }}
            axisLine={{ stroke: 'rgba(56, 189, 248, 0.2)' }}
            unit=" pts"
          />
          <Tooltip content={<CustomTooltip />} />
          <Bar dataKey="impactScore" radius={[4, 4, 0, 0]}>
            {data.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={entry.color} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </ChartContainer>
  );
};

