import React from 'react';
import { MapContainer, TileLayer, CircleMarker, Popup, useMap } from 'react-leaflet';
import { AlertOctagon, Flame, Droplets } from 'lucide-react';
import L from 'leaflet';

// Fix for default leaflet icons not loading issue
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

// Mock risk zones
const riskZones = [
  { id: 1, lat: 28.6139, lng: 77.2090, type: 'flood', risk: 'high', radius: 4000, color: 'var(--color-orange-high)', label: 'Yamuna River Basin' },
  { id: 2, lat: 28.5355, lng: 77.3910, type: 'fire', risk: 'critical', radius: 2500, color: 'var(--color-red-crit)', label: 'City Forest Reserve' },
  { id: 3, lat: 28.7041, lng: 77.1025, type: 'flood', risk: 'moderate', radius: 3000, color: 'var(--color-yellow-mod)', label: 'North Sector' },
];

export default function DisasterMap() {
  return (
    <div className="w-full h-full relative z-10">
      <MapContainer 
        center={[28.6139, 77.2090]} 
        zoom={11} 
        style={{ height: '100%', width: '100%', background: '#0F172A' }}
        zoomControl={false}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/">OSM</a>'
          url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
        />
        
        {riskZones.map(zone => (
          <CircleMarker
            key={zone.id}
            center={[zone.lat, zone.lng]}
            radius={zone.radius / 100} // scale down for UI
            pathOptions={{
              color: zone.color,
              fillColor: zone.color,
              fillOpacity: 0.3,
              weight: 2
            }}
          >
            <Popup className="custom-popup">
              <div className="p-1">
                <div className="flex items-center gap-2 mb-2">
                  {zone.type === 'flood' ? <Droplets className="w-4 h-4 text-blue-400" /> : <Flame className="w-4 h-4 text-red-400" />}
                  <h4 className="font-bold text-slate-800">{zone.label}</h4>
                </div>
                <p className="text-sm font-medium text-slate-600">
                  Risk Level: <span className="uppercase" style={{ color: zone.color }}>{zone.risk}</span>
                </p>
                <p className="text-xs text-slate-500 mt-1">AI Prediction Confidence: 89%</p>
              </div>
            </Popup>
          </CircleMarker>
        ))}
      </MapContainer>
      
      {/* Overlay legend */}
      <div className="absolute bottom-4 right-4 z-[1000] bg-[#0F0F12]/90 backdrop-blur border border-white/10 p-3 rounded-xl shadow-lg">
        <h4 className="text-xs font-bold text-slate-400 mb-2 uppercase tracking-wider">Risk Levels</h4>
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-red-500 opacity-80" />
            <span className="text-xs text-slate-300">Critical (Fire)</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-orange-500 opacity-80" />
            <span className="text-xs text-slate-300">High (Flood)</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-amber-500 opacity-80" />
            <span className="text-xs text-slate-300">Moderate</span>
          </div>
        </div>
      </div>
    </div>
  );
}
