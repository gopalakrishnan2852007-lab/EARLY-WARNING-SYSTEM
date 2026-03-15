import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FileWarning, X, Camera, MapPin, UploadCloud } from 'lucide-react';

export default function CommunityReportModal({ isOpen, onClose }: { isOpen: boolean, onClose: () => void }) {
  const [reportType, setReportType] = useState('flood');
  const [status, setStatus] = useState<'idle' | 'submitting' | 'success'>('idle');

  const [location, setLocation] = useState('');
  const [details, setDetails] = useState('');
  const [imageFile, setImageFile] = useState<File | null>(null);

  const handleGPS = () => {
    if ('geolocation' in navigator) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          setLocation(`${pos.coords.latitude.toFixed(4)}, ${pos.coords.longitude.toFixed(4)}`);
        },
        (err) => {
          alert('Could not fetch location. Please check your permissions.');
        }
      );
    } else {
      alert('Geolocation is not supported by your browser.');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatus('submitting');

    try {
      const formData = new FormData();
      formData.append('type', reportType);
      formData.append('location', location);
      formData.append('details', details);
      if (imageFile) {
        formData.append('image', imageFile);
      }

      const res = await fetch('https://early-warning-system-fh1y.onrender.com/api/reports', {
        method: 'POST',
        body: formData
      });

      if (!res.ok) throw new Error("Backend rejected report");
      
      setStatus('success');
      
      setTimeout(() => {
        setStatus('idle');
        onClose();
        setLocation('');
        setDetails('');
        setImageFile(null);
      }, 2000);
    } catch (error) {
      console.error(error);
      setStatus('error');
      setTimeout(() => setStatus('idle'), 3000);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[200] overflow-y-auto custom-scrollbar p-4 md:p-8 flex justify-center items-start">
      <div className="fixed inset-0 bg-[#0A0A0B]/80 backdrop-blur-sm" onClick={onClose} />

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="w-full max-w-lg bg-[#0F172A] border border-white/10 rounded-3xl shadow-2xl overflow-hidden relative z-10 shrink-0 my-auto"
          >
            <div className="p-6 border-b border-white/10 flex justify-between items-center bg-[#1E293B]">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-amber-500/20 flex items-center justify-center cursor-pointer">
                  <FileWarning className="w-5 h-5 text-amber-500" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-white">Community Report</h2>
                  <p className="text-xs text-slate-400">Alert authorities to local incidents</p>
                </div>
              </div>
              <button onClick={onClose} className="p-2 rounded-full hover:bg-white/5 text-slate-400">
                <X className="w-5 h-5" />
              </button>
            </div>

            {status === 'success' ? (
              <div className="p-12 text-center space-y-4">
                <div className="w-16 h-16 bg-emerald-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
                  <UploadCloud className="w-8 h-8 text-emerald-500" />
                </div>
                <h3 className="text-xl font-bold text-white">Report Submitted!</h3>
                <p className="text-slate-400">🚨 Disaster report submitted successfully. Authorities have been notified.</p>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="p-6 space-y-6">
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">Incident Type</label>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    {['Flood', 'Fire', 'Landslide', 'Smoke'].map(type => (
                      <button
                        key={type}
                        type="button"
                        onClick={() => setReportType(type.toLowerCase())}
                        className={`py-2 px-3 rounded-lg text-sm font-medium border transition-colors
                          ${reportType === type.toLowerCase()
                            ? 'bg-indigo-600/20 border-indigo-500 text-indigo-400'
                            : 'bg-[#1E293B] border-white/5 text-slate-400 hover:border-white/20'}`}
                      >
                        {type}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">Location</label>
                  <div className="flex relative">
                    <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                    <input
                      required
                      type="text"
                      value={location}
                      onChange={(e) => setLocation(e.target.value)}
                      placeholder="Enter street or landmark..."
                      className="w-full bg-[#1E293B] border border-white/5 rounded-xl pl-10 pr-4 py-3 text-sm text-white focus:outline-none focus:border-indigo-500 transition-colors"
                    />
                    <button type="button" onClick={handleGPS} className="absolute right-2 top-1/2 -translate-y-1/2 text-xs font-medium bg-[#0F172A] px-2 py-1 rounded text-indigo-400">
                      Use GPS
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">Media Evidence (Required by AI)</label>
                  <label className="w-full border-2 border-dashed border-white/10 rounded-xl p-8 hover:bg-[#1E293B] transition-colors cursor-pointer group flex flex-col items-center justify-center relative">
                    <input 
                      type="file" 
                      accept="image/*,video/*"
                      className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                      onChange={(e) => {
                        if (e.target.files && e.target.files.length > 0) {
                          setImageFile(e.target.files[0]);
                          alert(`File selected: ${e.target.files[0].name}`);
                        }
                      }}
                    />
                    <Camera className="w-8 h-8 text-slate-500 group-hover:text-amber-400 mb-3 transition-colors" />
                    <span className="text-sm font-medium text-slate-400 group-hover:text-white transition-colors">Click to upload photo or video</span>
                    <span className="text-xs text-slate-500 mt-1">Supports JPG, PNG, MP4</span>
                  </label>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">Additional Details</label>
                  <textarea
                    rows={3}
                    value={details}
                    onChange={(e) => setDetails(e.target.value)}
                    placeholder="Describe the situation..."
                    className="w-full bg-[#1E293B] border border-white/5 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-indigo-500 transition-colors resize-none"
                  />
                </div>

                {status === 'error' && (
                  <div className="text-red-400 text-sm bg-red-500/10 p-3 rounded-lg border border-red-500/20">
                    Failed to submit report. Please try again.
                  </div>
                )}

                <div className="pt-4 flex gap-4">
                  <button
                    type="button"
                    onClick={onClose}
                    className="flex-1 py-3 px-4 rounded-xl font-medium text-slate-300 bg-transparent border border-white/10 hover:bg-white/5 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={status === 'submitting'}
                    className="flex-[2] py-3 px-4 rounded-xl font-bold text-white bg-indigo-600 hover:bg-indigo-500 transition-colors shadow-[0_0_15px_rgba(79,70,229,0.4)] disabled:opacity-50 flex justify-center items-center"
                  >
                    {status === 'submitting' ? <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : 'Submit Alert to AI Network'}
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
