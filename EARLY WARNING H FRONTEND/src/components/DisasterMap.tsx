import React, { useMemo } from 'react';
import { MapContainer, TileLayer, CircleMarker, Popup } from 'react-leaflet';
import { AlertOctagon, Flame, Droplets, Wind } from 'lucide-react';
import L from 'leaflet';

// Fix for default leaflet icons not loading issue
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

// Fallback initial location (can center dynamically later)
const DEFAULT_CENTER = [28.6139, 77.2090]; 

export default function DisasterMap({ sensors, risks }: { sensors: any, risks: any }) {
  
  // Convert standard Object Dictionary down to map-friendly array
  const mapNodes = useMemo(() => {
    // If no real sensors, render mock zones or empty
    const keys = Object.keys(sensors);
    if(keys.length === 0) {
        return [
          { id: 'mock1', lat: 28.6139, lng: 77.2090, type: 'flood', riskLevel: 'high', riskScore: 0.8, color: '#ef4444', label: 'Processing Live Network...' },
        ];
    }
    
    return keys.map(locId => {
      const s = sensors[locId];
      const r = risks[locId] || {};
      
      const level = r.risk_level || 'safe';
      
      let color = '#10b981'; // safe
      if(level === 'moderate') color = '#f59e0b'; // amber
      if(level === 'high') color = '#f97316'; // orange
      if(level === 'critical') color = '#ef4444'; // red

      // Determine highest sub-risk
      let type = 'unknown';
      if(r.flood_probability > r.landslide_probability && r.flood_probability > r.storm_surge_probability) type = 'flood';
      else if(r.landslide_probability > r.storm_surge_probability) type = 'landslide';
      else if (r.storm_surge_probability) type = 'storm_surge';

      return {
        id: locId,
        lat: 28.6139 + (Math.random()*0.1 - 0.05), // Fake offset if no lat/lon in payload, real systems would stream lat/lon!
        lng: 77.2090 + (Math.random()*0.1 - 0.05), 
        type,
        color,
        label: `Sensor Node ${locId}`,
        data: s,
        risk: r
      };
    });
  }, [sensors, risks]);

  return (
    <div className="w-full h-full relative z-10 bg-[#0A0A0B]">
      <MapContainer 
        center={DEFAULT_CENTER as any} 
        zoom={11} 
        style={{ height: '100%', width: '100%', background: '#0F172A' }}
        zoomControl={false}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/">OSM</a>'
          url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
        />
        
        {mapNodes.map((node: any) => (
          <CircleMarker
            key={node.id}
            center={[node.lat, node.lng]}
            radius={20}
            pathOptions={{
              color: node.color,
              fillColor: node.color,
              fillOpacity: 0.35,
              weight: 2
            }}
          >
            <Popup className="custom-popup bg-slate-900 border-none rounded-xl">
              <div className="p-1 space-y-2 min-w-[200px]">
                <div className="flex items-center gap-2 border-b border-slate-700 pb-2">
                  {node.type === 'flood' ? <Droplets className="w-4 h-4 text-blue-400" /> : 
                   node.type === 'landslide' ? <Flame className="w-4 h-4 text-orange-400" /> :
                   <Wind className="w-4 h-4 text-slate-400" /> }
                  <h4 className="font-bold text-slate-200">{node.label}</h4>
                </div>
                
                {node.risk?.risk_level && (
                    <div className="bg-white/5 rounded-lg p-2 mt-2">
                        <p className="text-xs font-bold text-slate-400 uppercase">AI Threat Level</p>
                        <p className="text-sm font-black" style={{ color: node.color }}>
                            {node.risk.risk_level.toUpperCase()}
                        </p>
                        <p className="text-xs text-slate-400 mt-1">Confidence: {node.risk.confidence*100}%</p>
                    </div>
                )}

                {node.data?.rainfall && (
                    <div className="grid grid-cols-2 gap-2 mt-2 pt-2 border-t border-slate-700">
                        <div>
                            <p className="text-[10px] text-slate-500 uppercase">Rainfall</p>
                            <p className="text-xs text-white font-medium">{node.data.rainfall} mm</p>
                        </div>
                        <div>
                            <p className="text-[10px] text-slate-500 uppercase">River Lvl</p>
                            <p className="text-xs text-white font-medium">{node.data.river_level} m</p>
                        </div>
                    </div>
                )}
              </div>
            </Popup>
          </CircleMarker>
        ))}
      </MapContainer>
      
      {/* Overlay legend */}
      <div className="absolute bottom-6 right-6 z-[1000] bg-black/60 backdrop-blur-md border border-white/10 p-4 rounded-2xl shadow-2xl">
        <h4 className="text-[10px] font-black text-slate-400 mb-3 uppercase tracking-widest">Threat Index</h4>
        <div className="space-y-3">
          <div className="flex items-center gap-3">
            <div className="w-3 h-3 rounded-full bg-red-500 shadow-[0_0_10px_rgba(239,68,68,0.8)]" />
            <span className="text-xs font-medium text-slate-200">Critical</span>
          </div>
          <div className="flex items-center gap-3">
            <div className="w-3 h-3 rounded-full bg-orange-500 shadow-[0_0_10px_rgba(249,115,22,0.8)]" />
            <span className="text-xs font-medium text-slate-200">High Risk</span>
          </div>
          <div className="flex items-center gap-3">
            <div className="w-3 h-3 rounded-full bg-amber-500 shadow-[0_0_10px_rgba(245,158,11,0.8)]" />
            <span className="text-xs font-medium text-slate-200">Moderate</span>
          </div>
          <div className="flex items-center gap-3">
            <div className="w-3 h-3 rounded-full bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.8)]" />
            <span className="text-xs font-medium text-slate-200">Safe</span>
          </div>
        </div>
      </div>
    </div>
  );
}
