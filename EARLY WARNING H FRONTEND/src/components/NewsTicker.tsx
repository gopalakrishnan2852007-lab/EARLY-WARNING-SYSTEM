import React from 'react';
import { motion } from 'framer-motion';
import { AlertTriangle, Radio, ShieldCheck, Zap } from 'lucide-react';

export default function NewsTicker({ alerts }: { alerts: any[] }) {

  // ── Safe State ────────────────────────────────────────────────────────────
  if (!alerts || alerts.length === 0) {
    return (
      <div style={{
        height: '32px',
        display: 'flex',
        alignItems: 'center',
        overflow: 'hidden',
        flexShrink: 0,
        position: 'relative',
        background: 'linear-gradient(90deg, rgba(16,185,129,0.08), rgba(0,0,0,0))',
        borderBottom: '1px solid rgba(16,185,129,0.15)',
      }}>
        {/* Label */}
        <div style={{
          padding: '0 16px',
          height: '100%',
          display: 'flex',
          alignItems: 'center',
          gap: '6px',
          flexShrink: 0,
          background: 'linear-gradient(135deg, rgba(16,185,129,0.9), rgba(5,150,105,0.9))',
          backdropFilter: 'blur(10px)',
          boxShadow: '0 0 20px rgba(16,185,129,0.4), 4px 0 15px rgba(16,185,129,0.2)',
          zIndex: 10,
        }}>
          <ShieldCheck style={{ width: '11px', height: '11px', color: '#fff' }} />
          <span style={{
            fontFamily: 'Orbitron, monospace',
            fontWeight: 700,
            fontSize: '9px',
            letterSpacing: '0.2em',
            textTransform: 'uppercase',
            color: '#fff',
            whiteSpace: 'nowrap',
          }}>
            SYSTEM STATUS
          </span>
        </div>

        {/* Fade edge */}
        <div style={{
          position: 'absolute', left: '120px', top: 0, bottom: 0, width: '40px',
          background: 'linear-gradient(90deg, rgba(16,185,129,0.08), transparent)',
          pointerEvents: 'none', zIndex: 9,
        }} />

        {/* Message */}
        <div style={{ flex: 1, display: 'flex', alignItems: 'center', padding: '0 16px', overflow: 'hidden' }}>
          <span style={{
            fontFamily: 'Rajdhani, sans-serif',
            fontSize: '11px',
            fontWeight: 600,
            color: '#34d399',
            letterSpacing: '0.05em',
            textTransform: 'uppercase',
            whiteSpace: 'nowrap',
          }}>
            ✅ All Tamil Nadu environmental sensors operating normally · No active threats detected · SentinelAlert monitoring 5 locations
          </span>
        </div>

        {/* Right fade */}
        <div style={{
          position: 'absolute', right: 0, top: 0, bottom: 0, width: '60px',
          background: 'linear-gradient(270deg, #060608, transparent)',
          pointerEvents: 'none', zIndex: 9,
        }} />
      </div>
    );
  }

  // ── Active Alert State ────────────────────────────────────────────────────
  const hasCritical = alerts.some(a => a.severity === 'CRITICAL');
  const tickerItems = [...alerts, ...alerts, ...alerts];

  return (
    <div style={{
      height: '32px',
      display: 'flex',
      alignItems: 'center',
      overflow: 'hidden',
      flexShrink: 0,
      position: 'relative',
      background: hasCritical
        ? 'linear-gradient(90deg, rgba(127,29,29,0.3), rgba(239,68,68,0.05), rgba(0,0,0,0))'
        : 'linear-gradient(90deg, rgba(120,53,15,0.3), rgba(245,158,11,0.05), rgba(0,0,0,0))',
      borderBottom: hasCritical
        ? '1px solid rgba(239,68,68,0.25)'
        : '1px solid rgba(245,158,11,0.2)',
      animation: hasCritical ? 'alertFlash 2s ease-in-out infinite' : 'none',
    }}>

      {/* ── Label Badge ── */}
      <div style={{
        padding: '0 14px',
        height: '100%',
        display: 'flex',
        alignItems: 'center',
        gap: '6px',
        flexShrink: 0,
        zIndex: 10,
        background: hasCritical
          ? 'linear-gradient(135deg, rgba(220,38,38,0.95), rgba(153,27,27,0.95))'
          : 'linear-gradient(135deg, rgba(217,119,6,0.95), rgba(180,83,9,0.95))',
        backdropFilter: 'blur(10px)',
        boxShadow: hasCritical
          ? '0 0 20px rgba(220,38,38,0.6), 4px 0 20px rgba(220,38,38,0.3)'
          : '0 0 20px rgba(217,119,6,0.6), 4px 0 20px rgba(217,119,6,0.3)',
      }}>
        {hasCritical
          ? <AlertTriangle style={{ width: '11px', height: '11px', color: '#fff', animation: 'pulse 1s infinite' }} />
          : <Radio style={{ width: '11px', height: '11px', color: '#fff', animation: 'pulse 2s infinite' }} />
        }
        <span style={{
          fontFamily: 'Orbitron, monospace',
          fontWeight: 900,
          fontSize: '9px',
          letterSpacing: '0.2em',
          textTransform: 'uppercase',
          color: '#fff',
          whiteSpace: 'nowrap',
        }}>
          {hasCritical ? '🚨 CRITICAL' : '⚠️ LIVE THREATS'}
        </span>
      </div>

      {/* Left fade */}
      <div style={{
        position: 'absolute',
        left: '130px', top: 0, bottom: 0, width: '30px',
        background: hasCritical
          ? 'linear-gradient(90deg, rgba(127,29,29,0.5), transparent)'
          : 'linear-gradient(90deg, rgba(120,53,15,0.4), transparent)',
        pointerEvents: 'none', zIndex: 9,
      }} />

      {/* ── Scrolling Ticker ── */}
      <div style={{ flex: 1, overflow: 'hidden', position: 'relative', height: '100%', display: 'flex', alignItems: 'center' }}>
        <motion.div
          initial={{ x: '0%' }}
          animate={{ x: '-50%' }}
          transition={{
            repeat: Infinity,
            ease: 'linear',
            duration: Math.max(25, alerts.length * 8),
          }}
          style={{
            whiteSpace: 'nowrap',
            display: 'flex',
            alignItems: 'center',
            gap: '0',
          }}
        >
          {tickerItems.map((a, i) => (
            <span key={i} style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              padding: '0 24px',
              borderRight: '1px solid rgba(255,255,255,0.06)',
            }}>
              {/* Severity dot */}
              <span style={{
                width: '6px', height: '6px', borderRadius: '50%', flexShrink: 0,
                background: a.severity === 'CRITICAL' ? '#f87171' : a.severity === 'WARNING' ? '#fbbf24' : '#60a5fa',
                boxShadow: `0 0 8px ${a.severity === 'CRITICAL' ? '#f87171' : a.severity === 'WARNING' ? '#fbbf24' : '#60a5fa'}`,
                animation: a.severity === 'CRITICAL' ? 'pulse 1s infinite' : 'none',
              }} />

              {/* Severity label */}
              <span style={{
                fontFamily: 'Orbitron, monospace',
                fontWeight: 700,
                fontSize: '9px',
                letterSpacing: '0.15em',
                textTransform: 'uppercase',
                color: a.severity === 'CRITICAL' ? '#f87171' : a.severity === 'WARNING' ? '#fbbf24' : '#60a5fa',
                flexShrink: 0,
              }}>
                {a.severity}
              </span>

              {/* Divider */}
              <span style={{ color: 'rgba(255,255,255,0.15)', fontSize: '10px' }}>·</span>

              {/* Message */}
              <span style={{
                fontFamily: 'Rajdhani, sans-serif',
                fontWeight: 600,
                fontSize: '11px',
                color: a.severity === 'CRITICAL' ? '#fca5a5' : a.severity === 'WARNING' ? '#fde68a' : '#bfdbfe',
                letterSpacing: '0.03em',
              }}>
                {a.message}
              </span>

              {/* Timestamp */}
              {a.timestamp && (
                <>
                  <span style={{ color: 'rgba(255,255,255,0.1)', fontSize: '10px' }}>·</span>
                  <span style={{
                    fontFamily: 'JetBrains Mono, monospace',
                    fontSize: '9px',
                    color: '#334155',
                    flexShrink: 0,
                  }}>
                    {new Date(a.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </>
              )}

              {/* Separator icon */}
              <Zap style={{ width: '8px', height: '8px', color: 'rgba(255,255,255,0.1)', marginLeft: '4px', flexShrink: 0 }} />
            </span>
          ))}
        </motion.div>
      </div>

      {/* Right fade */}
      <div style={{
        position: 'absolute', right: 0, top: 0, bottom: 0, width: '80px',
        background: 'linear-gradient(270deg, #060608 30%, transparent)',
        pointerEvents: 'none', zIndex: 9,
      }} />

      {/* Alert count badge */}
      <div style={{
        position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)',
        zIndex: 10,
        background: hasCritical ? 'rgba(239,68,68,0.15)' : 'rgba(245,158,11,0.1)',
        border: hasCritical ? '1px solid rgba(239,68,68,0.3)' : '1px solid rgba(245,158,11,0.2)',
        borderRadius: '99px',
        padding: '1px 8px',
        display: 'flex', alignItems: 'center', gap: '4px',
      }}>
        <span style={{
          fontFamily: 'Orbitron, monospace',
          fontSize: '9px',
          fontWeight: 700,
          color: hasCritical ? '#f87171' : '#fbbf24',
          letterSpacing: '0.1em',
        }}>
          {alerts.length} ACTIVE
        </span>
      </div>
    </div>
  );
}
