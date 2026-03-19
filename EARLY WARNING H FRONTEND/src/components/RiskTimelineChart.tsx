import React, { useState } from 'react';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, Legend
} from 'recharts';

interface TimelineData {
  time: string;
  flood?: number;
  fire?: number;
  landslide?: number;
  surge?: number;
}

// ── Custom Tooltip ──────────────────────────────────────────────────────────
const CustomTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload || !payload.length) return null;
  return (
    <div style={{
      background: 'linear-gradient(135deg, rgba(10,10,20,0.97), rgba(15,15,30,0.97))',
      backdropFilter: 'blur(20px)',
      border: '1px solid rgba(255,255,255,0.08)',
      borderRadius: '16px',
      padding: '14px 18px',
      boxShadow: '0 20px 40px rgba(0,0,0,0.6), 0 0 0 1px rgba(255,255,255,0.03)',
      minWidth: '160px',
    }}>
      <p style={{
        color: '#64748b', fontSize: '10px', fontWeight: 700,
        textTransform: 'uppercase', letterSpacing: '0.2em',
        marginBottom: '10px', fontFamily: 'Orbitron, monospace'
      }}>
        {label}
      </p>
      {payload.map((entry: any) => (
        <div key={entry.name} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px', gap: '16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: entry.color, boxShadow: `0 0 8px ${entry.color}` }} />
            <span style={{ color: '#94a3b8', fontSize: '11px', fontWeight: 600 }}>{entry.name}</span>
          </div>
          <span style={{ color: entry.color, fontSize: '13px', fontWeight: 900, fontFamily: 'Orbitron, monospace' }}>
            {entry.value?.toFixed(1)}%
          </span>
        </div>
      ))}
    </div>
  );
};

// ── Custom Legend ───────────────────────────────────────────────────────────
const CustomLegend = ({ payload, activeLines, toggleLine }: any) => (
  <div style={{ display: 'flex', gap: '12px', justifyContent: 'center', flexWrap: 'wrap', marginTop: '8px' }}>
    {payload?.map((entry: any) => (
      <button
        key={entry.value}
        onClick={() => toggleLine(entry.dataKey)}
        style={{
          display: 'flex', alignItems: 'center', gap: '6px',
          background: activeLines[entry.dataKey] ? `${entry.color}15` : 'rgba(255,255,255,0.03)',
          border: `1px solid ${activeLines[entry.dataKey] ? entry.color + '40' : 'rgba(255,255,255,0.06)'}`,
          borderRadius: '99px', padding: '4px 12px', cursor: 'pointer',
          transition: 'all 0.3s ease',
          opacity: activeLines[entry.dataKey] ? 1 : 0.4,
        }}
      >
        <div style={{
          width: '6px', height: '6px', borderRadius: '50%',
          background: entry.color, boxShadow: `0 0 6px ${entry.color}`
        }} />
        <span style={{ color: entry.color, fontSize: '10px', fontWeight: 700, fontFamily: 'Orbitron, monospace', textTransform: 'uppercase', letterSpacing: '0.1em' }}>
          {entry.value}
        </span>
      </button>
    ))}
  </div>
);

