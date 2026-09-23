import React from 'react';
import { NavLink } from 'react-router-dom';
import { NAVIGATION_ITEMS } from '../../config/navigation';
import { useUIStore } from '../../stores/uiStore';
import { ChevronLeft, ChevronRight, Waves } from 'lucide-react';
import { DualRingSonarLens } from '../ui/DualRingSonarLens';
import { cn } from '../../utils/cn';

export const Sidebar: React.FC = () => {
  const { sidebarCollapsed, toggleSidebar } = useUIStore();

  return (
    <aside
      className={cn(
        'fixed top-0 bottom-0 left-0 z-40 bg-[#050c1e]/96 border-r border-[rgba(56,189,248,0.18)] backdrop-blur-2xl transition-all duration-300 flex flex-col shadow-[4px_0_24px_rgba(0,0,0,0.5)]',
        sidebarCollapsed ? 'w-16' : 'w-64'
      )}
    >
      {/* Brand Header: AQUALENS Side-by-Side Logo */}
      <div className="h-16 flex items-center justify-between px-4 border-b border-blue-900/40 bg-[#071329]/95 relative overflow-hidden">
        <div className="flex items-center gap-3 overflow-hidden">
          <div className="w-9 h-9 rounded-lg bg-sky-500/20 border border-sky-400/60 flex items-center justify-center shrink-0 text-sky-300 shadow-[0_0_16px_rgba(56,189,248,0.5)] group relative p-1">
            <DualRingSonarLens size="sm" />
            <span className="absolute inset-0 rounded-lg border border-sky-400/30 animate-ping opacity-20 pointer-events-none" />
          </div>
          {!sidebarCollapsed && (
            <div>
              <span className="font-mono font-black tracking-[0.2em] text-base text-transparent bg-clip-text bg-gradient-to-r from-white via-sky-200 to-sky-400 block leading-tight drop-shadow-[0_0_10px_rgba(56,189,248,0.5)]">
                AquaLens
              </span>
              <span className="text-[9px] font-mono text-sky-300 font-extrabold tracking-[0.2em] uppercase block">
                AI FOR OCEANS
              </span>
            </div>
          )}
        </div>

        <button
          onClick={toggleSidebar}
          aria-label={sidebarCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          className="text-slate-400 hover:text-sky-300 p-1.5 rounded-md hover:bg-blue-950/60 transition-colors hidden md:block"
        >
          {sidebarCollapsed ? (
            <ChevronRight className="w-4 h-4" />
          ) : (
            <ChevronLeft className="w-4 h-4" />
          )}
        </button>
      </div>

      {/* Active Incident Status Badge */}
      {!sidebarCollapsed && (
        <div className="mx-2 mt-2 mb-0.5 px-2.5 py-2 rounded-lg bg-red-950/30 border border-red-500/30 font-mono">
          <div className="flex items-center gap-1.5 mb-0.5">
            <span className="w-2 h-2 rounded-full bg-red-400 animate-pulse shadow-[0_0_6px_#f87171]" />
            <span className="text-[9px] text-red-300 font-bold uppercase tracking-widest">Incident Active</span>
          </div>
          <div className="text-[10px] text-slate-200 font-bold">AQL-047</div>
          <div className="text-[9px] text-slate-400">Arabian Sea • HIGH PRIORITY</div>
        </div>
      )}

      {/* Navigation Items (Exact Ordering Matching PDF Screenshots) */}
      <nav className="flex-1 py-3 px-2 space-y-1.5 overflow-y-auto no-scrollbar">
        {NAVIGATION_ITEMS.map((item) => {
          const Icon = item.icon;
          return (
            <NavLink
              key={item.id}
              to={item.path}
              title={sidebarCollapsed ? item.name : undefined}
              className={({ isActive }) =>
                cn(
                  'flex items-center gap-3 px-3 py-2.5 rounded-lg text-xs font-mono transition-all duration-200 group relative',
                  isActive
                    ? 'bg-blue-600/20 text-sky-300 border border-blue-500/50 shadow-[0_0_16px_rgba(37,99,235,0.35)] font-semibold'
                    : 'text-slate-400 hover:text-slate-100 hover:bg-blue-950/40 border border-transparent'
                )
              }
            >
              {({ isActive }) => (
                <>
                  <Icon
                    className={cn(
                      'w-4 h-4 shrink-0 transition-transform group-hover:scale-110',
                      isActive ? 'text-sky-300 animate-pulse' : 'text-slate-400 group-hover:text-sky-400'
                    )}
                  />

                  {!sidebarCollapsed && (
                    <span className="truncate tracking-wide font-medium">
                      {item.name}
                    </span>
                  )}

                  {isActive && (
                    <div className="absolute left-0 top-1.5 bottom-1.5 w-1 bg-sky-400 rounded-r shadow-[0_0_12px_#38bdf8]" />
                  )}
                </>
              )}
            </NavLink>
          );
        })}
      </nav>

      {/* Bottom Sidebar Footer Banner (PDF Screenshot Sidebar Graphic) */}
      {!sidebarCollapsed && (
        <div className="p-3.5 m-2.5 rounded-xl animated-wave-bg border border-sky-400/40 font-mono text-center relative overflow-hidden shadow-[0_0_20px_rgba(37,99,235,0.4)]">
          <div className="absolute -right-3 -bottom-3 opacity-25 text-sky-300 animate-pulse">
            <Waves className="w-20 h-20" />
          </div>
          <div className="text-sky-300 font-black text-xs tracking-[0.2em] relative z-10 drop-shadow-[0_0_10px_rgba(56,189,248,0.8)] uppercase">
            AI FOR OCEANS
          </div>
          <div className="text-slate-200 text-[10px] tracking-wider relative z-10 font-semibold mt-0.5">
            Cleaner Seas • Safer Tomorrows
          </div>
        </div>
      )}
    </aside>
  );
};

