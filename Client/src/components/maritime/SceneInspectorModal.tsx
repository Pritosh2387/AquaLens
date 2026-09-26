import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { X, Satellite, Cpu, Activity } from 'lucide-react';

// ─── Image Tab Definitions (only 2 tabs: Raw VV + Optical) ──────────────────

interface ImageTab {
  id: string;
  label: string;
  shortLabel: string;
  src: string;
  badge: string;
  badgeColor: string;
  description: string;
}

const IMAGE_TABS: ImageTab[] = [
  {
    id: 'sar_raw',
    label: 'SAR Context',
    shortLabel: 'SAR CONTEXT',
    src: '/data/processed/sar_raw_vv.png',
    badge: 'SENTINEL-1 SAR',
    badgeColor: 'bg-amber-500/20 text-amber-300 border-amber-500/40',
    description:
      'Raw C-Band SAR backscatter in VV polarization. Dark features indicate reduced radar return — characteristic of oil film suppressing capillary waves.',
  },
  {
    id: 'optical',
    label: 'Optical Context',
    shortLabel: 'OPTICAL',
    src: '/data/processed/optical_context.png',
    badge: 'SENTINEL-2 OPTICAL',
    badgeColor: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40',
    description:
      'Sentinel-2 multi-spectral optical imagery for spatial context. Provides sea-state, vessel, and coastline reference data.',
  },
];

// ─── Telemetry ───────────────────────────────────────────────────────────────

const TELEMETRY_ROWS = [
  { label: 'Satellite Mission',    value: 'Simulated SAR Backtest Input' },
  { label: 'Data Source (Backtest)', value: 'HISTORICAL_WAKASHIO_BACKTEST' },
  { label: 'Sensor Band / Freq',   value: 'C-Band (5.405 GHz)' },
  { label: 'Polarization Channel', value: 'VV + VH Dual-Pol' },
  { label: 'Pixel Resolution',     value: '10m × 10m Ground' },
  { label: 'Acquisition Time',     value: '2026-09-15 03:20 UTC' },
  { label: 'Radar Damping',        value: '9.2 dB Damping' },
];

const SPILL_CHARACTERISTICS = [
  { label: 'Estimated Size',       value: '42.7 km² (Total Area)' },
  { label: 'High Confidence Core', value: '18.3 km²' },
  { label: 'Spill Age (Est.)',     value: '48 - 72 Hours' },
  { label: 'Release Time (Est.)',  value: '2026-09-12 ~14:00 UTC' },
  { label: 'Surface State',        value: 'Oil film / sheen' },
];

// ─── Fallback placeholder (image not found) ──────────────────────────────────

function ImagePlaceholder({ tab }: { tab: ImageTab }) {
  const cfg: Record<string, { icon: string; label: string }> = {
    sar_raw: { icon: '📡', label: 'SAR CONTEXT' },
    optical: { icon: '🛰️', label: 'SENTINEL-2 OPTICAL' },
  };
  const { icon, label } = cfg[tab.id] ?? cfg['sar_raw'];
  return (
    <div className="w-full h-full flex flex-col items-center justify-center bg-slate-900/80">
      <span className="text-4xl mb-3 opacity-60">{icon}</span>
      <span className="text-[11px] font-mono font-bold text-slate-400 uppercase tracking-widest text-center px-4">
        {label}
      </span>
      <span className="text-[10px] text-slate-600 mt-2 font-mono">{tab.src.split('/').pop()}</span>
      <span className="text-[9px] text-slate-700 mt-1 font-mono">
        Place image at Client/public{tab.src}
      </span>
    </div>
  );
}

// ─── Single tab image panel ───────────────────────────────────────────────────
// Each panel has its own local state so onLoad fires once and is never reset.

