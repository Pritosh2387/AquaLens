import React from 'react';
import { cn } from '../../utils/cn';

export interface TimelineItem {
  id: string;
  time: string;
  title: string;
  description?: string;
  status?: 'completed' | 'active' | 'pending';
  tag?: string;
}

interface TimelineProps {
  items: TimelineItem[];
  className?: string;
}

export const Timeline: React.FC<TimelineProps> = ({ items, className }) => {
  return (
    <div className={cn('relative pl-6 space-y-6 font-mono text-xs', className)}>
      <div className="absolute left-2 top-2 bottom-2 w-px bg-slate-800" />
      {items.map((item) => {
        const isCompleted = item.status === 'completed';
        const isActive = item.status === 'active';

        return (
          <div key={item.id} className="relative group">
            <div
              className={cn(
                'absolute -left-6 top-1 w-4 h-4 rounded-full border-2 transition-all flex items-center justify-center',
                isCompleted
                  ? 'bg-emerald-500/20 border-emerald-400'
                  : isActive
                  ? 'bg-cyan-500/20 border-cyan-400 animate-pulse'
                  : 'bg-slate-900 border-slate-700'
              )}
            >
              <div
                className={cn(
                  'w-1.5 h-1.5 rounded-full',
                  isCompleted
                    ? 'bg-emerald-400'
                    : isActive
                    ? 'bg-cyan-400'
                    : 'bg-slate-600'
                )}
              />
            </div>

            <div className="flex items-center gap-2">
              <span className="text-slate-400 text-[11px]">{item.time}</span>
              {item.tag && (
                <span className="text-[10px] px-1 py-0.2 rounded bg-slate-800 text-slate-300">
                  {item.tag}
                </span>
              )}
            </div>

            <h4
              className={cn(
                'font-semibold text-sm mt-0.5',
                isActive ? 'text-cyan-300' : 'text-slate-200'
              )}
            >
              {item.title}
            </h4>

            {item.description && (
              <p className="text-xs text-slate-400 mt-0.5">{item.description}</p>
            )}
          </div>
        );
      })}
    </div>
  );
};
