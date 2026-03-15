import React from 'react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

interface TimelineData {
  time: string;
  flood?: number;
  landslide?: number;
  surge?: number;
}

export default function RiskTimelineChart({ data }: { data: TimelineData[] }) {

  // Generate realistic-looking initial forecast data for Tamil Nadu bounds
  const mockData = [
    { time: 'T-12:00', flood: 15, landslide: 5, surge: 10 },
    { time: 'T-10:00', flood: 18, landslide: 8, surge: 12 },
    { time: 'T-08:00', flood: 20, landslide: 10, surge: 15 },
    { time: 'T-06:00', flood: 25, landslide: 12, surge: 20 },
    { time: 'T-04:00', flood: 35, landslide: 15, surge: 25 },
    { time: 'T-02:00', flood: 40, landslide: 18, surge: 30 },
    { time: 'Now', flood: 45, landslide: 20, surge: 35 },
  ];

  const chartData = data && data.length > 0 ? data : mockData;

  return (
    <div className="w-full h-72">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart
          data={chartData}
          margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
        >
          <defs>
            <linearGradient id="colorFlood" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.5} />
              <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
            </linearGradient>
            <linearGradient id="colorLandslide" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.5} />
              <stop offset="95%" stopColor="#f59e0b" stopOpacity={0} />
            </linearGradient>
            <linearGradient id="colorSurge" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.5} />
              <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="#ffffff" opacity={0.05} vertical={false} />
          <XAxis dataKey="time" stroke="#64748b" fontSize={10} tickLine={false} axisLine={false} />
          <YAxis stroke="#64748b" fontSize={10} tickLine={false} axisLine={false} />
          <Tooltip
            contentStyle={{ backgroundColor: 'rgba(15, 15, 18, 0.9)', backdropFilter: 'blur(10px)', borderColor: 'rgba(255,255,255,0.1)', borderRadius: '12px', color: '#f8fafc', boxShadow: '0 10px 25px rgba(0,0,0,0.5)' }}
            itemStyle={{ color: '#f8fafc', fontSize: '13px', fontWeight: 'bold' }}
            labelStyle={{ color: '#94a3b8', fontSize: '11px', textTransform: 'uppercase', marginBottom: '8px' }}
          />
          <Area type="monotone" dataKey="flood" stroke="#3b82f6" strokeWidth={3} fillOpacity={1} fill="url(#colorFlood)" name="Flood Risk %" />
          <Area type="monotone" dataKey="landslide" stroke="#f59e0b" strokeWidth={3} fillOpacity={1} fill="url(#colorLandslide)" name="Landslide Risk %" />
          <Area type="monotone" dataKey="surge" stroke="#8b5cf6" strokeWidth={3} fillOpacity={1} fill="url(#colorSurge)" name="Storm Surge %" />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
