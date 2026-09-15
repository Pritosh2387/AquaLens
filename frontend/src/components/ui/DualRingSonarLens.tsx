import React from 'react';
import { cn } from '../../utils/cn';

interface DualRingSonarLensProps {
  className?: string;
  size?: 'sm' | 'md' | 'lg' | 'hero';
}

export const DualRingSonarLens: React.FC<DualRingSonarLensProps> = ({
  className,
  size = 'md',
}) => {
  const sizeClasses = {
    sm: 'w-5 h-5',
    md: 'w-8 h-8',
    lg: 'w-10 h-10',
    hero: 'w-10 h-10 sm:w-14 sm:h-14',
  }[size];

  return (
    <div className={cn('relative flex items-center justify-center shrink-0 select-none', className)}>
      <svg
        viewBox="0 0 100 100"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className={cn('w-full h-full drop-shadow-[0_0_12px_rgba(56,189,248,0.8)]', sizeClasses)}
      >
        {/* Layer 1: Outer Dashed Telemetry Ring - Rotating Clockwise */}
        <g className="animate-[spin_14s_linear_infinite] origin-center">
          <circle
            cx="50"
            cy="50"
            r="44"
            stroke="currentColor"
            strokeWidth="2.5"
            strokeDasharray="6 8 12 8"
            className="text-sky-400/80"
          />
          <circle
            cx="50"
            cy="50"
            r="48"
            stroke="currentColor"
            strokeWidth="1"
            strokeDasharray="2 10"
            className="text-blue-500/50"
          />
        </g>

        {/* Layer 2: Counter-Rotating Cardinal Ring */}
        <g className="animate-[spin_9s_linear_infinite_reverse] origin-center">
          <circle
            cx="50"
            cy="50"
            r="34"
            stroke="currentColor"
            strokeWidth="2"
            strokeDasharray="16 12"
            className="text-blue-300/90"
          />
          {/* Cardinal Ticks */}
          <line x1="50" y1="12" x2="50" y2="18" stroke="currentColor" strokeWidth="2.5" className="text-sky-300" />
          <line x1="50" y1="82" x2="50" y2="88" stroke="currentColor" strokeWidth="2.5" className="text-sky-300" />
          <line x1="12" y1="50" x2="18" y2="50" stroke="currentColor" strokeWidth="2.5" className="text-sky-300" />
          <line x1="82" y1="50" x2="88" y2="50" stroke="currentColor" strokeWidth="2.5" className="text-sky-300" />
        </g>

        {/* Layer 3: Inner Aperture Iris Arc Ring - Slow Clockwise */}
        <g className="animate-[spin_18s_linear_infinite] origin-center">
          <circle
            cx="50"
            cy="50"
            r="24"
            stroke="currentColor"
            strokeWidth="2.5"
            strokeDasharray="28 14 10 14"
            className="text-cyan-300"
          />
        </g>

        {/* Layer 4: Static Reticle Crosshair */}
        <line x1="50" y1="36" x2="50" y2="64" stroke="currentColor" strokeWidth="1.5" className="text-sky-200/70" />
        <line x1="36" y1="50" x2="64" y2="50" stroke="currentColor" strokeWidth="1.5" className="text-sky-200/70" />

        {/* Layer 5: Glowing Core Hydro-Node with Pulse */}
        <circle cx="50" cy="50" r="8" className="fill-sky-400 animate-pulse" />
        <circle cx="50" cy="50" r="4" className="fill-white" />
      </svg>

      {/* Ambient Radial Glow */}
      <span className="absolute inset-0 rounded-full bg-sky-400/20 blur-md pointer-events-none animate-pulse" />
    </div>
  );
};
