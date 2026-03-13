import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";

// Make sure these files actually exist in your project!
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

const API = "https://early-warning-system-fh1y.onrender.com";

/* ---------- STATIC METRICS ---------- */
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

export default function App() {
  const [activeTab, setActiveTab] = useState("dashboard");
  const [currentTime, setCurrentTime] = useState(new Date().toLocaleTimeString());
  const [alerts, setAlerts] = useState([]);
  const [isReportOpen, setIsReportOpen] = useState(false);

  /* ---------- CLOCK + BACKEND FETCH ---------- */
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date().toLocaleTimeString());
    }, 1000);

    fetch(`${API}/api/alerts`)
      .then(res => res.json())
      .then(data => {
        // Ensure data is an array before setting it
        if (Array.isArray(data)) {
          setAlerts(data);
        } else {
          setAlerts([]);
        }
      })
      .catch(err => console.error("Alert fetch error:", err));

    return () => clearInterval(timer);
  }, []);

  return (
    <div className="flex h-screen bg-[#0A0A0B] text-slate-200 font-sans overflow-hidden">
      {/* ---------- SIDEBAR ---------- */}
      <aside className="w-20 lg:w-64 border-r border-white/5 bg-[#0D0D0F] flex flex-col justify-between">
        <div>
          <div className="h-20 flex items-center justify-center lg:justify-start lg:px-6 border-b border-white/5">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center">
              <Zap className="text-white w-5 h-5" />
            </div>
            <span className="hidden lg:block ml-3 font-bold text-lg text-white">
              AquaGuard<span className="text-indigo-400">AI</span>
            </span>
          </div>

          <nav className="p-4 space-y-2">
            {[
              { id: "dashboard", icon: LayoutGrid, label: "Dashboard" },
              { id: "map", icon: MapIcon, label: "Live Map" },
              { id: "alerts", icon: AlertTriangle, label: "Alerts Center" },
              { id: "layers", icon: Layers, label: "Data Layers" }
            ].map(item => (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={`w-full flex items-center justify-center lg:justify-start lg:px-4 py-3 rounded-xl
                ${activeTab === item.id
                    ? "bg-indigo-500/10 text-indigo-400"
                    : "text-slate-500 hover:bg-white/5 hover:text-slate-300"}`}
              >
                <item.icon className="w-5 h-5" />
                <span className="hidden lg:block ml-3">{item.label}</span>
              </button>
            ))}
          </nav>
        </div>

        <div className="p-4">
          <div className="bg-[#141417] border border-white/5 rounded-2xl p-4">
            <p className="text-xs text-slate-400 uppercase">System Status</p>
            <p className="text-sm text-emerald-400 font-medium">All Sensors Online</p>
          </div>
        </div>
      </aside>

      {/* ---------- MAIN ---------- */}
      <main className="flex-1 flex flex-col">
        {/* HEADER */}
        <header className="h-20 border-b border-white/5 px-6 flex items-center justify-between">
          <div className="flex items-center gap-6">
            <h1 className="text-2xl font-semibold text-white hidden md:block">
              Risk Radar
            </h1>
            <div className="flex items-center gap-2 text-slate-400 text-sm bg-[#141417] px-4 py-2 rounded-full">
              <Clock className="w-4 h-4 text-indigo-400" />
              {currentTime}
            </div>
          </div>

          <div className="flex items-center gap-4">
            <button className="p-2 rounded-full bg-[#141417] border border-white/5 text-slate-400">
              <Bell className="w-5 h-5" />
            </button>
            <button
              onClick={() => setIsReportOpen(true)}
              className="px-4 py-2 bg-red-500/10 text-red-500 text-sm rounded-full border border-red-500/20"
            >
              Report Disaster
            </button>
            <div className="w-9 h-9 border border-white/10 rounded-full flex items-center justify-center">
              <User className="w-5 h-5 text-slate-400" />
            </div>
          </div>
        </header>

        {/* ---------- DASHBOARD ---------- */}
        <div className="flex-1 overflow-y-auto p-6">
          {/* METRICS */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {metrics.map(m => (
              <div
                key={m.id}
                className={`bg-[#0F0F12] border ${m.border} rounded-3xl p-6`}
              >
                <div className="flex justify-between mb-4">
                  <div className={`w-12 h-12 rounded-xl ${m.bg} flex items-center justify-center`}>
                    <m.icon className={`w-6 h-6 ${m.color}`} />
                  </div>
                  <div className="text-xs text-emerald-400">
                    {m.trend}
                  </div>
                </div>
                <p className="text-sm text-slate-500">{m.label}</p>
                <div className="flex items-baseline gap-1">
                  <h2 className="text-4xl text-white">{m.value}</h2>
                  <span className="text-slate-400">{m.unit}</span>
                </div>
              </div>
            ))}
          </div>

          {/* ALERTS */}
          <div className="mt-10 space-y-4">
            <h3 className="text-lg font-semibold text-white">Live Alerts</h3>
            {alerts.length > 0 ? (
              alerts.map((alert, index) => (
                <div
                  key={alert.id || index}
                  className="p-4 rounded-2xl border border-white/10 bg-[#141417]"
                >
                  <p className="text-sm text-slate-300">{alert.msg || alert.message || "Alert recorded"}</p>
                  <span className="text-xs text-slate-500">
                    {alert.time || new Date(alert.timestamp).toLocaleTimeString() || "Just now"}
                  </span>
                </div>
              ))
            ) : (
              <p className="text-slate-500 text-sm">No active alerts at this time.</p>
            )}
          </div>
        </div>
      </main>

      {/* AI CHAT + REPORT MODAL */}
      <AIChatAssistant />
      <CommunityReportModal
        isOpen={isReportOpen}
        onClose={() => setIsReportOpen(false)}
      />
    </div>
  );
}