// ── Main Chart ──────────────────────────────────────────────────────────────
export default function RiskTimelineChart({ data }: { data: TimelineData[] }) {
  const [activeLines, setActiveLines] = useState({
    flood: true, fire: true, landslide: true, surge: true,
  });

  const toggleLine = (key: string) => {
    setActiveLines(prev => ({ ...prev, [key]: !(prev as any)[key] }));
  };

  const mockData: TimelineData[] = [
    { time: 'T-12h', flood: 15, fire: 8, landslide: 5, surge: 10 },
    { time: 'T-10h', flood: 18, fire: 12, landslide: 8, surge: 12 },
    { time: 'T-08h', flood: 20, fire: 18, landslide: 10, surge: 15 },
    { time: 'T-06h', flood: 25, fire: 22, landslide: 12, surge: 20 },
    { time: 'T-04h', flood: 35, fire: 30, landslide: 15, surge: 25 },
    { time: 'T-02h', flood: 40, fire: 35, landslide: 18, surge: 30 },
    { time: 'Now', flood: 45, fire: 42, landslide: 20, surge: 35 },
  ];

  const chartData = data && data.length > 0 ? data : mockData;

  const lines = [
    { key: 'flood', name: 'Flood', color: '#60a5fa', gradientId: 'gradFlood' },
    { key: 'fire', name: 'Fire', color: '#f87171', gradientId: 'gradFire' },
    { key: 'landslide', name: 'Landslide', color: '#fbbf24', gradientId: 'gradLandslide' },
    { key: 'surge', name: 'Surge', color: '#c084fc', gradientId: 'gradSurge' },
  ];

  return (
    <div style={{ width: '100%' }}>

      {/* Chart */}
      <div style={{
        width: '100%', height: '260px',
        background: 'linear-gradient(180deg, rgba(0,0,0,0.2) 0%, rgba(0,0,0,0.05) 100%)',
        borderRadius: '16px',
        padding: '12px 0 0',
        position: 'relative',
        overflow: 'hidden',
      }}>
        {/* Subtle grid glow overlay */}
        <div style={{
          position: 'absolute', inset: 0, pointerEvents: 'none',
          background: 'radial-gradient(ellipse at 50% 0%, rgba(96,165,250,0.04) 0%, transparent 70%)',
          borderRadius: '16px',
        }} />

        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
            <defs>
              {lines.map(l => (
                <linearGradient key={l.gradientId} id={l.gradientId} x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor={l.color} stopOpacity={0.35} />
                  <stop offset="60%" stopColor={l.color} stopOpacity={0.08} />
                  <stop offset="100%" stopColor={l.color} stopOpacity={0} />
                </linearGradient>
              ))}
            </defs>

            <CartesianGrid
              strokeDasharray="3 3"
              stroke="rgba(255,255,255,0.04)"
              vertical={false}
            />

            <XAxis
              dataKey="time"
              stroke="#1e293b"
              tick={{ fill: '#475569', fontSize: 10, fontFamily: 'Rajdhani, sans-serif', fontWeight: 600 }}
              tickLine={false}
              axisLine={false}
            />

            <YAxis
              stroke="#1e293b"
              tick={{ fill: '#475569', fontSize: 10, fontFamily: 'Rajdhani, sans-serif', fontWeight: 600 }}
              tickLine={false}
              axisLine={false}
              tickFormatter={(v) => `${v}%`}
              domain={[0, 100]}
            />

            <Tooltip content={<CustomTooltip />} />

            <Legend
              content={<CustomLegend activeLines={activeLines} toggleLine={toggleLine} />}
            />

            {lines.map(l => (
              activeLines[l.key as keyof typeof activeLines] && (
                <Area
                  key={l.key}
                  type="monotone"
                  dataKey={l.key}
                  name={`${l.name} Risk %`}
                  stroke={l.color}
                  strokeWidth={2.5}
                  fillOpacity={1}
                  fill={`url(#${l.gradientId})`}
                  dot={false}
                  activeDot={{
                    r: 5,
                    fill: l.color,
                    stroke: 'rgba(0,0,0,0.5)',
                    strokeWidth: 2,
                    filter: `drop-shadow(0 0 6px ${l.color})`,
                  }}
                  style={{ filter: `drop-shadow(0 0 4px ${l.color}60)` }}
                />
              )
            ))}
          </AreaChart>
        </ResponsiveContainer>
      </div>

      {/* Bottom Stats Row */}
      <div style={{
        display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)',
        gap: '8px', marginTop: '12px',
      }}>
        {lines.map(l => {
          const latest = chartData[chartData.length - 1];
          const val = (latest as any)[l.key] ?? 0;
          const prev = chartData.length > 1 ? (chartData[chartData.length - 2] as any)[l.key] ?? 0 : val;
          const trend = val > prev ? '↑' : val < prev ? '↓' : '→';
          const trendColor = val > prev ? '#f87171' : val < prev ? '#34d399' : '#94a3b8';

          return (
            <div key={l.key} style={{
              background: `${l.color}08`,
              border: `1px solid ${l.color}20`,
              borderRadius: '12px',
              padding: '10px',
              textAlign: 'center',
            }}>
              <div style={{ color: '#475569', fontSize: '9px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.15em', marginBottom: '4px', fontFamily: 'Orbitron, monospace' }}>
                {l.name}
              </div>
              <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'center', gap: '4px' }}>
                <span style={{ color: l.color, fontSize: '18px', fontWeight: 900, fontFamily: 'Orbitron, monospace', textShadow: `0 0 15px ${l.color}60` }}>
                  {val.toFixed(0)}
                </span>
                <span style={{ color: '#334155', fontSize: '10px' }}>%</span>
                <span style={{ color: trendColor, fontSize: '12px', fontWeight: 700 }}>{trend}</span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}