import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import DisasterMap from "./components/DisasterMap";
import RiskTimelineChart from "./components/RiskTimelineChart";
import AIChatAssistant from "./components/AIChatAssistant";
import CommunityReportModal from "./components/CommunityReportModal";
import {
  Activity,
  AlertTriangle,
  Bell,
  CloudRain,
  Droplets,
  Layers,
  LayoutGrid,
  Map as MapIcon,
  Search,
  Settings,
  Waves,
  Zap,
  TrendingUp,
  TrendingDown,
  ShieldCheck,
  Radio,
  Clock,
  ChevronRight,
  User
} from "lucide-react";

// --- DUMMY DATA ---
const metrics = [
  {
    id: "precip",
    label: "Precipitation",
    value: "14.2",
    unit: "mm/h",
    trend: "+2.4%",
    isUp: true,
    icon: CloudRain,
    color: "text-blue-400",
    bg: "bg-blue-500/10",
    border: "border-blue-500/20"
  },
  {
    id: "level",
    label: "River Level",
    value: "4.8",
    unit: "m",
    trend: "+0.3m",
    isUp: true,
    icon: Waves,
    color: "text-amber-400",
    bg: "bg-amber-500/10",
    border: "border-amber-500/20",
    alert: true
  },
  {
    id: "soil",
    label: "Soil Moisture",
    value: "86",
    unit: "%",
    trend: "+5%",
    isUp: true,
    icon: Droplets,
    color: "text-emerald-400",
    bg: "bg-emerald-500/10",
    border: "border-emerald-500/20"
  },
  {
    id: "flow",
    label: "Flow Rate",
    value: "3,240",
    unit: "m³/s",
    trend: "-120",
    isUp: false,
    icon: Activity,
    color: "text-indigo-400",
    bg: "bg-indigo-500/10",
    border: "border-indigo-500/20"
  }
];

const alerts = [
  { id: 1, type: "critical", msg: "Water level exceeding safe threshold at Sensor Alpha (Sector 4).", time: "2 mins ago" },
  { id: 2, type: "warning", msg: "Heavy rainfall predicted in the northern catchment basin.", time: "15 mins ago" },
  { id: 3, type: "info", msg: "Routine calibration completed on sensor network Beta.", time: "1 hr ago" },
  { id: 4, type: "warning", msg: "Soil saturation reached 90% in Valley region.", time: "2 hrs ago" },
];

