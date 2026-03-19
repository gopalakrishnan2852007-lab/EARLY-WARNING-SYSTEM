import React, { useMemo, useState } from 'react';
import { MapContainer, TileLayer, CircleMarker, Popup } from 'react-leaflet';
import { AlertOctagon, Flame, Droplets, Wind, Thermometer, Activity, MapPin, ShieldCheck } from 'lucide-react';
import L from 'leaflet';

// ── Fix default leaflet icons ───────────────────────────────────────────────
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

const DEFAULT_CENTER = [11.1271, 78.6569];

// ── Risk color map ──────────────────────────────────────────────────────────
const RISK_COLORS: Record<string, { color: string; glow: string; label: string }> = {
  critical: { color: '#f87171', glow: 'rgba(248,113,113,0.6)', label: 'Critical' },
  high: { color: '#fb923c', glow: 'rgba(251,146,60,0.6)', label: 'High Risk' },
  moderate: { color: '#fbbf24', glow: 'rgba(251,191,36,0.6)', label: 'Moderate' },
  safe: { color: '#34d399', glow: 'rgba(52,211,153,0.5)', label: 'Safe' },
};

// ── Stat Row for Popup ──────────────────────────────────────────────────────
function StatRow({ label, value, unit }: { label: string; value: any; unit?: string }) {
  return (
    <div style={{
      display: 'flex', justifyContent: 'space-between', alignItems: 'center',
      padding: '6px 0', borderBottom: '1px solid rgba(255,255,255,0.05)',
    }}>
      <span style={{ color: '#475569', fontSize: '10px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em' }}>
        {label}
      </span>
      <span style={{ color: '#e2e8f0', fontSize: '12px', fontWeight: 700, fontFamily: 'JetBrains Mono, monospace' }}>
        {value ?? 'N/A'}{unit || ''}
      </span>
    </div>
  );
}

