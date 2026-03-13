import React, { useState, useEffect } from "react";
import { io } from "socket.io-client";
import { Activity, AlertTriangle, Bell, CloudRain, Droplets, Layers, LayoutGrid, Map as MapIcon, Search, Waves, Zap, TrendingUp, TrendingDown, ShieldCheck, Radio, Clock, ChevronRight, User } from "lucide-react";

import DisasterMap from "./components/DisasterMap";
import RiskTimelineChart from "./components/RiskTimelineChart";
import AIChatAssistant from "./components/AIChatAssistant";
import CommunityReportModal from "./components/CommunityReportModal";

const API = "http://localhost:10000"; // Use localhost for dev, or render URL

export default function App() {
  const [activeTab, setActiveTab] = useState("dashboard");
  const [currentTime, setCurrentTime] = useState(new Date().toLocaleTimeString());
  const [alerts, setAlerts] = useState<any[]>([]);
  const [isReportOpen, setIsReportOpen] = useState(false);

  // Realtime Data State
  const [sensorData, setSensorData] = useState<Record<string, any>>({});
  const [riskData, setRiskData] = useState<Record<string, any>>({});
  const [timelineData, setTimelineData] = useState<any[]>([]);

  // Socket Connection
  useEffect(() => {
    const socket = io(API);

    socket.on('connection_established', (data) => console.log(data.message));

    socket.on('sensorUpdate', (payload) => {
      setSensorData(prev => ({
        ...prev,
        [payload.location_id]: payload.data
      }));
    });

    socket.on('riskUpdate', (payload) => {
      setRiskData(prev => ({
        ...prev,
        [payload.location_id]: payload.prediction
      }));

      // Build timeline history
      setTimelineData(prev => {
        const timeStr = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        const latest = {
          time: timeStr,
          flood: payload.prediction.flood_probability * 100,
          landslide: payload.prediction.landslide_probability * 100,
          surge: payload.prediction.storm_surge_probability * 100
        };
        const updated = [...prev, latest];
        return updated.length > 20 ? updated.slice(updated.length - 20) : updated;
      });
    });

    socket.on('new_alert', (payload) => {
      setAlerts(prev => [payload, ...prev].slice(0, 10)); // keep last 10
    });

    return () => {
      socket.disconnect();
    };
  }, []);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date().toLocaleTimeString());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // Compute aggregate metrics from latest sensor readings
  const calcAvg = (key: string, defaultVal: string) => {
    const keys = Object.keys(sensorData);
    if (keys.length === 0) return defaultVal;
    const sum = keys.reduce((acc, k) => acc + Number(sensorData[k][key]), 0);
    return (sum / keys.length).toFixed(1);
  };

  const metrics = [
    {
      id: "precip", label: "Avg Rainfall",
      value: calcAvg("rainfall", "0.0"), unit: "mm/h", trend: "--",
      icon: CloudRain, color: "text-blue-400", bg: "bg-blue-500/10", border: "border-blue-500/20"
    },
    {
      id: "level", label: "Avg River Level",
      value: calcAvg("river_level", "0.0"), unit: "m", trend: "--",
      icon: Waves, color: "text-amber-400", bg: "bg-amber-500/10", border: "border-amber-500/20", alert: true
    },
    {
      id: "soil", label: "Avg Soil Moisture",
      value: calcAvg("soil_moisture", "0.0"), unit: "%", trend: "--",
      icon: Droplets, color: "text-emerald-400", bg: "bg-emerald-500/10", border: "border-emerald-500/20"
    },
    {
      id: "flow", label: "Avg Wind Speed",
      value: calcAvg("wind_speed", "0.0"), unit: "km/h", trend: "--",
      icon: Activity, color: "text-indigo-400", bg: "bg-indigo-500/10", border: "border-indigo-500/20"
    }
  ];

  return (
    <div className="flex h-screen bg-[#0A0A0B] text-slate-200 font-sans overflow-hidden">
      {/* ---------- SIDEBAR ---------- */}
      <aside className="w-20 lg:w-64 border-r border-white/5 bg-[#0D0D0F] flex flex-col justify-between">
        <div>
          <div className="h-20 flex items-center justify-center lg:justify-start lg:px-6 border-b border-white/5">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shadow-lg shadow-indigo-500/20">
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
            ].map(item => (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={`w-full flex items-center justify-center lg:justify-start lg:px-4 py-3 rounded-xl transition-all duration-300
                ${activeTab === item.id
                    ? "bg-indigo-500/10 text-indigo-400 font-medium"
                    : "text-slate-500 hover:bg-white/5 hover:text-slate-300"}`}
              >
                <item.icon className="w-5 h-5" />
                <span className="hidden lg:block ml-3">{item.label}</span>
              </button>
            ))}
          </nav>
        </div>
      </aside>

      {/* ---------- MAIN ---------- */}
      <main className="flex-1 flex flex-col overflow-hidden relative">
        {/* HEADER */}
        <header className="h-20 border-b border-white/5 px-6 flex items-center justify-between z-10 bg-[#0A0A0B]/80 backdrop-blur-md">
          <div className="flex items-center gap-6">
            <h1 className="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-white to-slate-400 hidden md:block capitalize">
              {activeTab.replace('-', ' ')}
            </h1>
            <div className="flex items-center gap-2 text-slate-400 text-sm bg-white/5 border border-white/5 px-4 py-2 rounded-full shadow-inner">
              <Clock className="w-4 h-4 text-indigo-400" />
              {currentTime}
            </div>
          </div>

          <div className="flex items-center gap-4">
            <button className="relative p-2 rounded-full bg-white/5 border border-white/5 hover:bg-white/10 transition-colors">
              <Bell className="w-5 h-5 text-slate-300" />
              {alerts.length > 0 && (
                <span className="absolute top-0 right-0 w-2 h-2 bg-red-500 rounded-full animate-ping"></span>
              )}
            </button>
            <button
              onClick={() => setIsReportOpen(true)}
              className="px-5 py-2 bg-red-500/10 text-red-500 text-sm rounded-full border border-red-500/20 font-medium hover:bg-red-500/20 hover:scale-105 transition-all"
            >
              Report Disaster
            </button>
          </div>
        </header>

        {/* ---------- CONTENT ---------- */}
        <div className="flex-1 overflow-y-auto p-6 relative">

          {activeTab === 'dashboard' && (
            <div className="space-y-6">
              {/* METRICS */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                {metrics.map(m => (
                  <div
                    key={m.id}
                    className={`bg-white/5 border ${m.border} rounded-3xl p-6 backdrop-blur-sm shadow-xl hover:-translate-y-1 transition-transform cursor-default relative overflow-hidden`}
                  >
                    <div className="absolute top-0 right-0 w-32 h-32 bg-white/[0.02] rounded-full blur-2xl -mr-10 -mt-10" />
                    <div className="flex justify-between mb-4">
                      <div className={`w-12 h-12 rounded-xl ${m.bg} flex items-center justify-center border border-white/5`}>
                        <m.icon className={`w-6 h-6 ${m.color}`} />
                      </div>
                    </div>
                    <p className="text-sm text-slate-400 font-medium uppercase tracking-wider">{m.label}</p>
                    <div className="flex items-baseline gap-1 mt-2">
                      <h2 className="text-4xl font-bold text-white">{m.value}</h2>
                      <span className="text-slate-500 font-medium">{m.unit}</span>
                    </div>
                  </div>
                ))}
              </div>

              {/* CHARTS & ALERTS */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2 bg-white/5 border border-white/5 rounded-3xl p-6 shadow-xl backdrop-blur-sm">
                  <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                    <TrendingUp className="w-5 h-5 text-indigo-400" /> AI Risk Forecast Trends
                  </h3>
                  <RiskTimelineChart data={timelineData} />
                </div>
                <div className="bg-white/5 border border-white/5 rounded-3xl p-6 shadow-xl backdrop-blur-sm flex flex-col">
                  <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                    <Radio className="w-5 h-5 text-red-400" /> Live Alert Stream
                  </h3>
                  <div className="flex-1 overflow-y-auto space-y-3 pr-2">
                    {alerts.length > 0 ? (
                      alerts.map((alert, index) => (
                        <div
                          key={alert.id || index}
                          className="p-4 rounded-2xl border border-red-500/20 bg-red-500/5 shadow-inner"
                        >
                          <div className="flex items-center justify-between mb-1">
                            <span className="text-xs font-bold text-red-400 uppercase tracking-widest">{alert.severity}</span>
                            <span className="text-xs text-slate-500">{new Date(alert.timestamp).toLocaleTimeString()}</span>
                          </div>
                          <p className="text-sm text-slate-200">{alert.message}</p>
                        </div>
                      ))
                    ) : (
                      <div className="h-full flex flex-col items-center justify-center text-slate-500">
                        <ShieldCheck className="w-12 h-12 text-emerald-500/20 mb-3" />
                        <p className="text-sm font-medium">All clear. No active alerts.</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'map' && (
            <div className="absolute inset-0 m-6 rounded-3xl overflow-hidden border border-white/10 shadow-2xl">
              {/* Overlay actual map component. Pass down sensors and risks */}
              <DisasterMap sensors={sensorData} risks={riskData} />
            </div>
          )}

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