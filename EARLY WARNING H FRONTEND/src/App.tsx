import React, { useState, useEffect, useRef } from "react";
import { io } from "socket.io-client";
import {
  Activity, AlertTriangle, Bell, CloudRain, Droplets, Layers,
  LayoutGrid, Map as MapIcon, Waves, Zap, TrendingUp, ShieldCheck,
  Radio, Clock, Wifi, Flame, ThermometerSun, Mail, CheckCircle2,
  Phone, Wind, Eye
} from "lucide-react";

import DisasterMap from "./components/DisasterMap";
import RiskTimelineChart from "./components/RiskTimelineChart";
import AIChatAssistant from "./components/AIChatAssistant";
import CommunityReportModal from "./components/CommunityReportModal";
import NewsTicker from "./components/NewsTicker";

const API = "https://early-warning-system-fh1y.onrender.com";

// ── 3D Particle Background ──────────────────────────────────────────────────
function ParticleCanvas() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const canvas = canvasRef.current!;
    const ctx = canvas.getContext("2d")!;
    let animId: number;
    const resize = () => { canvas.width = canvas.offsetWidth; canvas.height = canvas.offsetHeight; };
    resize();
    window.addEventListener("resize", resize);

    const particles = Array.from({ length: 80 }, () => ({
      x: Math.random() * canvas.width,
      y: Math.random() * canvas.height,
      z: Math.random() * 2 + 0.5,
      vx: (Math.random() - 0.5) * 0.3,
      vy: (Math.random() - 0.5) * 0.3,
      r: Math.random() * 1.5 + 0.5,
      hue: Math.random() > 0.5 ? 200 : 10,
    }));

    const draw = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      particles.forEach(p => {
        p.x += p.vx * p.z; p.y += p.vy * p.z;
        if (p.x < 0) p.x = canvas.width;
        if (p.x > canvas.width) p.x = 0;
        if (p.y < 0) p.y = canvas.height;
        if (p.y > canvas.height) p.y = 0;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r * p.z, 0, Math.PI * 2);
        ctx.fillStyle = `hsla(${p.hue}, 80%, 70%, ${0.15 * p.z})`;
        ctx.fill();
      });
      // draw connecting lines
      for (let i = 0; i < particles.length; i++) {
        for (let j = i + 1; j < particles.length; j++) {
          const dx = particles[i].x - particles[j].x;
          const dy = particles[i].y - particles[j].y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist < 100) {
            ctx.beginPath();
            ctx.moveTo(particles[i].x, particles[i].y);
            ctx.lineTo(particles[j].x, particles[j].y);
            ctx.strokeStyle = `rgba(99,179,237,${0.04 * (1 - dist / 100)})`;
            ctx.lineWidth = 0.5;
            ctx.stroke();
          }
        }
      }
      animId = requestAnimationFrame(draw);
    };
    draw();
    return () => { cancelAnimationFrame(animId); window.removeEventListener("resize", resize); };
  }, []);
  return <canvas ref={canvasRef} className="absolute inset-0 w-full h-full pointer-events-none opacity-60" />;
}

// ── 3D Metric Card ──────────────────────────────────────────────────────────
function MetricCard({ m }: { m: any }) {
  const [tilt, setTilt] = useState({ x: 0, y: 0 });
  const cardRef = useRef<HTMLDivElement>(null);

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = cardRef.current!.getBoundingClientRect();
    const x = ((e.clientY - rect.top) / rect.height - 0.5) * 20;
    const y = ((e.clientX - rect.left) / rect.width - 0.5) * -20;
    setTilt({ x, y });
  };

  return (
    <div
      ref={cardRef}
      onMouseMove={handleMouseMove}
      onMouseLeave={() => setTilt({ x: 0, y: 0 })}
      style={{
        transform: `perspective(800px) rotateX(${tilt.x}deg) rotateY(${tilt.y}deg) translateZ(0)`,
        transition: tilt.x === 0 ? "transform 0.6s ease" : "transform 0.1s ease",
      }}
      className={`relative rounded-2xl p-5 border ${m.border} overflow-hidden cursor-default group`}
      style2={{ background: "rgba(255,255,255,0.03)" }}
    >
      {/* glassmorphism bg */}
      <div className="absolute inset-0 rounded-2xl"
        style={{ background: "linear-gradient(135deg, rgba(255,255,255,0.06) 0%, rgba(255,255,255,0.01) 100%)", backdropFilter: "blur(12px)" }} />

      {/* top shine */}
      <div className="absolute top-0 left-0 right-0 h-px opacity-40"
        style={{ background: "linear-gradient(90deg, transparent, rgba(255,255,255,0.5), transparent)" }} />

      {/* glow blob */}
      <div className={`absolute -top-6 -right-6 w-24 h-24 rounded-full blur-2xl opacity-20 ${m.glowBg}`} />

      <div className="relative z-10">
        <div className="flex justify-between items-start mb-4">
          <div className={`w-11 h-11 rounded-xl ${m.bg} flex items-center justify-center border border-white/10 shadow-lg`}
            style={{ boxShadow: `0 4px 15px ${m.shadowColor}` }}>
            <m.icon className={`w-5 h-5 ${m.color}`} />
          </div>
          <div className={`w-2 h-2 rounded-full ${m.dot} animate-pulse`} />
        </div>
        <p className="text-xs text-slate-500 font-semibold uppercase tracking-widest mb-1">{m.label}</p>
        <div className="flex items-baseline gap-1">
          <span className="text-3xl font-black text-white" style={{ textShadow: `0 0 20px ${m.shadowColor}` }}>
            {m.value}
          </span>
          <span className="text-slate-500 text-sm font-medium">{m.unit}</span>
        </div>

        {/* bottom bar */}
        <div className="mt-4 h-1 rounded-full bg-white/5 overflow-hidden">
          <div className={`h-full rounded-full ${m.barColor} transition-all duration-1000`}
            style={{ width: `${Math.min(100, Math.max(5, isNaN(Number(m.value)) ? 50 : Number(m.value)))}%` }} />
        </div>
      </div>
    </div>
  );
}

