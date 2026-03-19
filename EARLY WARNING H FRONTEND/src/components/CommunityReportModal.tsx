import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FileWarning, X, Camera, MapPin, UploadCloud, CheckCircle2, AlertTriangle, Flame, Droplets, Wind, Zap } from 'lucide-react';

const API = "https://early-warning-system-fh1y.onrender.com";

// ── Incident Types ──────────────────────────────────────────────────────────
const INCIDENT_TYPES = [
  { id: 'flood', label: 'Flood', icon: Droplets, color: '#60a5fa', glow: 'rgba(96,165,250,0.3)' },
  { id: 'fire', label: 'Fire', icon: Flame, color: '#f87171', glow: 'rgba(248,113,113,0.3)' },
  { id: 'landslide', label: 'Landslide', icon: AlertTriangle, color: '#fbbf24', glow: 'rgba(251,191,36,0.3)' },
  { id: 'smoke', label: 'Smoke', icon: Wind, color: '#c084fc', glow: 'rgba(192,132,252,0.3)' },
];

export default function CommunityReportModal({
  isOpen,
  onClose,
}: {
  isOpen: boolean;
  onClose: () => void;
}) {
  const [reportType, setReportType] = useState('flood');
  const [status, setStatus] = useState<'idle' | 'submitting' | 'success' | 'error'>('idle');
  const [location, setLocation] = useState('');
  const [details, setDetails] = useState('');
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [gpsLoading, setGpsLoading] = useState(false);

  const selectedType = INCIDENT_TYPES.find(t => t.id === reportType) || INCIDENT_TYPES[0];

  const handleGPS = () => {
    if (!('geolocation' in navigator)) {
      alert('Geolocation not supported by your browser.');
      return;
    }
    setGpsLoading(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setLocation(`${pos.coords.latitude.toFixed(4)}, ${pos.coords.longitude.toFixed(4)}`);
        setGpsLoading(false);
      },
      () => {
        alert('Could not fetch location. Check permissions.');
        setGpsLoading(false);
      }
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatus('submitting');
    try {
      const formData = new FormData();
      formData.append('type', reportType);
      formData.append('location', location);
      formData.append('details', details);
      if (imageFile) formData.append('image', imageFile);

      const res = await fetch(`${API}/api/reports`, { method: 'POST', body: formData });
      if (!res.ok) throw new Error('Backend rejected report');

      setStatus('success');
      setTimeout(() => {
        setStatus('idle');
        onClose();
        setLocation('');
        setDetails('');
        setImageFile(null);
      }, 2500);
    } catch (err) {
      console.error(err);
      setStatus('error');
      setTimeout(() => setStatus('idle'), 3000);
    }
  };

  if (!isOpen) return null;

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 200,
      overflowY: 'auto', padding: '16px',
      display: 'flex', justifyContent: 'center', alignItems: 'flex-start',
    }}>
      {/* Backdrop */}
      <div
        onClick={onClose}
        style={{
          position: 'fixed', inset: 0,
          background: 'rgba(0,0,0,0.75)',
          backdropFilter: 'blur(12px)',
        }}
      />

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, scale: 0.94, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.94, y: 20 }}
            transition={{ duration: 0.3, ease: [0.23, 1, 0.32, 1] }}
            style={{
              width: '100%', maxWidth: '480px',
              borderRadius: '24px', overflow: 'hidden',
              position: 'relative', zIndex: 10,
              margin: 'auto',
              marginTop: '40px',
              marginBottom: '40px',
              background: 'linear-gradient(160deg, rgba(10,10,20,0.99), rgba(6,6,15,0.99))',
              border: `1px solid ${selectedType.color}25`,
              boxShadow: `0 40px 80px rgba(0,0,0,0.8), 0 0 40px ${selectedType.glow}`,
              fontFamily: 'Rajdhani, sans-serif',
            }}
          >

            {/* ── Header ── */}
            <div style={{
              padding: '20px 24px',
              background: `linear-gradient(135deg, ${selectedType.color}12, transparent)`,
              borderBottom: `1px solid ${selectedType.color}20`,
              display: 'flex', justifyContent: 'space-between', alignItems: 'center',
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <div style={{
                  width: '42px', height: '42px', borderRadius: '14px',
                  background: `${selectedType.color}18`,
                  border: `1px solid ${selectedType.color}40`,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  boxShadow: `0 0 20px ${selectedType.glow}`,
                }}>
                  <selectedType.icon style={{ width: '20px', height: '20px', color: selectedType.color }} />
                </div>
                <div>
                  <h2 style={{
                    fontFamily: 'Orbitron, monospace', fontWeight: 900,
                    fontSize: '15px', color: '#fff', letterSpacing: '0.05em',
                  }}>
                    Community Report
                  </h2>
                  <p style={{ color: '#475569', fontSize: '11px', fontWeight: 600, letterSpacing: '0.05em', marginTop: '2px' }}>
                    SentinelAlert · Alert Authorities
                  </p>
                </div>
              </div>

              <button
                onClick={onClose}
                style={{
                  width: '32px', height: '32px', borderRadius: '10px',
                  background: 'rgba(255,255,255,0.05)',
                  border: '1px solid rgba(255,255,255,0.08)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  cursor: 'pointer', color: '#475569',
                }}
              >
                <X style={{ width: '16px', height: '16px' }} />
              </button>
            </div>

            {/* ── Success State ── */}
            {status === 'success' ? (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                style={{ padding: '48px 24px', textAlign: 'center' }}
              >
                <div style={{
                  width: '72px', height: '72px', borderRadius: '50%',
                  background: 'rgba(52,211,153,0.12)',
                  border: '2px solid rgba(52,211,153,0.4)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  margin: '0 auto 20px',
                  boxShadow: '0 0 30px rgba(52,211,153,0.3)',
                  animation: 'pulse 2s infinite',
                }}>
                  <CheckCircle2 style={{ width: '36px', height: '36px', color: '#34d399' }} />
                </div>
                <h3 style={{
                  fontFamily: 'Orbitron, monospace', fontWeight: 900,
                  fontSize: '18px', color: '#fff', marginBottom: '12px',
                  letterSpacing: '0.05em',
                }}>
                  Report Submitted!
                </h3>
                <p style={{ color: '#64748b', fontSize: '13px', lineHeight: '1.6' }}>
                  🚨 Disaster report submitted to SentinelAlert network.<br />
                  Authorities have been notified via SMS and call.
                </p>
              </motion.div>
            ) : (

              /* ── Form ── */
              <form onSubmit={handleSubmit} style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '20px' }}>

                {/* Incident Type */}
                <div>
                  <label style={{ display: 'block', fontSize: '11px', fontWeight: 700, color: '#475569', textTransform: 'uppercase', letterSpacing: '0.15em', marginBottom: '10px', fontFamily: 'Orbitron, monospace' }}>
                    Incident Type
                  </label>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '8px' }}>
                    {INCIDENT_TYPES.map(type => {
                      const isSelected = reportType === type.id;
                      return (
                        <button
                          key={type.id}
                          type="button"
                          onClick={() => setReportType(type.id)}
                          style={{
                            padding: '10px 6px',
                            borderRadius: '12px',
                            border: `1px solid ${isSelected ? type.color + '60' : 'rgba(255,255,255,0.06)'}`,
                            background: isSelected ? `${type.color}12` : 'rgba(255,255,255,0.02)',
                            cursor: 'pointer',
                            display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '5px',
                            transition: 'all 0.2s ease',
                            boxShadow: isSelected ? `0 0 15px ${type.glow}` : 'none',
                          }}
                        >
                          <type.icon style={{ width: '18px', height: '18px', color: isSelected ? type.color : '#334155' }} />
                          <span style={{
                            fontSize: '10px', fontWeight: 700, letterSpacing: '0.05em',
                            color: isSelected ? type.color : '#334155',
                            fontFamily: 'Orbitron, monospace',
                          }}>
                            {type.label}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Location */}
                <div>
                  <label style={{ display: 'block', fontSize: '11px', fontWeight: 700, color: '#475569', textTransform: 'uppercase', letterSpacing: '0.15em', marginBottom: '10px', fontFamily: 'Orbitron, monospace' }}>
                    Location
                  </label>
                  <div style={{ position: 'relative' }}>
                    <MapPin style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', width: '15px', height: '15px', color: '#334155' }} />
                    <input
                      required
                      type="text"
                      value={location}
                      onChange={e => setLocation(e.target.value)}
                      placeholder="Enter street, landmark or coordinates..."
                      style={{
                        width: '100%',
                        background: 'rgba(255,255,255,0.04)',
                        border: '1px solid rgba(255,255,255,0.08)',
                        borderRadius: '12px',
                        padding: '12px 90px 12px 36px',
                        fontSize: '13px', color: '#e2e8f0',
                        outline: 'none', fontFamily: 'Rajdhani, sans-serif',
                      }}
                      onFocus={e => e.target.style.borderColor = `${selectedType.color}50`}
                      onBlur={e => e.target.style.borderColor = 'rgba(255,255,255,0.08)'}
                    />
                    <button
                      type="button"
                      onClick={handleGPS}
                      disabled={gpsLoading}
                      style={{
                        position: 'absolute', right: '8px', top: '50%', transform: 'translateY(-50%)',
                        padding: '4px 10px', borderRadius: '8px',
                        background: 'rgba(96,165,250,0.1)',
                        border: '1px solid rgba(96,165,250,0.2)',
                        color: '#60a5fa', fontSize: '10px', fontWeight: 700,
                        cursor: 'pointer', fontFamily: 'Orbitron, monospace',
                        letterSpacing: '0.05em',
                      }}
                    >
                      {gpsLoading ? '...' : 'GPS'}
                    </button>
                  </div>
                </div>

                {/* Image Upload */}
                <div>
                  <label style={{ display: 'block', fontSize: '11px', fontWeight: 700, color: '#475569', textTransform: 'uppercase', letterSpacing: '0.15em', marginBottom: '10px', fontFamily: 'Orbitron, monospace' }}>
                    Media Evidence
                  </label>
                  <label style={{
                    display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                    padding: '28px', borderRadius: '16px', cursor: 'pointer',
                    border: `2px dashed ${imageFile ? selectedType.color + '60' : 'rgba(255,255,255,0.08)'}`,
                    background: imageFile ? `${selectedType.color}06` : 'rgba(255,255,255,0.02)',
                    transition: 'all 0.2s',
                    position: 'relative',
                  }}>
                    <input
                      type="file"
                      accept="image/*,video/*"
                      style={{ position: 'absolute', inset: 0, opacity: 0, cursor: 'pointer' }}
                      onChange={e => {
                        if (e.target.files?.[0]) setImageFile(e.target.files[0]);
                      }}
                    />
                    {imageFile ? (
                      <>
                        <CheckCircle2 style={{ width: '28px', height: '28px', color: selectedType.color, marginBottom: '8px' }} />
                        <span style={{ fontSize: '12px', fontWeight: 700, color: selectedType.color }}>{imageFile.name}</span>
                        <span style={{ fontSize: '10px', color: '#334155', marginTop: '4px' }}>Click to change file</span>
                      </>
                    ) : (
                      <>
                        <Camera style={{ width: '28px', height: '28px', color: '#334155', marginBottom: '8px' }} />
                        <span style={{ fontSize: '12px', fontWeight: 600, color: '#475569' }}>Click to upload photo or video</span>
                        <span style={{ fontSize: '10px', color: '#1e293b', marginTop: '4px' }}>JPG, PNG, MP4 supported</span>
                      </>
                    )}
                  </label>
                </div>

                {/* Details */}
                <div>
                  <label style={{ display: 'block', fontSize: '11px', fontWeight: 700, color: '#475569', textTransform: 'uppercase', letterSpacing: '0.15em', marginBottom: '10px', fontFamily: 'Orbitron, monospace' }}>
                    Additional Details
                  </label>
                  <textarea
                    rows={3}
                    value={details}
                    onChange={e => setDetails(e.target.value)}
                    placeholder="Describe the situation in detail..."
                    style={{
                      width: '100%', resize: 'none',
                      background: 'rgba(255,255,255,0.04)',
                      border: '1px solid rgba(255,255,255,0.08)',
                      borderRadius: '12px',
                      padding: '12px 14px',
                      fontSize: '13px', color: '#e2e8f0',
                      outline: 'none', fontFamily: 'Rajdhani, sans-serif',
                      lineHeight: '1.6',
                    }}
                    onFocus={e => e.target.style.borderColor = `${selectedType.color}50`}
                    onBlur={e => e.target.style.borderColor = 'rgba(255,255,255,0.08)'}
                  />
                </div>

                {/* Error */}
                {status === 'error' && (
                  <div style={{
                    padding: '12px 16px', borderRadius: '12px',
                    background: 'rgba(239,68,68,0.08)',
                    border: '1px solid rgba(239,68,68,0.25)',
                    color: '#f87171', fontSize: '13px', fontWeight: 600,
                    display: 'flex', alignItems: 'center', gap: '8px',
                  }}>
                    <AlertTriangle style={{ width: '16px', height: '16px', flexShrink: 0 }} />
                    Failed to submit report. Please try again.
                  </div>
                )}

                {/* Buttons */}
                <div style={{ display: 'flex', gap: '12px', paddingTop: '4px' }}>
                  <button
                    type="button"
                    onClick={onClose}
                    style={{
                      flex: 1, padding: '13px',
                      borderRadius: '14px',
                      background: 'rgba(255,255,255,0.03)',
                      border: '1px solid rgba(255,255,255,0.08)',
                      color: '#475569', fontSize: '13px', fontWeight: 700,
                      cursor: 'pointer', fontFamily: 'Rajdhani, sans-serif',
                      letterSpacing: '0.05em',
                      transition: 'all 0.2s',
                    }}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={status === 'submitting'}
                    style={{
                      flex: 2, padding: '13px',
                      borderRadius: '14px',
                      background: status === 'submitting'
                        ? 'rgba(255,255,255,0.05)'
                        : `linear-gradient(135deg, ${selectedType.color}dd, ${selectedType.color}99)`,
                      border: `1px solid ${selectedType.color}40`,
                      color: '#fff', fontSize: '13px', fontWeight: 900,
                      cursor: status === 'submitting' ? 'not-allowed' : 'pointer',
                      fontFamily: 'Orbitron, monospace', letterSpacing: '0.08em',
                      textTransform: 'uppercase',
                      boxShadow: status === 'submitting' ? 'none' : `0 0 20px ${selectedType.glow}`,
                      display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
                      transition: 'all 0.2s',
                    }}
                  >
                    {status === 'submitting' ? (
                      <div style={{
                        width: '18px', height: '18px',
                        border: '2px solid rgba(255,255,255,0.2)',
                        borderTopColor: '#fff',
                        borderRadius: '50%',
                        animation: 'spin 0.8s linear infinite',
                      }} />
                    ) : (
                      <>
                        <Zap style={{ width: '16px', height: '16px' }} />
                        Submit to AI Network
                      </>
                    )}
                  </button>
                </div>

              </form>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}