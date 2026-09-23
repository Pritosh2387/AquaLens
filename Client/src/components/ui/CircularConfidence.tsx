import React from 'react';
import { cn } from '../../utils/cn';

interface CircularConfidenceProps {
  confidence: number; // 0 to 1
  label?: string;
  sublabel?: string;
  size?: number;
  strokeWidth?: number;
  className?: string;
}

export const CircularConfidence: React.FC<CircularConfidenceProps> = ({
  confidence,
  label = 'SYSTEM CONFIDENCE',
  sublabel,
  size = 120,
  strokeWidth = 8,
  className,
}) => {
  const clamped = Math.min(Math.max(confidence, 0), 1);
  const percentage = Math.round(clamped * 100);
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - clamped * circumference;

  // Grade confidence (explicitly distinct from probability)
  let strokeColor = '#ef4444'; // Red < 50
  let tier = 'LOW';
  if (percentage >= 80) {
    strokeColor = '#10b981'; // High
    tier = 'HIGH';
  } else if (percentage >= 60) {
    strokeColor = '#06b6d4'; // Good
    tier = 'MODERATE';
  } else if (percentage >= 40) {
    strokeColor = '#f59e0b'; // Caution
    tier = 'CAUTION';
  }

  return (
    <div className={cn('flex flex-col items-center justify-center font-mono select-none', className)}>
      <div className="relative flex items-center justify-center" style={{ width: size, height: size }}>
        <svg width={size} height={size} className="rotate-[-90deg]">
          {/* Background Track */}
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            stroke="#0a1931"
            strokeWidth={strokeWidth}
            fill="transparent"
          />
          {/* Outer subtle guide ring */}
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius + strokeWidth / 2 + 3}
            stroke="rgba(56, 189, 248, 0.12)"
            strokeWidth={1}
            strokeDasharray="2, 4"
            fill="transparent"
          />
          {/* Active Confidence Progress Arc */}
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            stroke={strokeColor}
            strokeWidth={strokeWidth}
            strokeDasharray={circumference}
            strokeDashoffset={offset}
            strokeLinecap="round"
            fill="transparent"
            style={{
              transition: 'stroke-dashoffset 0.6s cubic-bezier(0.16, 1, 0.3, 1), stroke 0.3s ease',
              filter: `drop-shadow(0 0 4px ${strokeColor}66)`,
            }}
          />
        </svg>

        {/* Center Display */}
        <div className="absolute flex flex-col items-center justify-center text-center">
          <span className="text-xl font-bold tracking-tight instrument-value text-slate-100">
            {percentage}%
          </span>
          <span
            className="text-[9px] font-semibold tracking-wider uppercase px-1 rounded bg-slate-900/80 border border-slate-800"
            style={{ color: strokeColor }}
          >
            {tier}
          </span>
        </div>
      </div>

      <div className="mt-2 text-center">
        <span className="instrument-label text-[10px] text-slate-400 block">{label}</span>
        {sublabel && <span className="text-[10px] text-slate-500 block">{sublabel}</span>}
      </div>
    </div>
  );
};