export default function App() {
  const [activeTab, setActiveTab] = useState("dashboard");
  const [currentTime, setCurrentTime] = useState(new Date().toLocaleTimeString());
  const [isReportOpen, setIsReportOpen] = useState(false);

  // Simulated real-time clock
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date().toLocaleTimeString()), 1000);
    return () => clearInterval(timer);
  }, []);

  return (
    <div className="flex h-screen bg-[#0A0A0B] text-slate-200 font-sans overflow-hidden selection:bg-indigo-500/30">

      {/* SIDEBAR */}
      <aside className="w-20 lg:w-64 border-r border-white/5 bg-[#0D0D0F] flex flex-col justify-between shrink-0 relative z-20">
        <div>
          <div className="h-20 flex items-center justify-center lg:justify-start lg:px-6 border-b border-white/5">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shadow-[0_0_20px_rgba(99,102,241,0.3)]">
              <Zap className="text-white w-5 h-5" />
            </div>
            <span className="hidden lg:block ml-3 font-bold text-lg tracking-wide text-white">AquaGuard<span className="text-indigo-400">AI</span></span>
          </div>

          <nav className="p-4 space-y-2">
            {[
              { id: "dashboard", icon: LayoutGrid, label: "Dashboard" },
              { id: "map", icon: MapIcon, label: "Live Map" },
              { id: "alerts", icon: AlertTriangle, label: "Alerts Center" },
              { id: "layers", icon: Layers, label: "Data Layers" },
            ].map((item) => (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={`w-full flex items-center justify-center lg:justify-start lg:px-4 py-3 rounded-xl transition-all duration-300 group
                  ${activeTab === item.id
                    ? "bg-indigo-500/10 text-indigo-400 shadow-[inset_2px_0_0_#818CF8]"
                    : "text-slate-500 hover:bg-white/5 hover:text-slate-300"}`}
              >
                <item.icon className="w-5 h-5 shrink-0" />
                <span className="hidden lg:block ml-3 font-medium">{item.label}</span>
              </button>
            ))}
          </nav>
        </div>

        <div className="p-4">
          <div className="bg-[#141417] border border-white/5 rounded-2xl p-4 flex flex-col items-center lg:items-start relative overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-emerald-500 to-emerald-400" />
            <div className="flex items-center gap-3 w-full">
              <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse hidden lg:block" />
              <ShieldCheck className="w-5 h-5 text-emerald-400 lg:hidden" />
              <div className="hidden lg:block">
                <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">System Status</p>
                <p className="text-sm text-emerald-400 font-medium">All Sensors Online</p>
              </div>
            </div>
          </div>
        </div>
      </aside>

      {/* MAIN CONTENT */}
      <main className="flex-1 flex flex-col h-screen overflow-hidden relative">
        {/* Background glow effect */}
        <div className="absolute top-[-20%] right-[-10%] w-[50%] h-[50%] bg-indigo-500/10 blur-[120px] rounded-full pointer-events-none z-0" />

        {/* HEADER */}
        <header className="h-20 border-b border-white/5 px-6 lg:px-10 flex items-center justify-between shrink-0 relative z-10 backdrop-blur-md bg-[#0A0A0B]/80 hover:bg-[#0A0A0B] transition-colors duration-500">
          <div className="flex items-center gap-6">
            <h1 className="text-2xl font-semibold text-white tracking-tight hidden md:block">
              {activeTab === 'dashboard' && 'Risk Radar'}
              {activeTab === 'map' && 'Territory Mapping'}
              {activeTab === 'alerts' && 'Critical Alerts'}
              {activeTab === 'layers' && 'Sensor Infrastructure'}
            </h1>

            <div className="flex items-center gap-2 text-slate-400 text-sm font-medium bg-[#141417] px-4 py-2 rounded-full border border-white/5">
              <Clock className="w-4 h-4 text-indigo-400" />
              <span className="tabular-nums tracking-wider">{currentTime}</span>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <div className="relative group hidden sm:block">
              <Search className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2 group-focus-within:text-indigo-400 transition-colors" />
              <input
                type="text"
                placeholder="Search coordinates or sensors..."
                className="bg-[#141417] border border-white/5 rounded-full pl-10 pr-4 py-2 text-sm focus:outline-none focus:border-indigo-500/50 focus:ring-1 focus:ring-indigo-500/50 w-64 transition-all"
              />
            </div>

            <button className="relative p-2 rounded-full bg-[#141417] border border-white/5 text-slate-400 hover:text-white transition-colors">
              <Bell className="w-5 h-5" />
              <span className="absolute top-0.5 right-0.5 w-2 h-2 bg-red-500 rounded-full shadow-[0_0_8px_rgba(239,68,68,0.8)]" />
            </button>

            <button
              onClick={() => setIsReportOpen(true)}
              className="px-4 py-2 bg-red-500/10 text-red-500 font-bold text-sm tracking-wide rounded-full border border-red-500/20 hover:bg-red-500 hover:text-white transition-all flex items-center gap-2"
            >
              <AlertTriangle className="w-4 h-4" />
              <span className="hidden sm:inline">Report Disaster</span>
            </button>

            <div className="w-9 h-9 border border-white/10 rounded-full bg-gradient-to-tr from-slate-800 to-slate-700 ml-2 shadow-[0_0_10px_rgba(255,255,255,0.1)] flex items-center justify-center">
              <User className="w-5 h-5 text-slate-400" />
            </div>
          </div>
        </header>

        {/* DASHBOARD CONTENT */}
        <div className="flex-1 overflow-y-auto p-6 lg:p-10 relative z-10 custom-scrollbar">
          <AnimatePresence mode="wait">
            {activeTab === "dashboard" && (
              <motion.div
                key="dashboard"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.4, ease: "easeOut" }}
                className="max-w-[1600px] mx-auto space-y-6"
              >

                {/* METRICS GRID */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                  {metrics.map((m, i) => (
                    <motion.div
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: i * 0.1, duration: 0.5 }}
                      key={m.id}
                      className={`relative bg-[#0F0F12] border ${m.border} rounded-3xl p-6 overflow-hidden group hover:border-white/10 transition-colors`}
                    >
                      {/* Glow effect for cards with alerts */}
                      {m.alert && <div className="absolute inset-0 bg-amber-500/5 animate-pulse rounded-3xl" />}

                      <div className="relative z-10 flex justify-between items-start mb-4">
                        <div className={`w-12 h-12 rounded-2xl ${m.bg} flex items-center justify-center`}>
                          <m.icon className={`w-6 h-6 ${m.color}`} />
                        </div>
                        <div className={`flex items-center gap-1 text-xs font-bold px-2 py-1 rounded-full ${m.isUp ? (m.alert ? 'bg-amber-500/10 text-amber-500' : 'bg-emerald-500/10 text-emerald-500') : 'bg-indigo-500/10 text-indigo-400'}`}>
                          {m.isUp ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                          {m.trend}
                        </div>
                      </div>

                      <div className="relative z-10">
                        <p className="text-sm font-medium text-slate-500 mb-1">{m.label}</p>
                        <div className="flex items-baseline gap-1">
                          <h2 className="text-4xl font-semibold text-white tracking-tight">{m.value}</h2>
                          <span className="text-slate-400 font-medium">{m.unit}</span>
                        </div>
                      </div>

                      {/* Sparkline decoration */}
                      <svg className="absolute bottom-0 left-0 w-full h-16 opacity-30 group-hover:opacity-60 transition-opacity" preserveAspectRatio="none" viewBox="0 0 100 20">
                        <path d={`M0,20 Q${20 + i * 10},${10 - i * 2} ${50},${15 - i} T100,${5 + i}`} fill="none" stroke="currentColor" strokeWidth="2" className={m.color} />
                      </svg>
                    </motion.div>
                  ))}
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  {/* MAP / MODEL VISUALIZATION PLACEHOLDER */}
                  <motion.div
                    initial={{ opacity: 0, scale: 0.98 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.4, duration: 0.6 }}
                    className="lg:col-span-2 bg-[#0F0F12] border border-white/5 rounded-3xl overflow-hidden flex flex-col relative min-h-[450px]"
                  >
                    <div className="p-6 border-b border-white/5 flex justify-between items-center relative z-20 backdrop-blur-sm bg-[#0F0F12]/80">
                      <div>
                        <h3 className="text-lg font-semibold text-white">Live Terrain Mapping</h3>
                        <p className="text-sm text-slate-500">Radar & Satellite feeds synced</p>
                      </div>
                      <div className="flex gap-2">
                        <button className="px-3 py-1.5 bg-[#1A1A1E] text-slate-300 text-xs font-medium border border-white/10 rounded-lg hover:bg-white/5">Sat</button>
                        <button className="px-3 py-1.5 bg-indigo-500 text-white text-xs font-medium rounded-lg shadow-[0_0_15px_rgba(99,102,241,0.4)]">Topo</button>
                      </div>
                    </div>

                    <div className="flex-1 relative bg-[#08080A]">
                      <DisasterMap />
                    </div>
                  </motion.div>

                  {/* ALERTS FEED */}
                  <motion.div
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.5, duration: 0.5 }}
                    className="bg-[#0F0F12] border border-white/5 rounded-3xl p-6 flex flex-col h-[450px]"
                  >
                    <div className="border-b border-white/10 pb-4 mb-4">
                      <div className="flex justify-between items-center mb-4">
                        <h3 className="text-lg font-semibold text-white flex items-center gap-2">
                          <Activity className="w-5 h-5 text-indigo-400" />
                          24h Risk Forecast
                        </h3>
                      </div>
                      <RiskTimelineChart />
                    </div>

                    <div className="flex justify-between items-center mb-4">
                      <h3 className="text-lg font-semibold text-white flex items-center gap-2">
                        <Radio className="w-5 h-5 text-indigo-400" />
                        Live Feed
                      </h3>
                      <button className="text-xs text-indigo-400 hover:text-indigo-300 font-medium">View All</button>
                    </div>

                    <div className="flex-1 overflow-y-auto pr-2 space-y-4 custom-scrollbar">
                      {alerts.map((alert, i) => (
                        <div key={alert.id} className="group relative pl-4 pb-4 border-l border-white/10 last:border-transparent last:pb-0">
                          {/* Timeline dot */}
                          <div className={`absolute top-0 -left-[5px] w-[9px] h-[9px] rounded-full border-2 border-[#0F0F12] flex items-center justify-center
                            ${alert.type === 'critical' ? 'bg-red-500' : alert.type === 'warning' ? 'bg-amber-500' : 'bg-emerald-500'}`}
                          >
                            {alert.type === 'critical' && <div className="w-full h-full bg-red-500 rounded-full animate-ping" />}
                          </div>

                          <div className={`p-4 rounded-2xl border transition-all duration-300
                            ${alert.type === 'critical' ? 'bg-red-500/5 border-red-500/20 hover:border-red-500/40' :
                              alert.type === 'warning' ? 'bg-amber-500/5 border-amber-500/20 hover:border-amber-500/40' :
                                'bg-[#141417] border-white/5 hover:border-white/10'}
                          `}>
                            <div className="flex justify-between items-start mb-2">
                              <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md
                                ${alert.type === 'critical' ? 'bg-red-500/20 text-red-400' :
                                  alert.type === 'warning' ? 'bg-amber-500/20 text-amber-400' :
                                    'bg-emerald-500/10 text-emerald-400'}
                              `}>
                                {alert.type}
                              </span>
                              <span className="text-xs text-slate-500 font-mono">{alert.time}</span>
                            </div>
                            <p className="text-sm text-slate-300 leading-relaxed font-medium">
                              {alert.msg}
                            </p>
                            <button className="mt-3 text-xs flex items-center gap-1 text-slate-500 hover:text-slate-300 transition-colors">
                              Investigate <ChevronRight className="w-3 h-3" />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </motion.div>
                </div>
              </motion.div>
            )}

            {/* Empty States for other tabs */}
            {activeTab !== "dashboard" && (
              <motion.div
                key="other"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="h-full flex items-center justify-center"
              >
                <div className="text-center">
                  <div className="w-20 h-20 bg-indigo-500/10 rounded-3xl border border-indigo-500/20 flex items-center justify-center mx-auto mb-6">
                    <Radio className="w-8 h-8 text-indigo-400" />
                  </div>
                  <h2 className="text-2xl font-bold text-white mb-2 capitalize">{activeTab} Module</h2>
                  <p className="text-slate-400">This module is currently initializing telemetry connections...</p>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </main>

      {/* OVERLAYS */}
      <AIChatAssistant />
      <CommunityReportModal isOpen={isReportOpen} onClose={() => setIsReportOpen(false)} />

      <style dangerouslySetInnerHTML={{
        __html: `
        .custom-scrollbar::-webkit-scrollbar { width: 4px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background-color: rgba(255, 255, 255, 0.1); border-radius: 20px; }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover { background-color: rgba(99, 102, 241, 0.5); }
      `}} />
    </div>
  );
}