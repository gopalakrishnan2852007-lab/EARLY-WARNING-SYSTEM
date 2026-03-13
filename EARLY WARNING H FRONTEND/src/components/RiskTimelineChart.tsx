import React from 'react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

const data = [
  { time: '00:00', flood: 20, fire: 10 },
  { time: '04:00', flood: 35, fire: 15 },
  { time: '08:00', flood: 45, fire: 30 },
  { time: '12:00', flood: 55, fire: 65 },
  { time: '16:00', flood: 85, fire: 80 },
  { time: '20:00', flood: 70, fire: 40 },
  { time: '24:00', flood: 50, fire: 20 },
];

export default function RiskTimelineChart() {
  return (
    <div className="w-full h-64 mt-4">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart
          data={data}
          margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
        >
          <defs>
            <linearGradient id="colorFlood" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.8}/>
              <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
            </linearGradient>
            <linearGradient id="colorFire" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#ef4444" stopOpacity={0.8}/>
              <stop offset="95%" stopColor="#ef4444" stopOpacity={0}/>
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="#334155" opacity={0.5} vertical={false} />
          <XAxis dataKey="time" stroke="#94a3b8" fontSize={12} tickLine={false} axisLine={false} />
          <YAxis stroke="#94a3b8" fontSize={12} tickLine={false} axisLine={false} />
          <Tooltip 
            contentStyle={{ backgroundColor: '#1e293b', borderColor: '#334155', borderRadius: '8px', color: '#f8fafc' }}
            itemStyle={{ color: '#f8fafc' }}
          />
          <Area type="monotone" dataKey="flood" stroke="#3b82f6" fillOpacity={1} fill="url(#colorFlood)" name="Flood Risk %" />
          <Area type="monotone" dataKey="fire" stroke="#ef4444" fillOpacity={1} fill="url(#colorFire)" name="Fire Risk %" />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
