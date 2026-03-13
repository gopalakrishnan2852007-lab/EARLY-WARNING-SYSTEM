import React, { useState, useEffect, useRef } from "react";
import { io } from "socket.io-client";
import { Activity, AlertTriangle, Bell, CloudRain, Droplets, Layers, LayoutGrid, Map as MapIcon, Search, Waves, Zap, TrendingUp, TrendingDown, ShieldCheck, Radio, Clock, ChevronRight, User } from "lucide-react";

import DisasterMap from "./components/DisasterMap";
import RiskTimelineChart from "./components/RiskTimelineChart";
import AIChatAssistant from "./components/AIChatAssistant";
import CommunityReportModal from "./components/CommunityReportModal";
import NewsTicker from "./components/NewsTicker";

const API = "https://early-warning-system-fh1y.onrender.com"; // Production Render backend

export default function App() {
  const [activeTab, setActiveTab] = useState("dashboard");
  const [currentTime, setCurrentTime] = useState(new Date().toLocaleTimeString());
  const [alerts, setAlerts] = useState<any[]>([]);
  const [isReportOpen, setIsReportOpen] = useState(false);

  // Realtime Data State
  const [sensorData, setSensorData] = useState<Record<string, any>>({});
  const [riskData, setRiskData] = useState<Record<string, any>>({});
  const [timelineData, setTimelineData] = useState<any[]>([]);

  // Simulation State
  const [simRainfall, setSimRainfall] = useState(120);
  const [simRiverLevel, setSimRiverLevel] = useState(2.5);
  const [simSoilMoisture, setSimSoilMoisture] = useState(85);
  const [simWindSpeed, setSimWindSpeed] = useState(85);
  const [simResult, setSimResult] = useState<any>(null);
  const [isSimulating, setIsSimulating] = useState(false);

  const runSimulation = async () => {
    setIsSimulating(true);
    try {
      const res = await fetch(`${API}/api/simulate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          rainfall: simRainfall,
          river_level: simRiverLevel,
          soil_moisture: simSoilMoisture,
          wind_speed: simWindSpeed
        })
      });
      const data = await res.json();
      setSimResult(data);
    } catch (err) {
      console.error(err);
    } finally {
      setIsSimulating(false);
    }
  };

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
      setAlerts(prev => [payload, ...prev].slice(0, 50)); // keep last 50 for ticker
    });

    return () => {
      socket.disconnect();
    };
  }, []);

  const previousAlertCount = useRef(0);

  // AI Voice Announcer & Pulse Alarm
  useEffect(() => {
    if (alerts.length > previousAlertCount.current && alerts.length > 0) {
      const latestAlert = alerts[0];
      
      // Play Sound
      try {
        const audio = new Audio('https://assets.mixkit.co/active_storage/sfx/2869/2869-preview.mp3'); // futuristic beep
        audio.volume = 0.5;
        audio.play().catch(e => console.log('Audio Autoplay blocked by browser. User must interact first.'));
      } catch (e) {}
      
      // Voice Announce
      if(latestAlert.severity === 'CRITICAL' || latestAlert.severity === 'WARNING') {
          if ('speechSynthesis' in window) {
              const utterance = new SpeechSynthesisUtterance(`AI System Warning: ${latestAlert.severity} threat detected. ${latestAlert.message.split('.')[0]}`);
              utterance.pitch = 0.9;
              utterance.rate = 1.05;
              utterance.volume = 0.8;
              window.speechSynthesis.speak(utterance);
          }
      }
    }
    previousAlertCount.current = alerts.length;
  }, [alerts]);

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
    <div className="flex min-h-screen bg-[#0A0A0B] text-slate-200 font-sans overflow-y-auto">
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
              { id: "simulation", icon: Layers, label: "Predictive Simulation" },
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
        <header className="h-20 border-b border-white/5 px-6 flex items-center justify-between z-10 bg-[#0A0A0B]/80 backdrop-blur-md shrink-0">
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
            <button className="relative p-2 rounded-full bg-white/5 border border-white/5 hover:bg-white/10 transition-colors" onClick={() => setActiveTab('alerts')}>
              <Bell className="w-5 h-5 text-slate-300" />
              {alerts.length > 0 && (
                <span className="absolute top-0 right-0 w-2 h-2 bg-red-500 rounded-full animate-ping"></span>
              )}
            </button>
            <button
              onClick={() => setIsReportOpen(true)}
              className="px-5 py-2 bg-red-500 text-white text-sm rounded-full font-bold hover:bg-red-600 shadow-[0_0_15px_rgba(239,68,68,0.5)] hover:shadow-[0_0_25px_rgba(239,68,68,0.8)] hover:scale-105 transition-all"
            >
              Emergency Report
            </button>
          </div>
        </header>
        
        {/* LIVE TICKER */}
        <NewsTicker alerts={alerts} />

        {/* ---------- CONTENT ---------- */}
        <div className="flex-1 overflow-y-auto p-4 md:p-6 relative">

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
                <div className="bg-white/5 border border-white/5 rounded-3xl p-6 shadow-xl backdrop-blur-sm flex flex-col h-[400px]">
                  <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2 shrink-0">
                    <Radio className="w-5 h-5 text-red-400" /> Live Alert Stream
                  </h3>
                  <div className="flex-1 overflow-y-auto space-y-3 pr-2 custom-scrollbar">
                    {alerts.length > 0 ? (
                      alerts.map((alert, index) => (
                        <div
                          key={alert.id || index}
                          className="p-4 rounded-2xl border border-red-500/20 bg-red-500/5 shadow-inner shrink-0"
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
            <div className="absolute inset-0 m-6 rounded-3xl overflow-hidden border-2 border-indigo-500/30 shadow-[0_0_30px_rgba(79,70,229,0.2)] bg-[#0A0A0B]">
              <div className="radar-overlay-container">
                <div className="radar-sweep"></div>
                <div className="map-scanlines"></div>
              </div>
              <DisasterMap sensors={sensorData} risks={riskData} />
            </div>
          )}

          {activeTab === 'alerts' && (
            <div className="h-full bg-white/5 border border-white/5 rounded-3xl p-6 shadow-xl backdrop-blur-sm flex flex-col">
              <div className="flex items-center justify-between mb-6 border-b border-white/10 pb-4 shrink-0">
                <h2 className="text-xl font-bold flex items-center gap-3">
                  <AlertTriangle className="w-6 h-6 text-red-400" />
                  Global Alert Console
                </h2>
                <div className="text-sm text-slate-400">Total Active: {alerts.length}</div>
              </div>

              <div className="flex-1 overflow-y-auto space-y-4 custom-scrollbar pr-2">
                {alerts.length > 0 ? (
                  alerts.map((alert, index) => (
                    <div
                      key={alert.id || index}
                      className={`p-5 rounded-2xl border flex flex-col md:flex-row md:items-center gap-4 ${alert.severity === 'CRITICAL' ? 'bg-red-500/10 border-red-500/30' :
                        alert.severity === 'WARNING' ? 'bg-orange-500/10 border-orange-500/30' :
                          'bg-blue-500/10 border-blue-500/30'
                        }`}
                    >
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <span className={`px-2 py-1 rounded text-xs font-bold uppercase ${alert.severity === 'CRITICAL' ? 'bg-red-500/20 text-red-400' :
                            alert.severity === 'WARNING' ? 'bg-orange-500/20 text-orange-400' :
                              'bg-blue-500/20 text-blue-400'
                            }`}>
                            {alert.severity}
                          </span>
                          <span className="text-sm text-slate-400 flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            {new Date(alert.timestamp).toLocaleString()}
                          </span>
                        </div>
                        <p className="text-slate-200 text-lg">{alert.message}</p>
                      </div>
                      <button className="px-4 py-2 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl text-sm transition-colors shrink-0">
                        Acknowledge
                      </button>
                    </div>
                  ))
                ) : (
                  <div className="flex flex-col items-center justify-center h-full text-slate-500 py-12">
                    <ShieldCheck className="w-20 h-20 text-emerald-500/20 mb-4" />
                    <p className="text-lg font-medium">All systems normal. No active alerts across the network.</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {activeTab === 'simulation' && (
            <div className="h-full bg-white/5 border border-white/5 rounded-3xl p-6 shadow-xl backdrop-blur-sm overflow-y-auto custom-scrollbar">
              <h2 className="text-xl font-bold flex items-center gap-3 mb-6">
                <Layers className="w-6 h-6 text-indigo-400" />
                AI Threat Simulation Engine
              </h2>
              <div className="grid md:grid-cols-2 gap-8">
                <div className="space-y-6">
                  <p className="text-slate-400 text-sm">
                    Adjust environmental parameters below to model potential disaster scenarios. The AI Engine will calculate risk probabilities in real-time.
                  </p>

                  <div className="space-y-4 bg-white/5 p-5 rounded-2xl border border-white/5">
                    <div>
                      <label className="flex justify-between text-sm mb-2">
                        <span className="text-slate-300">Rainfall Intensity</span>
                        <span className="text-indigo-400 font-bold">{simRainfall} mm/h</span>
                      </label>
                      <input type="range" className="w-full accent-indigo-500" min="0" max="300" value={simRainfall} onChange={(e) => setSimRainfall(Number(e.target.value))} />
                    </div>
                    <div>
                      <label className="flex justify-between text-sm mb-2">
                        <span className="text-slate-300">River Level Offset</span>
                        <span className="text-blue-400 font-bold">+{simRiverLevel} m</span>
                      </label>
                      <input type="range" className="w-full accent-blue-500" min="0" max="10" step="0.1" value={simRiverLevel} onChange={(e) => setSimRiverLevel(Number(e.target.value))} />
                    </div>
                    <div>
                      <label className="flex justify-between text-sm mb-2">
                        <span className="text-slate-300">Soil Moisture Saturation</span>
                        <span className="text-emerald-400 font-bold">{simSoilMoisture}%</span>
                      </label>
                      <input type="range" className="w-full accent-emerald-500" min="0" max="100" value={simSoilMoisture} onChange={(e) => setSimSoilMoisture(Number(e.target.value))} />
                    </div>
                    <div>
                      <label className="flex justify-between text-sm mb-2">
                        <span className="text-slate-300">Wind Speed</span>
                        <span className="text-amber-400 font-bold">{simWindSpeed} km/h</span>
                      </label>
                      <input type="range" className="w-full accent-amber-500" min="0" max="250" value={simWindSpeed} onChange={(e) => setSimWindSpeed(Number(e.target.value))} />
                    </div>
                    <button onClick={runSimulation} disabled={isSimulating} className="w-full mt-4 py-3 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white rounded-xl font-bold transition-all shadow-[0_0_15px_rgba(79,70,229,0.3)] flex justify-center items-center">
                      {isSimulating ? <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : 'Run AI Simulation'}
                    </button>
                  </div>
                </div>

                <div className="bg-[#0A0A0B] rounded-2xl border border-white/5 p-6 flex items-center justify-center relative overflow-hidden">
                  <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/10 to-purple-500/10" />
                  <div className="relative text-center w-full">
                    {simResult ? (
                      <>
                        <div className={`w-24 h-24 rounded-full border-4 flex items-center justify-center mx-auto mb-4 ${simResult.risk_level === 'critical' ? 'border-red-500/30' :
                          simResult.risk_level === 'high' ? 'border-orange-500/30' :
                            simResult.risk_level === 'moderate' ? 'border-amber-500/30' : 'border-emerald-500/30'
                          }`}>
                          <div className={`w-16 h-16 rounded-full flex items-center justify-center shadow-lg ${simResult.risk_level === 'critical' ? 'bg-red-500' :
                            simResult.risk_level === 'high' ? 'bg-orange-500' :
                              simResult.risk_level === 'moderate' ? 'bg-amber-500' : 'bg-emerald-500'
                            }`}>
                            {simResult.risk_level === 'safe' ? <ShieldCheck className="w-8 h-8 text-white" /> : <AlertTriangle className="w-8 h-8 text-white" />}
                          </div>
                        </div>
                        <h3 className="text-2xl font-black text-white mb-2 tracking-wide uppercase">{simResult.risk_level} Risk</h3>
                        <p className={`font-medium mb-6 ${simResult.risk_level === 'critical' ? 'text-red-400' :
                          simResult.risk_level === 'high' ? 'text-orange-400' :
                            simResult.risk_level === 'moderate' ? 'text-amber-400' : 'text-emerald-400'
                          }`}>
                          Max Probability: {(simResult.risk_score * 100).toFixed(0)}%
                        </p>

                        <div className="grid grid-cols-3 gap-3 text-left">
                          <div className="bg-white/5 p-3 rounded-xl border border-white/5">
                            <div className="text-[10px] text-slate-500 uppercase tracking-wider mb-1 text-center">Flood</div>
                            <div className="text-lg font-bold text-blue-400 text-center">{(simResult.flood_probability * 100).toFixed(0)}%</div>
                          </div>
                          <div className="bg-white/5 p-3 rounded-xl border border-white/5">
                            <div className="text-[10px] text-slate-500 uppercase tracking-wider mb-1 text-center">Landslide</div>
                            <div className="text-lg font-bold text-orange-400 text-center">{(simResult.landslide_probability * 100).toFixed(0)}%</div>
                          </div>
                          <div className="bg-white/5 p-3 rounded-xl border border-white/5">
                            <div className="text-[10px] text-slate-500 uppercase tracking-wider mb-1 text-center">Surge</div>
                            <div className="text-lg font-bold text-purple-400 text-center">{(simResult.storm_surge_probability * 100).toFixed(0)}%</div>
                          </div>
                        </div>
                        <p className="text-xs text-slate-400 mt-6 bg-white/5 p-3 rounded-lg border border-white/5 italic">
                          "{simResult.prediction_6h}"
                        </p>
                      </>
                    ) : (
                      <div className="flex flex-col items-center justify-center text-slate-500 py-12">
                        <Layers className="w-16 h-16 text-indigo-500/20 mb-4" />
                        <p className="text-sm font-medium px-8">Ready to simulate. Adjust parameters and run engine.</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
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