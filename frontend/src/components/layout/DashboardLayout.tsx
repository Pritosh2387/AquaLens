import React from 'react';
import { Outlet } from 'react-router-dom';
import { Sidebar } from './Sidebar';
import { TopCommandBar } from './TopCommandBar';
import { ProvenanceFooter } from './ProvenanceFooter';
import { useUIStore } from '../../stores/uiStore';
import { NAVIGATION_ITEMS } from '../../config/navigation';
import { NavLink } from 'react-router-dom';
import { X, Radar } from 'lucide-react';
import { cn } from '../../utils/cn';

import { ThreeOceanCanvas } from '../ui/ThreeOceanCanvas';

export const DashboardLayout: React.FC = () => {
  const { sidebarCollapsed, mobileMenuOpen, setMobileMenuOpen } = useUIStore();

  return (
    <div className="min-h-screen bg-[#020611] text-slate-100 flex flex-col relative overflow-x-hidden selection:bg-blue-600/40 selection:text-sky-200">
      {/* 1. Three.js Interactive 3D Ocean Background Canvas */}
      <ThreeOceanCanvas opacity={0.35} />

      {/* 2. Persistent Desktop Sidebar */}
      <Sidebar />

      {/* 3. Mobile Navigation Drawer */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 z-50 md:hidden flex">
          <div
            className="fixed inset-0 bg-black/80 backdrop-blur-md"
            onClick={() => setMobileMenuOpen(false)}
          />
          <div className="relative w-64 bg-[#050c1e] border-r border-blue-900/60 p-4 flex flex-col h-full z-10 shadow-2xl">
            <div className="flex items-center justify-between pb-4 border-b border-blue-900/40">
              <div className="flex items-center gap-2">
                <Radar className="w-5 h-5 text-sky-400 radar-sweep-fast" />
                <span className="font-mono font-bold tracking-wider text-slate-100">
                  AQUALENS
                </span>
              </div>
              <button
                onClick={() => setMobileMenuOpen(false)}
                className="p-1 rounded text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <nav className="flex-1 py-4 space-y-1 overflow-y-auto font-mono text-xs">
              {NAVIGATION_ITEMS.map((item) => {
                const Icon = item.icon;
                return (
                  <NavLink
                    key={item.id}
                    to={item.path}
                    onClick={() => setMobileMenuOpen(false)}
                    className={({ isActive }) =>
                      cn(
                        'flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors',
                        isActive
                          ? 'bg-blue-600/20 text-sky-300 border border-blue-500/40 font-semibold'
                          : 'text-slate-400 hover:text-slate-200 hover:bg-blue-950/40'
                      )
                    }
                  >
                    <Icon className="w-4 h-4" />
                    <span>{item.name}</span>
                  </NavLink>
                );
              })}
            </nav>
          </div>
        </div>
      )}

      {/* 4. Top Command / Status Bar */}
      <TopCommandBar />

      {/* 5. Main Content Viewport */}
      <div
        className={cn(
          'flex-1 pt-16 transition-all duration-300 flex flex-col relative z-10',
          sidebarCollapsed ? 'md:pl-16' : 'md:pl-64'
        )}
      >
        <main className="flex-1 p-4 sm:p-6 max-w-7xl w-full mx-auto flex flex-col">
          <Outlet />
          <ProvenanceFooter />
        </main>
      </div>
    </div>
  );
};