// ── Risk Bar ────────────────────────────────────────────────────────────────
function RiskBar({ label, value, color }: { label: string; value: number; color: string }) {
  const pct = Math.round(value * 100);
  return (
    <div style={{ marginBottom: '8px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
        <span style={{ color: '#64748b', fontSize: '10px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.1em' }}>
          {label}
        </span>
        <span style={{ color, fontSize: '11px', fontWeight: 900, fontFamily: 'Orbitron, monospace' }}>
          {pct}%
        </span>
      </div>
      <div style={{ height: '4px', background: 'rgba(255,255,255,0.06)', borderRadius: '99px', overflow: 'hidden' }}>
        <div style={{
          height: '100%', width: `${pct}%`,
          background: `linear-gradient(90deg, ${color}aa, ${color})`,
          borderRadius: '99px',
          boxShadow: `0 0 8px ${color}`,
          transition: 'width 0.8s ease',
        }} />
      </div>
    </div>
  );
}

// ── Main Map Component ──────────────────────────────────────────────────────
export default function DisasterMap({
  sensors,
  risks,
  locations = {},
}: {
  sensors: any;
  risks: any;
  locations?: any;
}) {
  const [selectedNode, setSelectedNode] = useState<string | null>(null);

  const mapNodes = useMemo(() => {
    const keys = Object.keys(sensors || {});

    if (keys.length === 0) {
      return [{
        id: 'mock1', lat: 11.1271, lng: 78.6569,
        type: 'flood', riskLevel: 'moderate',
        color: '#fbbf24', glow: 'rgba(251,191,36,0.5)',
        label: 'Chennai Sensor Node',
        data: {}, risk: { risk_level: 'moderate', flood_probability: 0.4, fire_probability: 0.1 }
      }];
    }

    return keys.map(locId => {
      const s = sensors[locId] || {};
      const r = risks?.[locId] || {};
      const loc = locations[locId];

      const level = r.risk_level || 'safe';
      const riskInfo = RISK_COLORS[level] || RISK_COLORS.safe;

      let type = 'unknown';
      if ((r.flood_probability || 0) >= (r.fire_probability || 0)) type = 'flood';
      else type = 'fire';

      const lat = s.latitude || loc?.latitude || (11.1271 + (Math.random() * 1.5 - 0.75));
      const lng = s.longitude || loc?.longitude || (78.6569 + (Math.random() * 1.5 - 0.75));
      const locName = s.name || loc?.name || `Sensor Node ${locId}`;

      return {
        id: locId, lat, lng, type, level,
        color: riskInfo.color,
        glow: riskInfo.glow,
        label: locName,
        data: s,
        risk: r,
      };
    });
  }, [sensors, risks, locations]);

  return (
    <div style={{ width: '100%', height: '100%', position: 'relative', background: '#060608' }}>

      {/* ── Map ── */}
      <MapContainer
        center={DEFAULT_CENTER as any}
        zoom={7}
        style={{ height: '100%', width: '100%' }}
        zoomControl={false}
      >
        {/* Dark CartoDB tile */}
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/">OSM</a>'
          url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
        />

        {mapNodes.map((node: any) => {
          const isCritical = node.level === 'critical';
          const isHigh = node.level === 'high';
          const radius = isCritical ? 26 : isHigh ? 22 : 18;

          return (
            <CircleMarker
              key={node.id}
              center={[node.lat, node.lng]}
              radius={radius}
              pathOptions={{
                color: node.color,
                fillColor: node.color,
                fillOpacity: isCritical ? 0.4 : 0.25,
                weight: isCritical ? 3 : 2,
              }}
              eventHandlers={{ click: () => setSelectedNode(node.id) }}
            >
              <Popup>
                {/* ── Custom Popup ── */}
                <div style={{
                  minWidth: '220px',
                  background: 'linear-gradient(160deg, rgba(10,10,20,0.99), rgba(6,6,15,0.99))',
                  borderRadius: '16px',
                  overflow: 'hidden',
                  fontFamily: 'Rajdhani, sans-serif',
                  border: `1px solid ${node.color}30`,
                  boxShadow: `0 20px 40px rgba(0,0,0,0.8), 0 0 20px ${node.glow}`,
                }}>

                  {/* Header */}
                  <div style={{
                    padding: '12px 14px',
                    background: `linear-gradient(135deg, ${node.color}18, transparent)`,
                    borderBottom: `1px solid ${node.color}20`,
                    display: 'flex', alignItems: 'center', gap: '8px',
                  }}>
                    <div style={{
                      width: '28px', height: '28px', borderRadius: '8px', flexShrink: 0,
                      background: `${node.color}20`,
                      border: `1px solid ${node.color}40`,
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                    }}>
                      {node.type === 'flood'
                        ? <Droplets style={{ width: '14px', height: '14px', color: node.color }} />
                        : <Flame style={{ width: '14px', height: '14px', color: node.color }} />
                      }
                    </div>
                    <div>
                      <div style={{
                        fontFamily: 'Orbitron, monospace', fontWeight: 700,
                        fontSize: '11px', color: '#e2e8f0', letterSpacing: '0.05em',
                      }}>
                        {node.label}
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '4px', marginTop: '2px' }}>
                        <div style={{
                          width: '6px', height: '6px', borderRadius: '50%',
                          background: node.color,
                          boxShadow: `0 0 6px ${node.color}`,
                          animation: isCritical ? 'pulse 1s infinite' : 'none',
                        }} />
                        <span style={{
                          fontSize: '10px', fontWeight: 700, color: node.color,
                          textTransform: 'uppercase', letterSpacing: '0.15em',
                          fontFamily: 'Orbitron, monospace',
                        }}>
                          {node.level}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Risk Bars */}
                  <div style={{ padding: '12px 14px', borderBottom: `1px solid rgba(255,255,255,0.05)` }}>
                    <div style={{ fontSize: '9px', color: '#334155', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.2em', marginBottom: '8px' }}>
                      Risk Analysis
                    </div>
                    <RiskBar label="Flood" value={node.risk?.flood_probability || 0} color="#60a5fa" />
                    <RiskBar label="Fire" value={node.risk?.fire_probability || 0} color="#f87171" />
                  </div>

                  {/* Sensor Data */}
                  <div style={{ padding: '10px 14px' }}>
                    <div style={{ fontSize: '9px', color: '#334155', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.2em', marginBottom: '6px' }}>
                      Live Readings
                    </div>
                    <StatRow label="Temperature" value={node.data?.temperature?.toFixed(1)} unit="°C" />
                    <StatRow label="Humidity" value={node.data?.humidity?.toFixed(0)} unit="%" />
                    <StatRow label="Rainfall" value={node.data?.rainfall?.toFixed(1)} unit=" mm/h" />
                    <StatRow label="Wind Speed" value={node.data?.wind_speed?.toFixed(1)} unit=" km/h" />
                    {node.data?.gas && <StatRow label="Gas/Smoke" value={node.data.gas?.toFixed(0)} unit=" ppm" />}
                    {node.data?.water_level && <StatRow label="Water Lvl" value={node.data.water_level?.toFixed(0)} unit="%" />}
                  </div>

                  {/* Footer */}
                  <div style={{
                    padding: '8px 14px',
                    background: 'rgba(0,0,0,0.3)',
                    borderTop: '1px solid rgba(255,255,255,0.04)',
                    fontSize: '9px', color: '#1e293b',
                    fontFamily: 'JetBrains Mono, monospace',
                    textAlign: 'center',
                    letterSpacing: '0.1em',
                  }}>
                    SENTINELALERT · LIVE DATA
                  </div>
                </div>
              </Popup>
            </CircleMarker>
          );
        })}
      </MapContainer>

      {/* ── Radar Overlay ── */}
      <div className="radar-overlay-container">
        <div className="radar-sweep" />
        <div className="map-scanlines" />
      </div>

      {/* ── Top Label ── */}
      <div style={{
        position: 'absolute', top: '16px', left: '16px', zIndex: 1000,
        background: 'linear-gradient(135deg, rgba(10,10,20,0.95), rgba(6,6,15,0.95))',
        backdropFilter: 'blur(20px)',
        border: '1px solid rgba(255,255,255,0.07)',
        borderRadius: '14px',
        padding: '10px 16px',
        boxShadow: '0 20px 40px rgba(0,0,0,0.5)',
      }}>
        <div style={{
          fontFamily: 'Orbitron, monospace', fontWeight: 900,
          fontSize: '11px', color: '#fff', letterSpacing: '0.1em',
          marginBottom: '2px',
        }}>
          Sentinel<span style={{ color: '#60a5fa' }}>Alert</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
          <div style={{ width: '5px', height: '5px', borderRadius: '50%', background: '#34d399', animation: 'pulse 2s infinite', boxShadow: '0 0 6px #34d399' }} />
          <span style={{ color: '#34d399', fontSize: '9px', fontWeight: 700, letterSpacing: '0.2em', fontFamily: 'Orbitron, monospace' }}>
            LIVE · TAMIL NADU
          </span>
        </div>
      </div>

      {/* ── Legend ── */}
      <div style={{
        position: 'absolute', bottom: '24px', right: '16px', zIndex: 1000,
        background: 'linear-gradient(135deg, rgba(10,10,20,0.97), rgba(6,6,15,0.97))',
        backdropFilter: 'blur(20px)',
        border: '1px solid rgba(255,255,255,0.07)',
        borderRadius: '16px',
        padding: '14px 16px',
        boxShadow: '0 20px 40px rgba(0,0,0,0.6)',
        minWidth: '140px',
      }}>
        <div style={{
          fontFamily: 'Orbitron, monospace', fontWeight: 700,
          fontSize: '9px', color: '#334155',
          letterSpacing: '0.2em', textTransform: 'uppercase',
          marginBottom: '12px',
        }}>
          Threat Index
        </div>

        {Object.entries(RISK_COLORS).map(([level, info]) => (
          <div key={level} style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '10px' }}>
            <div style={{
              width: '10px', height: '10px', borderRadius: '50%', flexShrink: 0,
              background: info.color,
              boxShadow: `0 0 10px ${info.glow}`,
            }} />
            <span style={{
              fontSize: '11px', fontWeight: 600, color: '#94a3b8',
              fontFamily: 'Rajdhani, sans-serif',
              letterSpacing: '0.05em',
            }}>
              {info.label}
            </span>
          </div>
        ))}

        {/* Node count */}
        <div style={{
          marginTop: '12px', paddingTop: '10px',
          borderTop: '1px solid rgba(255,255,255,0.05)',
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        }}>
          <span style={{ color: '#334155', fontSize: '10px', fontFamily: 'Orbitron, monospace' }}>NODES</span>
          <span style={{ color: '#60a5fa', fontSize: '13px', fontWeight: 900, fontFamily: 'Orbitron, monospace' }}>
            {mapNodes.length}
          </span>
        </div>
      </div>

      {/* ── Node Stats ── */}
      <div style={{
        position: 'absolute', bottom: '24px', left: '16px', zIndex: 1000,
        display: 'flex', flexDirection: 'column', gap: '8px',
      }}>
        {['critical', 'high'].map(level => {
          const count = mapNodes.filter((n: any) => n.level === level).length;
          if (count === 0) return null;
          const info = RISK_COLORS[level];
          return (
            <div key={level} style={{
              background: `${info.color}12`,
              border: `1px solid ${info.color}30`,
              backdropFilter: 'blur(10px)',
              borderRadius: '10px',
              padding: '6px 12px',
              display: 'flex', alignItems: 'center', gap: '8px',
              boxShadow: `0 0 15px ${info.glow}`,
            }}>
              <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: info.color, animation: 'pulse 1s infinite' }} />
              <span style={{ fontFamily: 'Orbitron, monospace', fontSize: '9px', fontWeight: 700, color: info.color, letterSpacing: '0.15em' }}>
                {count} {level.toUpperCase()} ZONE{count > 1 ? 'S' : ''}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}