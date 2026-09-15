import React from 'react';

interface RadialGaugeProps {
  value: number; // 0.0 to 1.0 (or 0 to 100)
  max?: number;
  label: string;
  size?: number;
  strokeWidth?: number;
  color?: 'cyan' | 'emerald' | 'amber' | 'red' | 'blue';
  showPercent?: boolean;
}

export const RadialGauge: React.FC<RadialGaugeProps> = ({
  value,
  max = 1.0,
  label,
  size = 72,
  strokeWidth = 6,
  color = 'blue',
  showPercent = false,
}) => {
  const normalizedValue = value > 1 && max === 1.0 ? value / 100 : value;
  const percentage = Math.min(Math.max(normalizedValue / max, 0), 1);
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - percentage * circumference;

  const colorMap = {
    cyan: { stroke: '#38bdf8', text: 'text-sky-300', bg: 'rgba(56,189,248,0.12)' },
    emerald: { stroke: '#10b981', text: 'text-emerald-400', bg: 'rgba(16,185,129,0.1)' },
    amber: { stroke: '#f59e0b', text: 'text-amber-400', bg: 'rgba(245,158,11,0.1)' },
    red: { stroke: '#ef4444', text: 'text-red-400', bg: 'rgba(239,68,68,0.1)' },
    blue: { stroke: '#2563eb', text: 'text-sky-300', bg: 'rgba(37,99,235,0.15)' },
  };

  const selectedColor = colorMap[color] || colorMap.blue;

  const displayVal = showPercent
    ? `${(normalizedValue * 100).toFixed(0)}%`
    : normalizedValue.toFixed(2);

  return (
    <div className="flex flex-col items-center text-center font-mono">
      <div className="relative flex items-center justify-center" style={{ width: size, height: size }}>
        <svg className="transform -rotate-90" width={size} height={size}>
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            stroke="rgba(30, 41, 59, 0.8)"
            strokeWidth={strokeWidth}
            fill="transparent"
          />
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            stroke={selectedColor.stroke}
            strokeWidth={strokeWidth}
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
            strokeLinecap="round"
            fill="transparent"
            className="transition-all duration-700 ease-out drop-shadow-[0_0_6px_rgba(56,189,248,0.5)]"
          />
        </svg>
        <span className={`absolute font-bold text-xs ${selectedColor.text} tabular-nums`}>
          {displayVal}
        </span>
      </div>
      <span className="text-[10px] text-slate-400 font-medium uppercase tracking-wider mt-1.5 max-w-[90px] leading-tight">
        {label}
      </span>
    </div>
  );
};

