import React from 'react';
import { motion } from 'framer-motion';
import { AlertTriangle, Radio } from 'lucide-react';

export default function NewsTicker({ alerts }: { alerts: any[] }) {
  if (!alerts || alerts.length === 0) {
    return (
      <div className="h-8 bg-emerald-900/20 border-b border-emerald-500/20 flex items-center overflow-hidden shrink-0">
        <div className="px-4 bg-emerald-600 h-full flex items-center z-10 font-bold text-[10px] uppercase tracking-widest shrink-0 text-white shadow-[0_0_15px_rgba(16,185,129,0.8)] gap-2">
          <Radio className="w-3 h-3 animate-pulse" />
          SYSTEM STATUS
        </div>
        <div className="flex-1 flex items-center px-4">
            <span className="text-[10px] text-emerald-400 font-medium tracking-wide uppercase">All global environmental sensors operating at nominal levels. No active threats detected in network.</span>
        </div>
      </div>
    );
  }

  // Duplicate alerts to make the marquee continuous
  const tickerItems = [...alerts, ...alerts, ...alerts];

  return (
    <div className="h-8 bg-red-900/30 border-b border-red-500/30 flex items-center overflow-hidden shrink-0 relative">
      <div className="px-4 bg-red-600 h-full flex items-center z-10 font-bold text-[10px] uppercase tracking-widest shrink-0 text-white shadow-[0_0_20px_rgba(220,38,38,0.9)] gap-2">
        <Radio className="w-3 h-3 animate-pulse text-white" />
        LIVE THREAT FEED
      </div>
      
      {/* Gradient mask for smooth fade in/out */}
      <div className="absolute left-32 top-0 bottom-0 w-16 bg-gradient-to-r from-red-900/80 to-transparent z-10 pointer-events-none" />
      <div className="absolute right-0 top-0 bottom-0 w-16 bg-gradient-to-l from-[#0A0A0B] to-transparent z-10 pointer-events-none" />

      <div className="flex-1 overflow-hidden relative h-full flex items-center ml-4">
        <motion.div 
          initial={{ x: "0%" }}
          animate={{ x: "-50%" }}
          transition={{ repeat: Infinity, ease: "linear", duration: Math.max(20, alerts.length * 5) }}
          className="whitespace-nowrap flex items-center gap-12"
        >
          {tickerItems.map((a, i) => (
            <span key={i} className="text-[11px] font-bold text-red-100 flex items-center gap-2 tracking-wide">
              <AlertTriangle className={`w-3.5 h-3.5 ${a.severity === 'CRITICAL' ? 'text-red-400 animate-pulse' : 'text-orange-400'}`} />
              <span className={a.severity === 'CRITICAL' ? 'text-red-400 uppercase' : 'text-orange-400 uppercase'}>{a.severity}:</span> 
              {a.message}
            </span>
          ))}
        </motion.div>
      </div>
    </div>
  );
}