function TabImagePanel({ tab, isActive }: { tab: ImageTab; isActive: boolean }) {
  const [loaded, setLoaded] = useState(false);
  const [error, setError] = useState(false);

  return (
    /* visibility:hidden keeps the element mounted (image stays cached/loaded)
       without being visible — critical so onLoad never needs to re-fire */
    <div
      className="absolute inset-0"
      style={{ visibility: isActive ? 'visible' : 'hidden' }}
    >
      {error ? (
        <ImagePlaceholder tab={tab} />
      ) : (
        <>
          {!loaded && (
            <div className="absolute inset-0 bg-[#030812] flex items-center justify-center">
              <div className="w-8 h-8 border-2 border-cyan-500/30 border-t-cyan-400 rounded-full animate-spin" />
            </div>
          )}
          <img
            src={tab.src}
            alt={tab.label}
            onLoad={() => setLoaded(true)}
            onError={() => setError(true)}
            draggable={false}
            style={{
              width: '100%',
              height: '100%',
              objectFit: 'contain',
              opacity: loaded ? 1 : 0,
              transition: 'opacity 0.3s ease',
              display: 'block',
            }}
          />
        </>
      )}

      {/* Satellite badge */}
      <div
        className={`absolute top-3 right-3 px-2.5 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest border flex items-center gap-1.5 backdrop-blur-sm ${tab.badgeColor} shadow-lg`}
      >
        <Satellite className="w-3 h-3" />
        {tab.badge}
      </div>

      {/* Corner brackets */}
      <div className="absolute top-0 left-0 w-8 h-8 border-t-2 border-l-2 border-cyan-500/30 rounded-tl-xl pointer-events-none" />
      <div className="absolute bottom-0 right-0 w-8 h-8 border-b-2 border-r-2 border-cyan-500/30 rounded-br-xl pointer-events-none" />
    </div>
  );
}

// ─── Props ───────────────────────────────────────────────────────────────────

export interface SceneInspectorModalProps {
  isOpen: boolean;
  onClose: () => void;
  spillId?: string;
}

// ─── Modal content (rendered inside portal) ──────────────────────────────────

