import React, { useState, useEffect } from 'react';
import { Play, Pause, Clock } from 'lucide-react';

interface SequenceStep {
  time: string;
  label: string;
  detail: string;
}

const STEPS: SequenceStep[] = [
  { time: '02:00', label: 'Vessel Approaching', detail: 'AIS track intersecting sector' },
  { time: '03:00', label: 'Near Spill Location', detail: 'Proximity < 1.2 km' },
  { time: '04:00', label: 'Possible Release', detail: 'Initial backscatter anomaly' },
  { time: '06:00', label: 'Spill Expanding', detail: 'Plume area 12.4 km²' },
  { time: '12:00', label: 'Larger Spread', detail: 'Drift trajectory SE' },
  { time: '24:00', label: 'Wider Dispersion', detail: 'Approaching coastal zone' },
];

export const TimeLapseGallery: React.FC = () => {
  const [activeStep, setActiveStep] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);

  useEffect(() => {
    let interval: ReturnType<typeof setInterval>;
    if (isPlaying) {
      interval = setInterval(() => {
        setActiveStep((prev) => (prev + 1) % STEPS.length);
      }, 1200);
    }
    return () => clearInterval(interval);
  }, [isPlaying]);

  return (
    <div className="crystalline-panel rounded-lg p-4 font-mono space-y-3 border-cyan-500/20">
      <div className="flex items-center justify-between border-b border-slate-800 pb-2">
        <div className="flex items-center gap-2">
          <Clock className="w-4 h-4 text-cyan-400" />
          <span className="font-bold text-slate-100 text-xs uppercase tracking-wider">
            TIME-LAPSE SEQUENCE (SATELLITE VIEW)
          </span>
        </div>
        <button
          onClick={() => setIsPlaying(!isPlaying)}
          className="px-3 py-1 rounded bg-cyan-500/20 hover:bg-cyan-500/30 border border-cyan-500/40 text-cyan-300 text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
        >
          {isPlaying ? (
            <>
              <Pause className="w-3.5 h-3.5 fill-current text-cyan-400" />
              <span>Pause Animation</span>
            </>
          ) : (
            <>
              <Play className="w-3.5 h-3.5 fill-current text-cyan-400" />
              <span>Play Animation</span>
            </>
          )}
        </button>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2.5">
        {STEPS.map((step, idx) => {
          const isActive = idx === activeStep;
          return (
            <div
              key={step.time}
              onClick={() => setActiveStep(idx)}
              className={`p-2.5 rounded border transition-all cursor-pointer ${
                isActive
                  ? 'bg-cyan-950/60 border-cyan-400 shadow-[0_0_12px_rgba(6,182,212,0.3)]'
                  : 'bg-[#030914] border-slate-800/80 hover:border-slate-700'
              }`}
            >
              {/* Synthetic Satellite Image Preview Box */}
              <div className="relative aspect-video rounded bg-slate-900 overflow-hidden mb-2 border border-slate-800">
                <div
                  className="absolute inset-0 bg-cover bg-center opacity-70"
                  style={{
                    backgroundImage: `radial-gradient(circle at ${40 + idx * 5}% ${
                      50 + idx * 3
                    }%, rgba(239, 68, 68, ${0.4 + idx * 0.1}), transparent 60%), radial-gradient(circle at 50% 50%, #030712 0%, #0b172d 100%)`,
                  }}
                />
                <span className="absolute top-1 left-1 px-1 rounded bg-slate-950/80 text-[9px] text-cyan-300 font-bold border border-cyan-500/30">
                  {step.time}
                </span>
              </div>

              <div className="text-[11px] font-bold text-slate-200 truncate">{step.label}</div>
              <div className="text-[9px] text-slate-400 truncate mt-0.5">{step.detail}</div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
