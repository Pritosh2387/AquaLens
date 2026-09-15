import React from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Sparkles,
  ArrowRight,
  ShieldAlert,
  Radio,
  History,
  Ship,
  Wind,
  CheckCircle2,
  AlertTriangle,
  Boxes,
  Play,
  Zap,
  ChevronRight
} from 'lucide-react';
import { CommandButton } from '../components/ui/CommandButton';
import { ThreeOceanCanvas } from '../components/ui/ThreeOceanCanvas';
import { DualRingSonarLens } from '../components/ui/DualRingSonarLens';

export const LandingPage: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-[#020611] text-slate-100 font-mono relative overflow-x-hidden selection:bg-blue-600/40 selection:text-sky-200">
      {/* Three.js Interactive 3D Ocean Background Canvas */}
      <ThreeOceanCanvas opacity={0.45} />

      {/* Main Container */}
      <main className="relative z-10 pt-12 sm:pt-16 pb-24 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto space-y-20">
        
        {/* 1. Hero Header Section with AquaLens Brand Title */}
        <section className="text-center space-y-8 pt-4">
          
          {/* Main Brand Title & Dual-Ring Holographic Sonar Lens Side-by-Side */}
          <div className="flex flex-col items-center justify-center gap-3">
            <div className="flex items-center justify-center gap-4 sm:gap-6">
              {/* Glowing Holographic Sonar Lens Badge - ON THE SIDE OF AQUALENS */}
              <div className="w-14 h-14 sm:w-20 sm:h-20 rounded-2xl sm:rounded-3xl bg-gradient-to-br from-sky-500/20 via-blue-900/60 to-slate-950 border-2 border-sky-400/70 flex items-center justify-center text-sky-300 shadow-[0_0_45px_rgba(56,189,248,0.6)] group hover:scale-105 transition-all shrink-0 p-2 sm:p-3">
                <DualRingSonarLens size="hero" />
              </div>

              {/* AquaLens Brand Title */}
              <h1 className="text-5xl sm:text-7xl lg:text-8xl font-black tracking-[0.18em] text-transparent bg-clip-text bg-gradient-to-r from-white via-sky-200 to-blue-400 uppercase drop-shadow-[0_0_35px_rgba(56,189,248,0.75)] leading-none">
                AquaLens
              </h1>
            </div>

            <div className="flex items-center justify-center gap-2 text-sky-300 font-extrabold text-sm sm:text-base tracking-[0.3em] uppercase pt-1">
              <Sparkles className="w-4 h-4 text-sky-400 animate-pulse" />
              <span>AI FOR OCEANS</span>
              <Sparkles className="w-4 h-4 text-sky-400 animate-pulse" />
            </div>
          </div>

          {/* Subtitle Slogan */}
          <p className="text-sm sm:text-base md:text-lg text-slate-300 max-w-3xl mx-auto font-normal leading-relaxed tracking-wide">
            Predictive Maritime Emergency Intelligence Platform — Autonomous satellite slick detection, backward origin hindcasting, vessel attribution &amp; response optimization.
          </p>

          {/* Primary Action Buttons */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-2">
            <CommandButton
              variant="primary"
              size="lg"
              icon={<Play className="w-5 h-5 fill-current" />}
              onClick={() => navigate('/overview')}
              className="w-full sm:w-auto px-10 py-4 text-sm font-black uppercase tracking-widest shadow-[0_0_35px_rgba(37,99,235,0.7)] border-sky-400/70"
            >
              LAUNCH COMMAND CENTER
            </CommandButton>

            <CommandButton
              variant="outline"
              size="lg"
              icon={<Radio className="w-5 h-5 text-sky-400" />}
              onClick={() => navigate('/detection')}
              className="w-full sm:w-auto px-8 py-4 text-sm font-bold uppercase tracking-widest border-sky-400/40 hover:bg-blue-950/60"
            >
              EXPLORE LIVE INCIDENTS
            </CommandButton>
          </div>

          {/* Key Stat Cards Grid */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 max-w-4xl mx-auto pt-6">
            <div className="crystalline-panel p-4 rounded-xl border-blue-500/30 text-center space-y-1">
              <div className="text-2xl sm:text-3xl font-extrabold text-sky-300">17</div>
              <div className="text-[10px] text-slate-400 uppercase tracking-wider">Intelligence Pipeline Modules</div>
            </div>
            <div className="crystalline-panel p-4 rounded-xl border-blue-500/30 text-center space-y-1">
              <div className="text-2xl sm:text-3xl font-extrabold text-emerald-400">91%</div>
              <div className="text-[10px] text-slate-400 uppercase tracking-wider">Detection Accuracy</div>
            </div>
            <div className="crystalline-panel p-4 rounded-xl border-blue-500/30 text-center space-y-1">
              <div className="text-2xl sm:text-3xl font-extrabold text-sky-300">24 / 7</div>
              <div className="text-[10px] text-slate-400 uppercase tracking-wider">SAR + AIS Fusion</div>
            </div>
            <div className="crystalline-panel p-4 rounded-xl border-blue-500/30 text-center space-y-1">
              <div className="text-2xl sm:text-3xl font-extrabold text-amber-400">&lt; 6h</div>
              <div className="text-[10px] text-slate-400 uppercase tracking-wider">Response Deployment</div>
            </div>
          </div>
        </section>

        {/* 2. Interactive Visual Telemetry Showcase Card */}
        <section className="crystalline-panel p-6 sm:p-8 rounded-2xl border-sky-400/40 shadow-[0_0_40px_rgba(37,99,235,0.25)] space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-red-600/20 border border-red-500/40 flex items-center justify-center text-red-400 shrink-0">
                <ShieldAlert className="w-6 h-6 animate-pulse" />
              </div>
              <div>
                <h3 className="text-base font-bold text-white uppercase tracking-wider">LIVE INCIDENT MONITOR — SCENE_001</h3>
                <p className="text-xs text-slate-400">Mumbai Offshore Corridor • Real-Time Satellite &amp; AIS Fusion</p>
              </div>
            </div>

            <button
              onClick={() => navigate('/overview')}
              className="px-4 py-2 rounded-lg bg-blue-600/20 border border-sky-400/50 text-sky-300 text-xs font-bold hover:bg-blue-600/40 transition-colors flex items-center gap-2 self-start sm:self-auto cursor-pointer"
            >
              <span>INSPECT LIVE INCIDENT</span>
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          {/* Visual Showcase: High-Res Satellite Radar Image + Live Telemetry Cards */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-center">
            {/* Left 7 Columns: Real Satellite Imagery Canvas Box */}
            <div className="lg:col-span-7 rounded-xl overflow-hidden border border-sky-400/50 shadow-[0_0_25px_rgba(56,189,248,0.3)] relative group">
              <img
                src="/assets/spill_sat_view.png"
                alt="Sentinel-1 SAR Satellite Oil Spill Detection View"
                className="w-full h-72 object-cover transition-transform duration-700 group-hover:scale-105"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-[#020611] via-transparent to-transparent opacity-80" />
              
              {/* Image Overlays */}
              <div className="absolute top-3 left-3 px-2.5 py-1 rounded bg-[#030916]/90 border border-sky-400/50 text-[10px] text-sky-300 font-bold flex items-center gap-1.5 backdrop-blur-md">
                <Radio className="w-3.5 h-3.5 text-sky-400 animate-pulse" />
                <span>SENTINEL-1 C-BAND SAR PASS</span>
              </div>

              <div className="absolute bottom-3 left-3 right-3 flex justify-between items-end text-xs">
                <div>
                  <span className="text-[10px] text-slate-400 block uppercase">Coordinates</span>
                  <span className="text-white font-bold">18.97° N, 72.82° E</span>
                </div>
                <div className="px-2.5 py-1 rounded bg-emerald-950/80 border border-emerald-500/50 text-emerald-300 font-bold text-[10px]">
                  VERIFIED SLICK (12.4 km²)
                </div>
              </div>
            </div>

            {/* Right 5 Columns: Telemetry Metrics Cards */}
            <div className="lg:col-span-5 space-y-3.5 text-xs font-mono">
              <div className="p-4 rounded-xl bg-[#030916] border border-slate-800 space-y-2">
                <span className="text-[10px] text-slate-400 uppercase font-bold block">Detection Engine</span>
                <div className="text-base font-bold text-emerald-400 flex items-center gap-2">
                  <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
                  <span>CONFIRMED SLICK (12.4 km²)</span>
                </div>
                <p className="text-slate-300 text-[11px]">Sentinel-1 SAR C-band + Sentinel-2 Optical Fusion</p>
              </div>

              <div className="p-4 rounded-xl bg-[#030916] border border-slate-800 space-y-2">
                <span className="text-[10px] text-slate-400 uppercase font-bold block">Vessel Attribution</span>
                <div className="text-base font-bold text-purple-300 flex items-center gap-2">
                  <Ship className="w-5 h-5 text-purple-400 shrink-0" />
                  <span>OCEAN PRIDE (0.91 Score)</span>
                </div>
                <p className="text-slate-300 text-[11px]">AIS Gap Anomaly Detected | IMO 9234567</p>
              </div>

              <div className="p-4 rounded-xl bg-[#030916] border border-slate-800 space-y-2">
                <span className="text-[10px] text-slate-400 uppercase font-bold block">Response Directive</span>
                <div className="text-base font-bold text-amber-300 flex items-center gap-2">
                  <Zap className="w-5 h-5 text-amber-400 shrink-0" />
                  <span>DEPLOY_RESOURCES</span>
                </div>
                <p className="text-slate-300 text-[11px]">Time to Coastal Impact: <strong>18 hours</strong></p>
              </div>
            </div>
          </div>
        </section>

        {/* 3. Feature Showcase Cards Grid with 6 DISTINCT Visual Image Displays */}
        <section className="space-y-8">
          <div className="text-center space-y-2">
            <h2 className="text-2xl sm:text-4xl font-black text-white tracking-widest uppercase">
              End-to-End Maritime Intelligence
            </h2>
            <p className="text-xs sm:text-sm text-slate-400 max-w-2xl mx-auto">
              Integrated scientific pipeline transforming satellite imagery into operational action.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 items-stretch">
            {/* Feature Card 1: Satellite SAR Radar Image */}
            <div
              onClick={() => navigate('/detection')}
              className="crystalline-panel rounded-2xl border-blue-500/30 hover:border-sky-400 overflow-hidden cursor-pointer group transition-all flex flex-col h-full justify-between"
            >
              <div className="h-44 relative overflow-hidden bg-slate-900 shrink-0">
                <img
                  src="/assets/sar_spill_detect_hd.svg"
                  alt="Sentinel-1 SAR Oil Slick Detection Mask View"
                  className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-[#030916] via-transparent to-transparent opacity-90" />
                <span className="absolute top-3 left-3 px-2.5 py-0.5 rounded bg-blue-950/90 border border-sky-400/50 text-[10px] font-bold text-sky-300 backdrop-blur-md">
                  DETECTION ENGINE
                </span>
                <div className="absolute bottom-2 left-3 right-3 flex justify-between text-[10px] text-emerald-400 font-bold">
                  <span>UNet SAR Confidence: 91%</span>
                  <span>Area: 12.4 km²</span>
                </div>
              </div>

              <div className="p-5 flex flex-col flex-grow justify-between space-y-4">
                <div className="space-y-2.5">
                  <h3 className="text-base font-bold text-white group-hover:text-sky-300 transition-colors uppercase flex items-center justify-between">
                    <span>Spill Detection &amp; Segmentation</span>
                    <Radio className="w-4 h-4 text-sky-400 shrink-0" />
                  </h3>
                  <p className="text-xs text-slate-300 leading-relaxed">
                    Sentinel-1 SAR C-band backscatter UNet neural network segmentation corroborated by Sentinel-2 optical reflectance drop. Detects dark slick anomalies, computes slick thickness profiles, and calculates total surface area.
                  </p>
                </div>
                
                {/* Detailed Feature Chips */}
                <div className="mt-auto flex flex-wrap gap-1.5 pt-3 border-t border-slate-800/80 text-[10px]">
                  <span className="px-2 py-0.5 rounded bg-blue-950/80 border border-blue-800 text-sky-300 font-mono">Sentinel-1 C-Band SAR</span>
                  <span className="px-2 py-0.5 rounded bg-blue-950/80 border border-blue-800 text-sky-300 font-mono">UNet Deep Neural Net</span>
                  <span className="px-2 py-0.5 rounded bg-blue-950/80 border border-blue-800 text-sky-300 font-mono">Multi-Spectral Verification</span>
                </div>
              </div>
            </div>

            {/* Feature Card 2: Backward Lagrangian Hindcast Vector Map Image */}
            <div
              onClick={() => navigate('/hindcast')}
              className="crystalline-panel rounded-2xl border-blue-500/30 hover:border-sky-400 overflow-hidden cursor-pointer group transition-all flex flex-col h-full justify-between"
            >
              <div className="h-44 relative overflow-hidden bg-slate-900 shrink-0">
                <img
                  src="/assets/drift_forecast_map.svg"
                  alt="Lagrangian Particle Hindcast & Release Origin Map"
                  className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-[#030916] via-transparent to-transparent opacity-90" />
                <span className="absolute top-3 left-3 px-2.5 py-0.5 rounded bg-blue-950/90 border border-sky-400/50 text-[10px] font-bold text-amber-300 backdrop-blur-md">
                  HINDCAST ENGINE
                </span>
                <div className="absolute bottom-2 left-3 right-3 flex justify-between text-[10px] text-amber-300 font-bold">
                  <span>Backward Drift: -48 Hours</span>
                  <span>Origin Prob: 0.78</span>
                </div>
              </div>

              <div className="p-5 flex flex-col flex-grow justify-between space-y-4">
                <div className="space-y-2.5">
                  <h3 className="text-base font-bold text-white group-hover:text-sky-300 transition-colors uppercase flex items-center justify-between">
                    <span>Origin &amp; Backward Hindcast</span>
                    <History className="w-4 h-4 text-amber-400 shrink-0" />
                  </h3>
                  <p className="text-xs text-slate-300 leading-relaxed">
                    Lagrangian reverse particle drift model tracing release location probability contours over preceding 48 hours. Couples historical HYCOM ocean current vectors and ECMWF wind dynamics to reconstruct exact slick origination coordinates.
                  </p>
                </div>
                
                {/* Detailed Feature Chips */}
                <div className="mt-auto flex flex-wrap gap-1.5 pt-3 border-t border-slate-800/80 text-[10px]">
                  <span className="px-2 py-0.5 rounded bg-amber-950/80 border border-amber-900 text-amber-300 font-mono">Backward Lagrangian Particles</span>
                  <span className="px-2 py-0.5 rounded bg-amber-950/80 border border-amber-900 text-amber-300 font-mono">Origin Probability Heatmap</span>
                  <span className="px-2 py-0.5 rounded bg-amber-950/80 border border-amber-900 text-amber-300 font-mono">Historical HYCOM &amp; ECMWF</span>
                </div>
              </div>
            </div>

            {/* Feature Card 3: AIS Vessel Transponder Tracking Satellite Image */}
            <div
              onClick={() => navigate('/attribution')}
              className="crystalline-panel rounded-2xl border-blue-500/30 hover:border-sky-400 overflow-hidden cursor-pointer group transition-all flex flex-col h-full justify-between"
            >
              <div className="h-44 relative overflow-hidden bg-slate-900 shrink-0">
                <img
                  src="/assets/vessel_ais_track_hd.svg"
                  alt="Satellite AIS Transponder Gap Vessel Tracking Map"
                  className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-[#030916] via-transparent to-transparent opacity-90" />
                <span className="absolute top-3 left-3 px-2.5 py-0.5 rounded bg-purple-950/90 border border-purple-500/50 text-[10px] font-bold text-purple-300 backdrop-blur-md">
                  AIS ATTRIBUTION
                </span>
                <div className="absolute bottom-2 left-3 right-3 flex justify-between text-[10px] text-purple-300 font-bold">
                  <span>Target: Ocean Pride</span>
                  <span>Likelihood: 0.91</span>
                </div>
              </div>

              <div className="p-5 flex flex-col flex-grow justify-between space-y-4">
                <div className="space-y-2.5">
                  <h3 className="text-base font-bold text-white group-hover:text-sky-300 transition-colors uppercase flex items-center justify-between">
                    <span>Vessel Attribution &amp; AIS Tracking</span>
                    <Ship className="w-4 h-4 text-purple-400 shrink-0" />
                  </h3>
                  <p className="text-xs text-slate-300 leading-relaxed">
                    Satellite AIS correlation engine cross-referencing vessel transponder histories, speed anomalies, and dark-ship transponder gaps. Ranks candidate vessels by spatiotemporal proximity to discharge origin.
                  </p>
                </div>
                
                {/* Detailed Feature Chips */}
                <div className="mt-auto flex flex-wrap gap-1.5 pt-3 border-t border-slate-800/80 text-[10px]">
                  <span className="px-2 py-0.5 rounded bg-purple-950/80 border border-purple-900 text-purple-300 font-mono">Satellite AIS Correlation</span>
                  <span className="px-2 py-0.5 rounded bg-purple-950/80 border border-purple-900 text-purple-300 font-mono">Dark-Ship Transponder Gaps</span>
                  <span className="px-2 py-0.5 rounded bg-purple-950/80 border border-purple-900 text-purple-300 font-mono">Candidate Likelihood Rank</span>
                </div>
              </div>
            </div>

            {/* Feature Card 4: Forward Hydrodynamic RK4 Drift Forecast Image */}
            <div
              onClick={() => navigate('/forecast')}
              className="crystalline-panel rounded-2xl border-blue-500/30 hover:border-sky-400 overflow-hidden cursor-pointer group transition-all flex flex-col h-full justify-between"
            >
              <div className="h-44 relative overflow-hidden bg-slate-900 shrink-0">
                <img
                  src="/assets/forward_drift_map.svg"
                  alt="Forward Hydrodynamic Dispersal RK4 Vector Forecast Map"
                  className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-[#030916] via-transparent to-transparent opacity-90" />
                <span className="absolute top-3 left-3 px-2.5 py-0.5 rounded bg-blue-950/90 border border-sky-400/50 text-[10px] font-bold text-sky-300 backdrop-blur-md">
                  HYDRODYNAMIC FORECAST
                </span>
                <div className="absolute bottom-2 left-3 right-3 flex justify-between text-[10px] text-sky-300 font-bold">
                  <span>Horizon: +72 Hours</span>
                  <span>RK4 Particle Model</span>
                </div>
              </div>

              <div className="p-5 flex flex-col flex-grow justify-between space-y-4">
                <div className="space-y-2.5">
                  <h3 className="text-base font-bold text-white group-hover:text-sky-300 transition-colors uppercase flex items-center justify-between">
                    <span>Hydrodynamic Drift &amp; Weathering</span>
                    <Wind className="w-4 h-4 text-sky-400 shrink-0" />
                  </h3>
                  <p className="text-xs text-slate-300 leading-relaxed">
                    Forward Runge-Kutta 4th Order (RK4) Lagrangian particle tracking model coupled with HYCOM ocean currents, Copernicus wave vectors, and GFS wind fields. Simulates slick weathering, evaporation, and spatial dispersal across 6h, 12h, 24h, 48h, and 72h horizons.
                  </p>
                </div>
                
                {/* Detailed Feature Chips */}
                <div className="mt-auto flex flex-wrap gap-1.5 pt-3 border-t border-slate-800/80 text-[10px]">
                  <span className="px-2 py-0.5 rounded bg-blue-950/80 border border-blue-800 text-sky-300 font-mono">HYCOM 1/12° Currents</span>
                  <span className="px-2 py-0.5 rounded bg-blue-950/80 border border-blue-800 text-sky-300 font-mono">Evaporation &amp; Emulsification</span>
                  <span className="px-2 py-0.5 rounded bg-blue-950/80 border border-blue-800 text-sky-300 font-mono">72h Arrival Horizon</span>
                </div>
              </div>
            </div>

            {/* Feature Card 5: Ecological Impact & Vulnerability High-Res Sat Image */}
            <div
              onClick={() => navigate('/impact')}
              className="crystalline-panel rounded-2xl border-blue-500/30 hover:border-sky-400 overflow-hidden cursor-pointer group transition-all flex flex-col h-full justify-between"
            >
              <div className="h-44 relative overflow-hidden bg-slate-900 shrink-0">
                <img
                  src="/assets/impact_vulnerability_sat.svg"
                  alt="Multi-Spectral Satellite Infrared Shoreline Vulnerability Map"
                  className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-[#030916] via-transparent to-transparent opacity-90" />
                <span className="absolute top-3 left-3 px-2.5 py-0.5 rounded bg-red-950/90 border border-red-500/50 text-[10px] font-bold text-red-400 backdrop-blur-md">
                  IMPACT VULNERABILITY
                </span>
                <div className="absolute bottom-2 left-3 right-3 flex justify-between text-[10px] text-red-400 font-bold">
                  <span>ESI Class 10 Risk</span>
                  <span>Monte Carlo Score: 87/100</span>
                </div>
              </div>

              <div className="p-5 flex flex-col flex-grow justify-between space-y-4">
                <div className="space-y-2.5">
                  <h3 className="text-base font-bold text-white group-hover:text-sky-300 transition-colors uppercase flex items-center justify-between">
                    <span>Ecological Impact &amp; Asset Risk</span>
                    <AlertTriangle className="w-4 h-4 text-red-400 shrink-0" />
                  </h3>
                  <p className="text-xs text-slate-300 leading-relaxed">
                    Multi-criteria Environmental Sensitivity Index (ESI) framework coupled with 10,000-iteration Monte Carlo uncertainty simulations. Quantifies real-time exposure for coral reef sanctuaries, commercial fisheries, mangrove ecosystems, and coastal infrastructure.
                  </p>
                </div>
                
                {/* Detailed Feature Chips */}
                <div className="mt-auto flex flex-wrap gap-1.5 pt-3 border-t border-slate-800/80 text-[10px]">
                  <span className="px-2 py-0.5 rounded bg-red-950/80 border border-red-900 text-red-300 font-mono">Coral &amp; Mangrove Protection</span>
                  <span className="px-2 py-0.5 rounded bg-red-950/80 border border-red-900 text-red-300 font-mono">Fisheries Exposure Index</span>
                  <span className="px-2 py-0.5 rounded bg-red-950/80 border border-red-900 text-red-300 font-mono">10k Monte Carlo Iterations</span>
                </div>
              </div>
            </div>

            {/* Feature Card 6: Resource MILP High-Res Tactical Sat Image */}
            <div
              onClick={() => navigate('/resources')}
              className="crystalline-panel rounded-2xl border-blue-500/30 hover:border-sky-400 overflow-hidden cursor-pointer group transition-all flex flex-col h-full justify-between"
            >
              <div className="h-44 relative overflow-hidden bg-slate-900 shrink-0">
                <img
                  src="/assets/resource_deployment_sat.svg"
                  alt="Tactical MILP Fleet Containment & Boom Dispatch Map"
                  className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-[#030916] via-transparent to-transparent opacity-90" />
                <span className="absolute top-3 left-3 px-2.5 py-0.5 rounded bg-emerald-950/90 border border-emerald-500/50 text-[10px] font-bold text-emerald-400 backdrop-blur-md">
                  RESOURCE PLANNER
                </span>
                <div className="absolute bottom-2 left-3 right-3 flex justify-between text-[10px] text-emerald-400 font-bold">
                  <span>MILP Solver Solved</span>
                  <span>72% Containment Rate</span>
                </div>
              </div>

              <div className="p-5 flex flex-col flex-grow justify-between space-y-4">
                <div className="space-y-2.5">
                  <h3 className="text-base font-bold text-white group-hover:text-sky-300 transition-colors uppercase flex items-center justify-between">
                    <span>Resource &amp; Response Optimization</span>
                    <Boxes className="w-4 h-4 text-emerald-400 shrink-0" />
                  </h3>
                  <p className="text-xs text-slate-300 leading-relaxed">
                    Mixed-Integer Linear Programming (MILP) solver computing mathematically optimal containment directives. Calculates vessel fleet dispatch routing, skimmer oil recovery capacity (m³/h), and containment boom barrier positioning to maximize recovery efficiency.
                  </p>
                </div>
                
                {/* Detailed Feature Chips */}
                <div className="mt-auto flex flex-wrap gap-1.5 pt-3 border-t border-slate-800/80 text-[10px]">
                  <span className="px-2 py-0.5 rounded bg-emerald-950/80 border border-emerald-900 text-emerald-300 font-mono">MILP Fleet Allocation</span>
                  <span className="px-2 py-0.5 rounded bg-emerald-950/80 border border-emerald-900 text-emerald-300 font-mono">Skimmer &amp; Boom Placement</span>
                  <span className="px-2 py-0.5 rounded bg-emerald-950/80 border border-emerald-900 text-emerald-300 font-mono">What-If Scenario Simulator</span>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* 4. Bottom Call To Action Banner */}
        <section className="crystalline-panel p-8 sm:p-14 rounded-3xl border-sky-400/50 text-center space-y-6 bg-gradient-to-r from-blue-950/80 via-slate-900/90 to-indigo-950/80 shadow-[0_0_50px_rgba(37,99,235,0.35)]">
          <div className="space-y-2">
            <h2 className="text-2xl sm:text-4xl font-black text-white tracking-widest uppercase drop-shadow-[0_0_20px_rgba(56,189,248,0.7)]">
              READY TO DEPLOY MARITIME DIRECTIVES?
            </h2>
            <p className="text-xs sm:text-sm text-slate-300 max-w-xl mx-auto">
              Access live satellite telemetry, run pipeline executions, and generate actionable evidence-backed decision directives.
            </p>
          </div>

          <CommandButton
            variant="primary"
            size="lg"
            icon={<ArrowRight className="w-5 h-5" />}
            onClick={() => navigate('/overview')}
            className="px-10 py-4 text-sm font-black uppercase tracking-widest shadow-[0_0_35px_rgba(37,99,235,0.7)] border-sky-400/70"
          >
            ENTER OPERATIONAL PLATFORM
          </CommandButton>
        </section>
      </main>

      {/* Deep Sapphire & Royal Navy Blue Footer */}
      <footer className="relative z-10 border-t-2 border-blue-500/50 border-b border-blue-900/40 bg-gradient-to-r from-[#030919]/95 via-[#08183a]/95 to-[#040a1b]/95 backdrop-blur-2xl py-8 text-center text-xs text-slate-200 font-mono shadow-[0_-10px_40px_rgba(37,99,235,0.25)]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3 font-black text-blue-300 text-sm tracking-widest uppercase drop-shadow-[0_0_12px_rgba(37,99,235,0.7)]">
            <div className="w-7 h-7 rounded-lg bg-blue-600/20 border border-blue-400/50 flex items-center justify-center text-blue-300 shadow-[0_0_12px_rgba(37,99,235,0.5)] p-0.5">
              <DualRingSonarLens size="sm" />
            </div>
            <span>AquaLens — AI FOR OCEANS</span>
          </div>
          <p className="text-[11px] text-blue-200/90 font-bold tracking-wider uppercase drop-shadow-[0_0_6px_rgba(37,99,235,0.4)]">
            Predictive Maritime Emergency Intelligence Platform
          </p>
        </div>
      </footer>
    </div>
  );
};