function ModalContent({
  isOpen,
  onClose,
  spillId,
}: SceneInspectorModalProps & { spillId: string }) {
  const [activeTab, setActiveTab] = useState<string>('sar_raw');
  const backdropRef = useRef<HTMLDivElement>(null);

  const currentTab = IMAGE_TABS.find((t) => t.id === activeTab) ?? IMAGE_TABS[0];

  // Escape key
  useEffect(() => {
    if (!isOpen) return;
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [isOpen, onClose]);

  // Scroll lock
  useEffect(() => {
    document.body.style.overflow = isOpen ? 'hidden' : '';
    return () => { document.body.style.overflow = ''; };
  }, [isOpen]);

  // Reset tab when modal opens
  useEffect(() => {
    if (isOpen) setActiveTab('sar_raw');
  }, [isOpen]);

  return (
    /*
     * This div is rendered via createPortal directly into document.body.
     * It is NOT inside the app's layout tree, so no parent stacking context
     * (transforms, filters, isolation) can restrict its z-index.
     */
    <div
      ref={backdropRef}
      onMouseDown={(e) => { if (e.target === backdropRef.current) onClose(); }}
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 99999,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '1rem',
        background: 'rgba(2, 6, 23, 0.88)',
        backdropFilter: 'blur(6px)',
        WebkitBackdropFilter: 'blur(6px)',
        animation: 'siModalFadeIn 0.18s ease-out both',
        fontFamily: "'JetBrains Mono', monospace",
      }}
    >
      {/* ── Modal shell ───────────────────────────────────────────────────── */}
      <div
        onMouseDown={(e) => e.stopPropagation()}
        style={{
          position: 'relative',
          width: '100%',
          maxWidth: '1100px',
          maxHeight: 'calc(100vh - 2rem)',
          display: 'flex',
          flexDirection: 'column',
          borderRadius: '16px',
          background: '#050d1e',
          border: '1px solid rgba(6,182,212,0.25)',
          boxShadow: '0 0 80px rgba(6,182,212,0.18), 0 0 0 1px rgba(6,182,212,0.08)',
          overflow: 'hidden',
          animation: 'siModalScaleIn 0.22s cubic-bezier(0.16,1,0.3,1) both',
          zIndex: 100000,
        }}
      >
        {/* ── HEADER ──────────────────────────────────────────────────── */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '14px 20px',
            background: '#071022',
            borderBottom: '1px solid rgba(6,182,212,0.18)',
            flexShrink: 0,
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div
              style={{
                width: 36, height: 36, borderRadius: 12,
                background: 'rgba(6,182,212,0.1)',
                border: '1px solid rgba(6,182,212,0.3)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                color: '#67e8f9',
              }}
            >
              <Satellite size={18} />
            </div>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                <span style={{ fontSize: 13, fontWeight: 900, color: '#fff', textTransform: 'uppercase', letterSpacing: '0.12em' }}>
                  Scene Inspector
                </span>
                <span style={{ padding: '2px 8px', borderRadius: 6, fontSize: 9, fontWeight: 700, background: 'rgba(120,53,15,0.6)', color: '#fcd34d', border: '1px solid rgba(245,158,11,0.4)', letterSpacing: '0.06em' }}>
                  {spillId}
                </span>
                <span style={{ padding: '2px 8px', borderRadius: 6, fontSize: 9, fontWeight: 700, background: 'rgba(127,29,29,0.6)', color: '#fca5a5', border: '1px solid rgba(239,68,68,0.3)' }}>
                  ● LIVE
                </span>
              </div>
              <p style={{ fontSize: 10, color: '#64748b', marginTop: 2 }}>
                Satellite Scene Telemetry &amp; Multi-Layer Imagery Analysis
              </p>
            </div>
          </div>

          {/* Close button */}
          <button
            onClick={onClose}
            title="Close (Esc)"
            aria-label="Close scene inspector"
            style={{
              width: 36, height: 36, borderRadius: 10, border: '1px solid transparent',
              background: 'transparent', color: '#94a3b8', cursor: 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              transition: 'all 0.15s',
              flexShrink: 0,
            }}
            onMouseEnter={(e) => {
              (e.currentTarget as HTMLButtonElement).style.background = 'rgba(100,116,139,0.25)';
              (e.currentTarget as HTMLButtonElement).style.color = '#fff';
              (e.currentTarget as HTMLButtonElement).style.borderColor = 'rgba(100,116,139,0.4)';
            }}
            onMouseLeave={(e) => {
              (e.currentTarget as HTMLButtonElement).style.background = 'transparent';
              (e.currentTarget as HTMLButtonElement).style.color = '#94a3b8';
              (e.currentTarget as HTMLButtonElement).style.borderColor = 'transparent';
            }}
          >
            <X size={18} />
          </button>
        </div>

        {/* ── BODY ────────────────────────────────────────────────────── */}
        <div style={{ display: 'flex', flex: 1, overflow: 'hidden', minHeight: 0 }}>

          {/* LEFT: image viewer */}
          <div
            style={{
              display: 'flex', flexDirection: 'column', flex: 1,
              borderRight: '1px solid rgba(6,182,212,0.08)',
              minWidth: 0,
            }}
          >
            {/* Tab bar */}
            <div
              style={{
                display: 'flex', alignItems: 'flex-end', gap: 0,
                padding: '12px 16px 0',
                borderBottom: '1px solid rgba(30,41,59,0.7)',
                background: 'rgba(6,15,34,0.8)',
                flexShrink: 0,
                overflowX: 'auto',
              }}
            >
              {IMAGE_TABS.map((tab) => {
                const active = activeTab === tab.id;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    style={{
                      padding: '8px 14px',
                      fontSize: 10, fontWeight: 700, letterSpacing: '0.08em',
                      textTransform: 'uppercase', whiteSpace: 'nowrap',
                      cursor: 'pointer', border: 'none', borderBottom: `2px solid ${active ? '#22d3ee' : 'transparent'}`,
                      color: active ? '#67e8f9' : '#64748b',
                      background: active ? 'rgba(6,182,212,0.06)' : 'transparent',
                      transition: 'all 0.15s',
                      flexShrink: 0,
                      fontFamily: "'JetBrains Mono', monospace",
                    }}
                    onMouseEnter={(e) => {
                      if (!active) (e.currentTarget as HTMLButtonElement).style.color = '#cbd5e1';
                    }}
                    onMouseLeave={(e) => {
                      if (!active) (e.currentTarget as HTMLButtonElement).style.color = '#64748b';
                    }}
                  >
                    {tab.label}
                  </button>
                );
              })}
            </div>

            {/* Image viewport */}
            <div
              style={{
                position: 'relative', flex: 1, background: '#030812',
                margin: 12, borderRadius: 12,
                border: '1px solid rgba(30,41,59,0.6)',
                overflow: 'hidden', minHeight: 300,
              }}
            >
              {IMAGE_TABS.map((tab) => (
                <TabImagePanel
                  key={tab.id}
                  tab={tab}
                  isActive={tab.id === activeTab}
                />
              ))}
            </div>

            {/* Description */}
            <div style={{ padding: '0 12px 12px', flexShrink: 0 }}>
              <div
                style={{
                  padding: '8px 12px', borderRadius: 8,
                  background: 'rgba(6,15,34,0.8)',
                  border: '1px solid rgba(30,41,59,0.6)',
                  fontSize: 10, color: '#94a3b8', lineHeight: 1.6,
                }}
              >
                <span style={{ color: '#e2e8f0', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                  {currentTab.label}:{' '}
                </span>
                {currentTab.description}
              </div>
            </div>
          </div>

          {/* RIGHT: telemetry */}
          <div
            style={{
              width: 400, minWidth: 320, flexShrink: 0,
              display: 'flex', flexDirection: 'column',
              overflowY: 'auto',
            }}
          >
            {/* Header */}
            <div
              style={{
                padding: '16px 20px 12px',
                borderBottom: '1px solid rgba(30,41,59,0.6)',
                flexShrink: 0,
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <Activity size={14} color="#22d3ee" />
                <span style={{ fontSize: 10, fontWeight: 900, color: '#67e8f9', textTransform: 'uppercase', letterSpacing: '0.16em' }}>
                  Satellite Scene Telemetry
                </span>
              </div>
              <p style={{ fontSize: 9, color: '#475569', marginTop: 3, textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                Sensor Metadata · AQL-047 · Arabian Sea Incident
              </p>
            </div>

            {/* Key-value rows */}
            <div style={{ padding: '4px 20px 0', flexShrink: 0 }}>
              {TELEMETRY_ROWS.map((row, i) => (
                <div
                  key={row.label}
                  style={{
                    display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start',
                    gap: 12, padding: '10px 0', fontSize: 11,
                    borderBottom: i < TELEMETRY_ROWS.length - 1 ? '1px solid rgba(30,41,59,0.5)' : '1px solid transparent',
                  }}
                >
                  <span style={{ color: '#64748b', flexShrink: 0 }}>{row.label}</span>
                  <span style={{ color: '#f1f5f9', fontWeight: 700, textAlign: 'right', fontVariantNumeric: 'tabular-nums' }}>
                    {row.value}
                  </span>
                </div>
              ))}
            </div>

            {/* Spill Characteristics Header */}
            <div
              style={{
                padding: '16px 20px 12px',
                borderTop: '1px solid rgba(30,41,59,0.6)',
                borderBottom: '1px solid rgba(30,41,59,0.6)',
                flexShrink: 0,
                marginTop: '8px',
                background: 'rgba(6,15,34,0.4)',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <Activity size={14} color="#f59e0b" />
                <span style={{ fontSize: 10, fontWeight: 900, color: '#fbbf24', textTransform: 'uppercase', letterSpacing: '0.16em' }}>
                  Spill Characteristics
                </span>
              </div>
            </div>

            <div style={{ padding: '4px 20px 0', flexShrink: 0 }}>
              {SPILL_CHARACTERISTICS.map((row, i) => (
                <div
                  key={row.label}
                  style={{
                    display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start',
                    gap: 12, padding: '10px 0', fontSize: 11,
                    borderBottom: i < SPILL_CHARACTERISTICS.length - 1 ? '1px solid rgba(30,41,59,0.5)' : 'none',
                  }}
                >
                  <span style={{ color: '#64748b', flexShrink: 0 }}>{row.label}</span>
                  <span style={{ color: '#f59e0b', fontWeight: 700, textAlign: 'right', fontVariantNumeric: 'tabular-nums' }}>
                    {row.value}
                  </span>
                </div>
              ))}
            </div>

            {/* AI Segmentation summary */}
            <div style={{ padding: '16px 20px', flexShrink: 0 }}>
              <div
                style={{
                  padding: 16, borderRadius: 12,
                  background: 'linear-gradient(135deg, rgba(6,78,59,0.35), rgba(8,51,68,0.25), rgba(8,47,73,0.25))',
                  border: '1px solid rgba(16,185,129,0.28)',
                  boxShadow: '0 0 20px rgba(16,185,129,0.07)',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12 }}>
                  <div
                    style={{
                      width: 32, height: 32, borderRadius: 8, flexShrink: 0,
                      background: 'rgba(16,185,129,0.12)',
                      border: '1px solid rgba(52,211,153,0.3)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      boxShadow: '0 0 8px rgba(52,211,153,0.2)',
                    }}
                  >
                    <Cpu size={14} color="#34d399" />
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                      <span style={{ fontSize: 9, fontWeight: 900, color: '#34d399', textTransform: 'uppercase', letterSpacing: '0.14em' }}>
                        AI SAR Segmentation Summary
                      </span>
                      <span
                        style={{
                          width: 6, height: 6, borderRadius: '50%',
                          background: '#34d399', boxShadow: '0 0 4px #34d399',
                          animation: 'pulse 2s infinite',
                          display: 'inline-block',
                        }}
                      />
                    </div>
                    <p style={{ fontSize: 11, color: '#cbd5e1', lineHeight: 1.6 }}>
                      High-contrast dark feature detected with radar signal attenuation. Spatial boundaries and backscatter characteristics are consistent with a{' '}
                      <span style={{ color: '#6ee7b7', fontWeight: 700 }}>potential oil-slick signature</span>{' '}
                      over the ocean background.
                    </p>
                  </div>
                </div>

                {/* Stats */}
                <div
                  style={{
                    display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8,
                    marginTop: 12, paddingTop: 12,
                    borderTop: '1px solid rgba(6,78,59,0.35)',
                  }}
                >
                  {[
                    { label: 'Backscatter Δ', value: '−9.2 dB', color: '#fcd34d' },
                    { label: 'Model IoU',     value: '0.93',      color: '#67e8f9' },
                    { label: 'Confidence',    value: '94%',        color: '#6ee7b7' },
                  ].map((s) => (
                    <div key={s.label} style={{ textAlign: 'center' }}>
                      <div style={{ fontSize: 14, fontWeight: 900, color: s.color, fontVariantNumeric: 'tabular-nums' }}>
                        {s.value}
                      </div>
                      <div style={{ fontSize: 8, color: '#475569', textTransform: 'uppercase', letterSpacing: '0.08em', marginTop: 2 }}>
                        {s.label}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Footer */}
            <div style={{ padding: '0 20px 16px', marginTop: 'auto', flexShrink: 0 }}>
              <div
                style={{
                  display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                  padding: '8px 12px', borderRadius: 8,
                  background: 'rgba(6,15,34,0.8)',
                  border: '1px solid rgba(30,41,59,0.5)',
                  fontSize: 9,
                }}
              >
                <span style={{ color: '#334155', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Scene</span>
                <span style={{ color: '#94a3b8', fontWeight: 700, letterSpacing: '0.06em' }}>AL-2026-0915-IND-047</span>
                <span style={{ color: '#334155', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Status</span>
                <span style={{ color: '#34d399', fontWeight: 700 }}>✓ VALID</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Keyframe styles injected once */}
      <style>{`
        @keyframes siModalFadeIn {
          from { opacity: 0; }
          to   { opacity: 1; }
        }
        @keyframes siModalScaleIn {
          from { opacity: 0; transform: scale(0.96) translateY(10px); }
          to   { opacity: 1; transform: scale(1)    translateY(0); }
        }
      `}</style>
    </div>
  );
}

// ─── Public component — uses a React Portal ──────────────────────────────────

export const SceneInspectorModal: React.FC<SceneInspectorModalProps> = ({
  isOpen,
  onClose,
  spillId = 'AQL-047',
}) => {
  // Ensure we only render on the client (portal needs document.body)
  const [mounted, setMounted] = useState(false);
  useEffect(() => { setMounted(true); }, []);

  if (!mounted || !isOpen) return null;

  /*
   * createPortal renders the modal as a direct child of document.body.
   * This completely escapes the app's React tree, meaning no parent
   * transform / filter / isolation / z-index can clip or restrict it.
   */
  return createPortal(
    <ModalContent isOpen={isOpen} onClose={onClose} spillId={spillId} />,
    document.body,
  );
};