// ── Risk Orb ────────────────────────────────────────────────────────────────
function RiskOrb({ label, value, color }: { label: string; value: number; color: string }) {
  const radius = 36;
  const circ = 2 * Math.PI * radius;
  const offset = circ - (value / 100) * circ;
  return (
    <div className="flex flex-col items-center gap-2">
      <div className="relative w-24 h-24">
        <svg className="w-full h-full -rotate-90" viewBox="0 0 80 80">
          <circle cx="40" cy="40" r={radius} fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth="6" />
          <circle cx="40" cy="40" r={radius} fill="none" stroke={color} strokeWidth="6"
            strokeDasharray={circ} strokeDashoffset={offset}
            strokeLinecap="round"
            style={{ filter: `drop-shadow(0 0 6px ${color})`, transition: "stroke-dashoffset 1s ease" }} />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-xl font-black text-white">{value}%</span>
        </div>
      </div>
      <span className="text-xs text-slate-400 font-semibold uppercase tracking-wider">{label}</span>
    </div>
  );
}

// ── Main App ────────────────────────────────────────────────────────────────
export default function App() {
  const [activeTab, setActiveTab] = useState("dashboard");
  const [currentTime, setCurrentTime] = useState(new Date().toLocaleTimeString());
  const [alerts, setAlerts] = useState<any[]>([]);
  const [isConnected, setIsConnected] = useState(false);
  const [isReportOpen, setIsReportOpen] = useState(false);

  const [emailSending, setEmailSending] = useState(false);
  const [emailSuccess, setEmailSuccess] = useState<string | null>(null);

  const [locations, setLocations] = useState({});
  const [sensorData, setSensorData] = useState({});
  const [riskData, setRiskData] = useState({});
  const [timelineData, setTimelineData] = useState([]);

  const [simTemperature, setSimTemperature] = useState(38);
  const [simHumidity, setSimHumidity] = useState(30);
  const [simRainfall, setSimRainfall] = useState(0);
  const [simRiverLevel, setSimRiverLevel] = useState(2.5);
  const [simSoilMoisture, setSimSoilMoisture] = useState(20);
  const [simWindSpeed, setSimWindSpeed] = useState(45);
  const [simResult, setSimResult] = useState<any>(null);
  const [isSimulating, setIsSimulating] = useState(false);

  const triggerEmailAlert = async (message: string, severity: string, type: string) => {
    setEmailSending(true);
    try {
      const res = await fetch(`${API}/api/send-email-alert`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message, severity, type }),
      });
      const data = await res.json();
      if (data.success) {
        setEmailSuccess("Alert sent to earlywarning34@gmail.com!");
        setTimeout(() => setEmailSuccess(null), 4000);
      }
    } catch (err) { console.error(err); }
    finally { setEmailSending(false); }
  };

  const runSimulation = async () => {
    setIsSimulating(true);
    try {
      const res = await fetch(`${API}/api/simulate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          temperature: simTemperature, humidity: simHumidity,
          rainfall: simRainfall, river_level: simRiverLevel,
          soil_moisture: simSoilMoisture, wind_speed: simWindSpeed,
        }),
      });
      const data = await res.json();
      setSimResult(data);
    } catch (err) { console.error(err); }
    finally { setIsSimulating(false); }
  };

  useEffect(() => {
    const fetchInitialData = async () => {
      try {
        const [dataRes, alertsRes, locRes] = await Promise.all([
          fetch(`${API}/api/latest-data`).catch(() => null),
          fetch(`${API}/api/alerts`).catch(() => null),
          fetch(`${API}/api/locations`).catch(() => null),
        ]);
        if (dataRes?.ok) {
          const latestData = await dataRes.json();
          const newSensors: any = {};
          latestData.forEach((item: any) => { newSensors[item.location_id] = item; });
          setSensorData(newSensors);
        }
        if (alertsRes?.ok) setAlerts(await alertsRes.json());
        if (locRes?.ok) {
          const locsData = await locRes.json();
          const newLocs: Record<string, any> = {};
          locsData.forEach((item: any) => { newLocs[item.id] = item; });
          setLocations(newLocs);
        }
      } catch (e) { console.error(e); }
    };
    fetchInitialData();

    const socket = io(API, { transports: ["websocket", "polling"] });
    socket.on("connect", () => setIsConnected(true));
    socket.on("disconnect", () => setIsConnected(false));
    socket.on("sensorUpdate", (payload) => {
      setSensorData(prev => ({ ...prev, [payload.location_id]: { ...(prev as any)[payload.location_id], ...payload.data } }));
    });
    socket.on("riskUpdate", (payload) => {
      setRiskData(prev => ({ ...prev, [payload.location_id]: payload.prediction }));
      setTimelineData((prev: any) => {
        const timeStr = new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" });
        const latest = {
          time: timeStr,
          flood: payload.prediction.flood_probability * 100,
          landslide: payload.prediction.landslide_probability * 100,
          fire: payload.prediction.fire_probability * 100,
          surge: payload.prediction.storm_surge_probability * 100,
        };
        const updated = [...prev, latest];
        return updated.length > 15 ? updated.slice(updated.length - 15) : updated;
      });
    });
    socket.on("new_alert", (payload) => setAlerts(prev => [payload, ...prev].slice(0, 50)));
    return () => socket.disconnect();
  }, []);

  const previousAlertCount = useRef(0);
  useEffect(() => {
    if (alerts.length > previousAlertCount.current && alerts.length > 0) {
      const latestAlert = alerts[0];
      try {
        const audio = new Audio("https://assets.mixkit.co/active_storage/sfx/2869/2869-preview.mp3");
        audio.volume = 0.5; audio.play().catch(() => { });
      } catch (e) { }
      if (latestAlert.severity === "CRITICAL" || latestAlert.severity === "WARNING") {
        if ("speechSynthesis" in window) {
          const utterance = new SpeechSynthesisUtterance(`Warning: ${latestAlert.message.split(".")[0]}`);
          window.speechSynthesis.speak(utterance);
        }
      }
    }
    previousAlertCount.current = alerts.length;
  }, [alerts]);

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date().toLocaleTimeString()), 1000);
    return () => clearInterval(timer);
  }, []);

  const calcAvg = (key: string, defaultVal: string) => {
    const keys = Object.keys(sensorData);
    if (keys.length === 0) return defaultVal;
    let validCount = 0;
    const sum = keys.reduce((acc, k) => {
      const val = Number((sensorData as any)[k]?.[key]);
      if (!isNaN(val)) { validCount++; return acc + val; }
      return acc;
    }, 0);
    return validCount === 0 ? defaultVal : (sum / validCount).toFixed(1);
  };

  const metrics = [
    {
      id: "temp", label: "Temperature", value: calcAvg("temperature", "0.0"), unit: "°C",
      icon: ThermometerSun, color: "text-orange-400", bg: "bg-orange-500/10",
      border: "border-orange-500/20", glowBg: "bg-orange-500", shadowColor: "rgba(251,146,60,0.4)",
      dot: "bg-orange-400", barColor: "bg-gradient-to-r from-orange-500 to-red-500",
    },
    {
      id: "precip", label: "Rainfall", value: calcAvg("rainfall", "0.0"), unit: "mm/h",
      icon: CloudRain, color: "text-blue-400", bg: "bg-blue-500/10",
      border: "border-blue-500/20", glowBg: "bg-blue-500", shadowColor: "rgba(96,165,250,0.4)",
      dot: "bg-blue-400", barColor: "bg-gradient-to-r from-blue-500 to-cyan-400",
    },
    {
      id: "wind", label: "Wind Speed", value: calcAvg("wind_speed", "0.0"), unit: "km/h",
      icon: Wind, color: "text-indigo-400", bg: "bg-indigo-500/10",
      border: "border-indigo-500/20", glowBg: "bg-indigo-500", shadowColor: "rgba(129,140,248,0.4)",
      dot: "bg-indigo-400", barColor: "bg-gradient-to-r from-indigo-500 to-purple-500",
    },
    {
      id: "gas", label: "Gas / Smoke", value: calcAvg("gas", "0"), unit: "ppm",
      icon: Activity, color: "text-yellow-400", bg: "bg-yellow-500/10",
      border: "border-yellow-500/20", glowBg: "bg-yellow-500", shadowColor: "rgba(250,204,21,0.4)",
      dot: "bg-yellow-400", barColor: "bg-gradient-to-r from-yellow-500 to-orange-400",
    },
    {
      id: "water", label: "Water Level", value: calcAvg("water_level", "0"), unit: "%",
      icon: Waves, color: "text-cyan-400", bg: "bg-cyan-500/10",
      border: "border-cyan-500/20", glowBg: "bg-cyan-500", shadowColor: "rgba(34,211,238,0.4)",
      dot: "bg-cyan-400", barColor: "bg-gradient-to-r from-cyan-500 to-blue-500",
    },
    {
      id: "fire", label: "Fire Risk",
      value: (Number(calcAvg("temperature", "0")) > 35 && Number(calcAvg("humidity", "100")) < 40) ? "HIGH" : "SAFE",
      unit: "",
      icon: Flame, color: "text-red-500", bg: "bg-red-500/10",
      border: "border-red-500/20", glowBg: "bg-red-500", shadowColor: "rgba(239,68,68,0.4)",
      dot: "bg-red-500", barColor: "bg-gradient-to-r from-red-600 to-pink-500",
    },
  ];

  const navItems = [
    { id: "dashboard", icon: LayoutGrid, label: "Dashboard" },
    { id: "map", icon: MapIcon, label: "TN Map" },
    { id: "alerts", icon: AlertTriangle, label: "Alerts" },
    { id: "simulation", icon: Layers, label: "Simulate" },
  ];

  const floodRisk = Math.round(
    Math.min(100, (Number(calcAvg("water_level", "0")) * 0.4) + (Number(calcAvg("rainfall", "0")) * 0.35) + (Number(calcAvg("humidity", "50")) * 0.25))
  );
  const fireRisk = Math.round(
    Math.min(100, (Number(calcAvg("gas", "0")) * 0.004) + (Number(calcAvg("temperature", "0")) * 1.5) - (Number(calcAvg("humidity", "50")) * 0.4))
  );

  return (
    <div className="flex flex-col md:flex-row h-screen bg-[#060608] text-slate-200 overflow-hidden relative"
      style={{ fontFamily: "'Rajdhani', 'Orbitron', sans-serif" }}>

      {/* Google Fonts */}
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Rajdhani:wght@400;500;600;700&family=Orbitron:wght@400;700;900&display=swap');

        * { box-sizing: border-box; }

        ::-webkit-scrollbar { width: 4px; }
        ::-webkit-scrollbar-track { background: transparent; }
        ::-webkit-scrollbar-thumb { background: rgba(99,102,241,0.3); border-radius: 99px; }

        @keyframes floatY {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-6px); }
        }
        @keyframes scanline {
          0% { transform: translateY(-100%); }
          100% { transform: translateY(100vh); }
        }
        @keyframes glowPulse {
          0%, 100% { opacity: 0.6; }
          50% { opacity: 1; }
        }
        @keyframes borderRotate {
          0% { background-position: 0% 50%; }
          100% { background-position: 200% 50%; }
        }

        .float-anim { animation: floatY 4s ease-in-out infinite; }
        .float-anim-2 { animation: floatY 5s ease-in-out infinite 0.5s; }
        .float-anim-3 { animation: floatY 6s ease-in-out infinite 1s; }

        .scanline-effect::after {
          content: '';
          position: absolute;
          top: 0; left: 0; right: 0;
          height: 2px;
          background: linear-gradient(90deg, transparent, rgba(99,179,237,0.15), transparent);
          animation: scanline 4s linear infinite;
          pointer-events: none;
        }

        .sentinel-logo {
          font-family: 'Orbitron', monospace;
          font-weight: 900;
          letter-spacing: 0.05em;
        }

        .glass-panel {
          background: linear-gradient(135deg, rgba(255,255,255,0.04) 0%, rgba(255,255,255,0.01) 100%);
          backdrop-filter: blur(20px);
          border: 1px solid rgba(255,255,255,0.07);
        }

        .neon-border-blue {
          box-shadow: 0 0 0 1px rgba(59,130,246,0.3), inset 0 0 20px rgba(59,130,246,0.03);
        }

        .neon-border-red {
          box-shadow: 0 0 0 1px rgba(239,68,68,0.4), inset 0 0 20px rgba(239,68,68,0.05), 0 0 30px rgba(239,68,68,0.2);
        }

        .depth-shadow {
          box-shadow: 0 25px 50px rgba(0,0,0,0.5), 0 8px 16px rgba(0,0,0,0.3);
        }

        .hex-bg {
          background-image: url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='0.015'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E");
        }
      `}</style>

      {/* Particle Background */}
      <div className="absolute inset-0 pointer-events-none z-0">
        <ParticleCanvas />
      </div>

      {/* Scanline overlay */}
      <div className="absolute inset-0 pointer-events-none z-0 scanline-effect" />

      {/* Deep background gradient */}
      <div className="absolute inset-0 pointer-events-none z-0"
        style={{ background: "radial-gradient(ellipse at 20% 50%, rgba(29,78,216,0.08) 0%, transparent 60%), radial-gradient(ellipse at 80% 20%, rgba(220,38,38,0.06) 0%, transparent 50%)" }} />

      {/* EMAIL SUCCESS TOAST */}
      {emailSuccess && (
        <div className="fixed top-6 right-6 z-[200] bg-emerald-500/90 backdrop-blur-xl text-white px-6 py-4 rounded-2xl depth-shadow flex items-center gap-3 border border-emerald-400/30">
          <CheckCircle2 className="w-5 h-5" />
          <span className="font-bold">{emailSuccess}</span>
        </div>
      )}

      {/* CRITICAL ALERT BANNER */}
      {alerts.length > 0 && (alerts[0].severity === "CRITICAL" || alerts[0].severity === "WARNING") && (
        <div className="fixed top-0 left-0 right-0 z-[300] text-white px-4 py-3 flex items-center justify-center gap-3 border-b border-red-400/30"
          style={{ background: "linear-gradient(90deg, rgba(127,29,29,0.95), rgba(185,28,28,0.95), rgba(127,29,29,0.95))", backdropFilter: "blur(20px)", animation: "glowPulse 2s ease-in-out infinite", boxShadow: "0 0 40px rgba(220,38,38,0.4)" }}>
          <AlertTriangle className="w-5 h-5 animate-bounce" />
          <span className="font-black tracking-widest uppercase text-sm mr-2">{alerts[0].severity} ALERT:</span>
          <span className="font-medium text-sm">{alerts[0].message}</span>
        </div>
      )}

      {/* ── SIDEBAR ────────────────────────────────── */}
      <aside className="hidden md:flex w-20 lg:w-64 flex-col justify-between shrink-0 relative z-20 hex-bg"
        style={{ background: "linear-gradient(180deg, rgba(6,6,8,0.98) 0%, rgba(10,10,20,0.98) 100%)", borderRight: "1px solid rgba(255,255,255,0.06)" }}>

        {/* Logo */}
        <div>
          <div className="h-20 flex items-center justify-center lg:justify-start lg:px-6"
            style={{ borderBottom: "1px solid rgba(255,255,255,0.05)" }}>
            <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0 relative"
              style={{ background: "linear-gradient(135deg, #1d4ed8, #7c3aed)", boxShadow: "0 0 20px rgba(99,102,241,0.4), 0 4px 15px rgba(0,0,0,0.3)" }}>
              <Zap className="text-white w-5 h-5" />
              <div className="absolute inset-0 rounded-xl" style={{ background: "linear-gradient(135deg, rgba(255,255,255,0.2), transparent)" }} />
            </div>
            <div className="hidden lg:flex flex-col ml-3">
              <span className="sentinel-logo text-base text-white leading-tight">
                Sentinel<span style={{ color: "#60a5fa" }}>Alert</span>
              </span>
              <span className="text-[9px] text-slate-500 tracking-[0.2em] uppercase">Early Warning System</span>
            </div>
          </div>

          {/* Nav */}
          <nav className="p-3 space-y-1 mt-2">
            {navItems.map((item, i) => (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className="w-full flex items-center justify-center lg:justify-start lg:px-4 py-3 rounded-xl transition-all duration-300 relative group"
                style={activeTab === item.id ? {
                  background: "linear-gradient(135deg, rgba(59,130,246,0.15), rgba(99,102,241,0.1))",
                  border: "1px solid rgba(59,130,246,0.25)",
                  boxShadow: "0 0 20px rgba(59,130,246,0.1), inset 0 1px 0 rgba(255,255,255,0.05)"
                } : {
                  background: "transparent",
                  border: "1px solid transparent"
                }}
              >
                {activeTab === item.id && (
                  <div className="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-6 rounded-r-full"
                    style={{ background: "linear-gradient(180deg, #60a5fa, #818cf8)" }} />
                )}
                <item.icon className={`w-5 h-5 transition-colors ${activeTab === item.id ? "text-blue-400" : "text-slate-600 group-hover:text-slate-400"}`} />
                <span className={`hidden lg:block ml-3 text-sm font-semibold transition-colors ${activeTab === item.id ? "text-blue-300" : "text-slate-600 group-hover:text-slate-400"}`}>
                  {item.label}
                </span>
              </button>
            ))}
          </nav>
        </div>

        {/* Status Panel */}
        <div className="p-4 m-3 rounded-2xl glass-panel hidden lg:block"
          style={{ border: "1px solid rgba(255,255,255,0.06)" }}>
          <div className="flex items-center gap-2 mb-3">
            <div className={`w-2 h-2 rounded-full ${isConnected ? "bg-emerald-400" : "bg-red-400"} animate-pulse`} />
            <span className="text-xs font-bold tracking-wider uppercase text-slate-400">
              {isConnected ? "System Live" : "Offline"}
            </span>
          </div>
          <div className="space-y-2">
            <div className="flex justify-between text-xs">
              <span className="text-slate-600">Alerts</span>
              <span className="text-white font-bold">{alerts.length}</span>
            </div>
            <div className="flex justify-between text-xs">
              <span className="text-slate-600">Flood Risk</span>
              <span className={`font-bold ${floodRisk > 60 ? "text-red-400" : floodRisk > 30 ? "text-yellow-400" : "text-emerald-400"}`}>{floodRisk}%</span>
            </div>
            <div className="flex justify-between text-xs">
              <span className="text-slate-600">Fire Risk</span>
              <span className={`font-bold ${fireRisk > 60 ? "text-red-400" : fireRisk > 30 ? "text-yellow-400" : "text-emerald-400"}`}>{Math.max(0, fireRisk)}%</span>
            </div>
          </div>
        </div>
      </aside>

      {/* ── MOBILE BOTTOM NAV ──────────────────────── */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 h-16 z-[100] flex justify-around items-center px-2"
        style={{ background: "rgba(6,6,8,0.95)", backdropFilter: "blur(20px)", borderTop: "1px solid rgba(255,255,255,0.07)" }}>
        {navItems.map(item => (
          <button key={item.id} onClick={() => setActiveTab(item.id)}
            className="flex flex-col items-center justify-center w-full h-full gap-1 transition-colors"
            style={{ color: activeTab === item.id ? "#60a5fa" : "#475569" }}>
            <item.icon className="w-5 h-5" />
            <span className="text-[9px] font-bold tracking-wider uppercase">{item.label}</span>
          </button>
        ))}
      </nav>

      {/* ── MAIN CONTENT ───────────────────────────── */}
      <main className="flex-1 flex flex-col overflow-hidden relative pb-16 md:pb-0 z-10">

        {/* Header */}
        <header className="h-16 md:h-20 px-4 md:px-6 flex items-center justify-between shrink-0"
          style={{ background: "rgba(6,6,8,0.8)", backdropFilter: "blur(20px)", borderBottom: "1px solid rgba(255,255,255,0.05)" }}>
          <div className="flex items-center gap-3 md:gap-4">
            <div className="md:hidden w-8 h-8 rounded-lg flex items-center justify-center"
              style={{ background: "linear-gradient(135deg, #1d4ed8, #7c3aed)", boxShadow: "0 0 15px rgba(99,102,241,0.4)" }}>
              <Zap className="text-white w-4 h-4" />
            </div>

            <h1 className="sentinel-logo text-lg md:text-xl font-bold hidden sm:block capitalize"
              style={{ background: "linear-gradient(135deg, #fff, #94a3b8)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>
              {activeTab.replace("-", " ")}
            </h1>

            <div className="flex items-center gap-2 text-slate-400 text-xs px-3 py-1.5 rounded-full"
              style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.07)" }}>
              <Clock className="w-3 h-3 text-blue-400" />
              <span className="font-mono">{currentTime}</span>
            </div>

            <div className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-full font-bold"
              style={isConnected ? {
                background: "rgba(16,185,129,0.1)", border: "1px solid rgba(16,185,129,0.25)", color: "#34d399",
                boxShadow: "0 0 15px rgba(16,185,129,0.1)"
              } : {
                background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.25)", color: "#f87171"
              }}>
              <Wifi className="w-3 h-3" />
              <span>{isConnected ? "LIVE" : "OFFLINE"}</span>
            </div>

            <div className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-full font-bold"
              style={{ background: "rgba(139,92,246,0.1)", border: "1px solid rgba(139,92,246,0.25)", color: "#a78bfa" }}>
              <Phone className="w-3 h-3" />
              <span className="hidden sm:block">SMS ACTIVE</span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button onClick={() => setActiveTab("alerts")}
              className="relative p-2 rounded-xl transition-all"
              style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.07)" }}>
              <Bell className="w-5 h-5 text-slate-400" />
              {alerts.length > 0 && (
                <span className="absolute top-0.5 right-0.5 w-2 h-2 bg-red-500 rounded-full animate-ping" />
              )}
            </button>
            <button onClick={() => setIsReportOpen(true)}
              className="px-4 py-2 text-white text-xs font-black rounded-xl uppercase tracking-wider transition-all hover:scale-105"
              style={{ background: "linear-gradient(135deg, #dc2626, #991b1b)", boxShadow: "0 0 20px rgba(220,38,38,0.3), 0 4px 15px rgba(0,0,0,0.3)" }}>
              ⚡ Report Risk
            </button>
          </div>
        </header>

        <NewsTicker alerts={alerts} />

        {/* ── SCROLLABLE CONTENT ─────────────────────── */}
        <div className="flex-1 overflow-y-auto p-4 md:p-6 space-y-6">

          {/* ── DASHBOARD ── */}
          {activeTab === "dashboard" && (
            <div className="space-y-6">

              {/* Risk Orbs Row */}
              <div className="glass-panel rounded-2xl p-5 depth-shadow flex flex-col sm:flex-row items-center justify-between gap-6">
                <div>
                  <div className="sentinel-logo text-xs text-slate-500 uppercase tracking-widest mb-1">SentinelAlert — Live Threat Matrix</div>
                  <h2 className="text-xl font-black text-white">Tamil Nadu Risk Overview</h2>
                  <p className="text-xs text-slate-500 mt-1">Real-time sensor fusion · Updated every 10s</p>
                </div>
                <div className="flex gap-8 sm:gap-12">
                  <RiskOrb label="Flood Risk" value={Math.max(0, Math.min(100, floodRisk))} color="#60a5fa" />
                  <RiskOrb label="Fire Risk" value={Math.max(0, Math.min(100, fireRisk))} color="#f87171" />
                  <RiskOrb label="Active Alerts" value={Math.min(100, alerts.length * 5)} color="#a78bfa" />
                </div>
              </div>

              {/* Metric Cards Grid */}
              <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
                {metrics.map((m, i) => (
                  <div key={m.id} className={`float-anim-${(i % 3) + 1}`} style={{ animationDelay: `${i * 0.2}s` }}>
                    <MetricCard m={m} />
                  </div>
                ))}
              </div>

              {/* Charts Row */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2 glass-panel rounded-2xl p-5 depth-shadow">
                  <h3 className="text-sm font-black text-white mb-4 flex items-center gap-2 sentinel-logo tracking-wider uppercase">
                    <TrendingUp className="w-4 h-4 text-blue-400" /> Risk Forecast Timeline
                  </h3>
                  <RiskTimelineChart data={timelineData} />
                </div>

                {/* Live Alert Stream */}
                <div className="glass-panel rounded-2xl p-5 depth-shadow flex flex-col h-[400px]">
                  <h3 className="text-sm font-black text-white mb-4 flex items-center gap-2 sentinel-logo tracking-wider uppercase shrink-0">
                    <Radio className="w-4 h-4 text-red-400 animate-pulse" /> Live Alert Stream
                  </h3>
                  <div className="flex-1 overflow-y-auto space-y-3 pr-1">
                    {alerts.length > 0 ? alerts.map((alert, index) => (
                      <div key={alert.id || index}
                        className="p-3 rounded-xl shrink-0 transition-all"
                        style={alert.message?.includes("Fire") || alert.type === "Fire"
                          ? { background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.2)", boxShadow: "0 0 15px rgba(239,68,68,0.05)" }
                          : { background: "rgba(59,130,246,0.06)", border: "1px solid rgba(59,130,246,0.15)" }}>
                        <div className="flex items-center justify-between mb-1">
                          <span className={`text-[10px] font-black uppercase tracking-widest ${alert.message?.includes("Fire") ? "text-red-400" : "text-blue-400"}`}>
                            {alert.severity}
                          </span>
                          <span className="text-[10px] text-slate-600 font-mono">{new Date(alert.timestamp).toLocaleTimeString()}</span>
                        </div>
                        <p className="text-xs text-slate-300 leading-relaxed">{alert.message}</p>
                      </div>
                    )) : (
                      <div className="h-full flex flex-col items-center justify-center text-slate-600">
                        <ShieldCheck className="w-10 h-10 text-emerald-500/20 mb-2" />
                        <p className="text-xs font-bold uppercase tracking-wider">All Clear</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ── MAP ── */}
          {activeTab === "map" && (
            <div className="relative rounded-2xl overflow-hidden depth-shadow"
              style={{ height: "calc(100vh - 160px)", border: "1px solid rgba(59,130,246,0.2)", boxShadow: "0 0 40px rgba(59,130,246,0.1)" }}>
              <DisasterMap sensors={sensorData} risks={riskData} />
            </div>
          )}

          {/* ── ALERTS ── */}
          {activeTab === "alerts" && (
            <div className="glass-panel rounded-2xl p-6 depth-shadow flex flex-col" style={{ minHeight: "60vh" }}>
              <div className="flex items-center justify-between mb-6 pb-4"
                style={{ borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
                <h2 className="sentinel-logo text-xl font-black text-white flex items-center gap-3">
                  <AlertTriangle className="w-6 h-6 text-red-400" /> Alert Console
                </h2>
                <div className="text-xs text-slate-500 font-bold uppercase tracking-wider">
                  {alerts.length} Active
                </div>
              </div>
              <div className="space-y-3 overflow-y-auto flex-1">
                {alerts.length > 0 ? alerts.map((alert, index) => (
                  <div key={alert.id || index}
                    className="p-5 rounded-2xl flex flex-col md:flex-row md:items-center gap-4 transition-all hover:scale-[1.01]"
                    style={alert.severity === "CRITICAL"
                      ? { background: "rgba(127,29,29,0.15)", border: "1px solid rgba(239,68,68,0.25)", boxShadow: "0 0 20px rgba(239,68,68,0.08)" }
                      : alert.severity === "WARNING"
                        ? { background: "rgba(120,53,15,0.15)", border: "1px solid rgba(245,158,11,0.25)" }
                        : { background: "rgba(23,37,84,0.15)", border: "1px solid rgba(59,130,246,0.2)" }}>
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <span className={`px-2 py-0.5 rounded-lg text-[10px] font-black uppercase tracking-widest ${alert.severity === "CRITICAL" ? "bg-red-500/20 text-red-400" : alert.severity === "WARNING" ? "bg-yellow-500/20 text-yellow-400" : "bg-blue-500/20 text-blue-400"}`}>
                          {alert.severity}
                        </span>
                        <span className="text-xs text-slate-500 font-mono flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {new Date(alert.timestamp).toLocaleString()}
                        </span>
                      </div>
                      <p className="text-slate-200 font-medium">{alert.message}</p>
                    </div>
                    <button
                      onClick={() => triggerEmailAlert(alert.message, alert.severity, alert.type || "Disaster")}
                      disabled={emailSending}
                      className="px-4 py-2 rounded-xl text-xs font-black flex items-center gap-2 transition-all hover:scale-105 whitespace-nowrap"
                      style={{ background: "rgba(99,102,241,0.1)", border: "1px solid rgba(99,102,241,0.3)", color: "#a5b4fc" }}>
                      <Mail className="w-4 h-4" />
                      {emailSending ? "Sending..." : "Email Authorities"}
                    </button>
                  </div>
                )) : (
                  <div className="flex flex-col items-center justify-center py-20 text-slate-600">
                    <ShieldCheck className="w-20 h-20 text-emerald-500/15 mb-4" />
                    <p className="sentinel-logo text-lg font-black uppercase tracking-widest">All Systems Normal</p>
                    <p className="text-xs mt-2">No active alerts across Tamil Nadu</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ── SIMULATION ── */}
          {activeTab === "simulation" && (
            <div className="glass-panel rounded-2xl p-6 depth-shadow overflow-y-auto">
              <h2 className="sentinel-logo text-xl font-black text-white flex items-center gap-3 mb-6">
                <Layers className="w-6 h-6 text-indigo-400" /> AI Threat Simulation Engine
              </h2>
              <div className="grid md:grid-cols-2 gap-8">
                {/* Controls */}
                <div className="space-y-5">
                  <p className="text-xs text-slate-500">Adjust environmental parameters to model disaster scenarios.</p>
                  <div className="space-y-4 p-5 rounded-2xl" style={{ background: "rgba(0,0,0,0.3)", border: "1px solid rgba(255,255,255,0.05)" }}>
                    {[
                      { label: "Temperature", value: simTemperature, set: setSimTemperature, min: 10, max: 50, unit: "°C", color: "#f87171", accent: "red" },
                      { label: "Humidity", value: simHumidity, set: setSimHumidity, min: 0, max: 100, unit: "%", color: "#60a5fa", accent: "blue" },
                      { label: "Rainfall", value: simRainfall, set: setSimRainfall, min: 0, max: 300, unit: "mm/h", color: "#818cf8", accent: "indigo" },
                      { label: "River Level", value: simRiverLevel, set: setSimRiverLevel, min: 0, max: 10, step: 0.1, unit: "m", color: "#38bdf8", accent: "sky" },
                      { label: "Wind Speed", value: simWindSpeed, set: setSimWindSpeed, min: 0, max: 250, unit: "km/h", color: "#fbbf24", accent: "amber" },
                    ].map(s => (
                      <div key={s.label}>
                        <label className="flex justify-between text-xs mb-2">
                          <span className="text-slate-400 font-semibold uppercase tracking-wider">{s.label}</span>
                          <span className="font-black" style={{ color: s.color }}>{s.value}{s.unit}</span>
                        </label>
                        <input type="range" className="w-full h-1.5 rounded-full appearance-none cursor-pointer"
                          style={{ accentColor: s.color }}
                          min={s.min} max={s.max} step={s.step || 1} value={s.value}
                          onChange={(e) => s.set(Number(e.target.value))} />
                      </div>
                    ))}

                    <button onClick={runSimulation} disabled={isSimulating}
                      className="w-full mt-4 py-3 rounded-xl font-black uppercase tracking-widest text-sm text-white transition-all hover:scale-105 disabled:opacity-50 flex justify-center items-center gap-2"
                      style={{ background: "linear-gradient(135deg, #4f46e5, #7c3aed)", boxShadow: "0 0 20px rgba(99,102,241,0.3), 0 4px 15px rgba(0,0,0,0.3)" }}>
                      {isSimulating
                        ? <><div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Simulating...</>
                        : <><Zap className="w-4 h-4" /> Run AI Simulation</>}
                    </button>
                  </div>
                </div>

                {/* Result */}
                <div className="rounded-2xl p-6 flex items-center justify-center relative overflow-hidden"
                  style={{ background: "linear-gradient(135deg, rgba(99,102,241,0.05), rgba(139,92,246,0.05))", border: "1px solid rgba(99,102,241,0.15)" }}>
                  {simResult ? (
                    <div className="w-full text-center">
                      <div className="relative w-28 h-28 mx-auto mb-4">
                        <div className="absolute inset-0 rounded-full animate-ping opacity-20"
                          style={{ background: simResult.risk_level === "critical" ? "#ef4444" : simResult.risk_level === "high" ? "#f97316" : simResult.risk_level === "moderate" ? "#eab308" : "#22c55e" }} />
                        <div className="absolute inset-0 rounded-full flex items-center justify-center"
                          style={{
                            background: `radial-gradient(circle, ${simResult.risk_level === "critical" ? "#ef4444" : simResult.risk_level === "high" ? "#f97316" : simResult.risk_level === "moderate" ? "#eab308" : "#22c55e"}, transparent)`,
                            boxShadow: `0 0 40px ${simResult.risk_level === "critical" ? "rgba(239,68,68,0.5)" : simResult.risk_level === "high" ? "rgba(249,115,22,0.5)" : "rgba(34,197,94,0.3)"}`
                          }}>
                          {simResult.risk_level === "safe"
                            ? <ShieldCheck className="w-10 h-10 text-white" />
                            : <AlertTriangle className="w-10 h-10 text-white" />}
                        </div>
                      </div>

                      <h3 className="sentinel-logo text-2xl font-black text-white uppercase mb-6 tracking-wider">
                        {simResult.risk_level} Risk
                      </h3>

                      <div className="grid grid-cols-4 gap-2 mb-6">
                        {[
                          { label: "Flood", value: simResult.flood_probability, color: "#60a5fa" },
                          { label: "Landslide", value: simResult.landslide_probability, color: "#fb923c" },
                          { label: "Wildfire", value: simResult.fire_probability, color: "#f87171" },
                          { label: "Surge", value: simResult.storm_surge_probability, color: "#c084fc" },
                        ].map(r => (
                          <div key={r.label} className="p-3 rounded-xl text-center"
                            style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.07)" }}>
                            <div className="text-[9px] text-slate-500 uppercase tracking-wider mb-1">{r.label}</div>
                            <div className="text-lg font-black" style={{ color: r.color }}>
                              {(r.value * 100).toFixed(0)}%
                            </div>
                          </div>
                        ))}
                      </div>

                      <p className="text-xs text-slate-400 p-3 rounded-xl italic mb-4"
                        style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.06)" }}>
                        "{simResult.prediction_6h}"
                      </p>

                      {(simResult.risk_level === "critical" || simResult.risk_level === "high") && (
                        <button
                          onClick={() => triggerEmailAlert(
                            `Simulated ${simResult.risk_level.toUpperCase()} risk. Flood: ${(simResult.flood_probability * 100).toFixed(0)}%, Fire: ${(simResult.fire_probability * 100).toFixed(0)}%. Immediate preventative measures recommended.`,
                            simResult.risk_level.toUpperCase(),
                            simResult.fire_probability > simResult.flood_probability ? "Fire" : "Flood"
                          )}
                          disabled={emailSending}
                          className="w-full py-3 rounded-xl font-black text-sm flex items-center justify-center gap-2 transition-all hover:scale-105"
                          style={{ background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.4)", color: "#f87171" }}>
                          <Mail className="w-4 h-4" />
                          {emailSending ? "Broadcasting..." : "Broadcast Warning to Authorities"}
                        </button>
                      )}
                    </div>
                  ) : (
                    <div className="flex flex-col items-center justify-center text-slate-600 py-12">
                      <Layers className="w-16 h-16 text-indigo-500/20 mb-4" />
                      <p className="sentinel-logo text-sm font-black uppercase tracking-widest">Ready to Simulate</p>
                      <p className="text-xs mt-2 text-center px-8">Adjust parameters and run the AI engine</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      </main>

      <AIChatAssistant />
      <CommunityReportModal isOpen={isReportOpen} onClose={() => setIsReportOpen(false)} />
    </div>
  );
}
