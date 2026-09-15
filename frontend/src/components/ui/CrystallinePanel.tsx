import React from 'react';
import { cn } from '../../utils/cn';

interface CrystallinePanelProps extends Omit<React.HTMLAttributes<HTMLDivElement>, 'title'> {
  title?: React.ReactNode;
  subtitle?: string;
  headerAction?: React.ReactNode;
  active?: boolean;
  glow?: boolean;
  noPadding?: boolean;
}

export const CrystallinePanel: React.FC<CrystallinePanelProps> = ({
  title,
  subtitle,
  headerAction,
  active = false,
  glow = false,
  noPadding = false,
  className,
  children,
  ...props
}) => {
  return (
    <div
      className={cn(
        'crystalline-panel rounded-xl transition-all duration-300',
        active && 'crystalline-panel-active animate-ocean-glow',
        glow && 'shadow-[0_0_25px_rgba(37,99,235,0.3)] border-blue-500/40',
        className
      )}
      {...props}
    >
      {(title || headerAction) && (
        <div className="flex items-center justify-between border-b border-[rgba(56,189,248,0.16)] px-4 py-3 bg-[rgba(9,22,46,0.65)]">
          <div>
            {typeof title === 'string' ? (
              <h3 className="text-xs sm:text-sm font-semibold tracking-wide text-slate-100 flex items-center gap-2">
                {title}
              </h3>
            ) : (
              title
            )}
            {subtitle && (
              <p className="text-[11px] text-slate-400 mt-0.5 font-mono">{subtitle}</p>
            )}
          </div>
          {headerAction && <div className="flex items-center gap-2">{headerAction}</div>}
        </div>
      )}
      <div className={cn(!noPadding && 'p-4')}>{children}</div>
    </div>
  );
};

