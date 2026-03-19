import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MessageSquare, X, Send, Bot, User, Zap } from 'lucide-react';

const API = "https://early-warning-system-fh1y.onrender.com";

// ── Initial Messages ────────────────────────────────────────────────────────
const initialMessages = [
  {
    id: 1, type: 'bot',
    text: '🚨 SentinelAlert AI online. I can help you with evacuation routes, current risk levels, flood/fire safety tips, and emergency shelter locations across Tamil Nadu.'
  },
  {
    id: 2, type: 'bot',
    text: 'Ask me anything — "What should I do during a flood?" or "Which areas are at high risk right now?"'
  }
];

// ── Typing Indicator ────────────────────────────────────────────────────────
function TypingDots() {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '5px', padding: '4px 2px' }}>
      {[0, 1, 2].map(i => (
        <div key={i} style={{
          width: '6px', height: '6px', borderRadius: '50%',
          background: '#60a5fa',
          animation: 'typingBounce 1.2s ease-in-out infinite',
          animationDelay: `${i * 0.2}s`,
          boxShadow: '0 0 6px rgba(96,165,250,0.6)',
        }} />
      ))}
    </div>
  );
}

// ── Message Bubble ──────────────────────────────────────────────────────────
function MessageBubble({ msg }: { msg: any }) {
  const isUser = msg.type === 'user';
  return (
    <motion.div
      initial={{ opacity: 0, y: 10, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.25, ease: 'easeOut' }}
      style={{
        display: 'flex', alignItems: 'flex-start', gap: '8px',
        flexDirection: isUser ? 'row-reverse' : 'row',
      }}
    >
      {/* Avatar */}
      <div style={{
        width: '28px', height: '28px', borderRadius: '50%',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        flexShrink: 0,
        background: isUser
          ? 'linear-gradient(135deg, #4f46e5, #7c3aed)'
          : 'linear-gradient(135deg, rgba(59,130,246,0.2), rgba(99,102,241,0.2))',
        border: isUser ? 'none' : '1px solid rgba(96,165,250,0.3)',
        boxShadow: isUser ? '0 0 12px rgba(99,102,241,0.4)' : '0 0 12px rgba(96,165,250,0.2)',
      }}>
        {isUser
          ? <User style={{ width: '14px', height: '14px', color: '#fff' }} />
          : <Bot style={{ width: '14px', height: '14px', color: '#60a5fa' }} />
        }
      </div>

      {/* Bubble */}
      <div style={{
        padding: '10px 14px',
        borderRadius: isUser ? '18px 4px 18px 18px' : '4px 18px 18px 18px',
        fontSize: '13px', lineHeight: '1.6',
        maxWidth: '82%',
        background: isUser
          ? 'linear-gradient(135deg, #3b82f6, #4f46e5)'
          : 'linear-gradient(135deg, rgba(255,255,255,0.06), rgba(255,255,255,0.02))',
        border: isUser ? 'none' : '1px solid rgba(255,255,255,0.07)',
        color: isUser ? '#fff' : '#cbd5e1',
        boxShadow: isUser
          ? '0 4px 15px rgba(59,130,246,0.3)'
          : '0 4px 15px rgba(0,0,0,0.3)',
        backdropFilter: 'blur(10px)',
      }}>
        {msg.text}
      </div>
    </motion.div>
  );
}

// ── Main Component ──────────────────────────────────────────────────────────
export default function AIChatAssistant() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState(initialMessages);
  const [inputValue, setInputValue] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [hasNewMsg, setHasNewMsg] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isTyping]);

  useEffect(() => {
    if (isOpen) setTimeout(() => inputRef.current?.focus(), 300);
  }, [isOpen]);

  const handleSend = async () => {
    if (!inputValue.trim() || isTyping) return;

    const userText = inputValue.trim();
    const userMsg = { id: Date.now(), type: 'user', text: userText };
    setMessages(prev => [...prev, userMsg]);
    setInputValue('');
    setIsTyping(true);

    try {
      // ── Calls YOUR Groq backend (Free!) ─────────────────────────────────
      const response = await fetch(`${API}/api/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: userText,
          context: 'User is on the SentinelAlert dashboard monitoring Tamil Nadu disaster risks in real time.',
        }),
      });

      const data = await response.json();
      const replyText = data.reply || "I'm having trouble connecting right now. Please check the dashboard for live data.";

      setMessages(prev => [...prev, {
        id: Date.now() + 1,
        type: 'bot',
        text: replyText,
      }]);

      if (!isOpen) setHasNewMsg(true);

    } catch (err) {
      setMessages(prev => [...prev, {
        id: Date.now() + 1,
        type: 'bot',
        text: '⚠️ Unable to connect to AI service. For emergencies call 112.',
      }]);
    } finally {
      setIsTyping(false);
    }
  };

  const quickPrompts = [
    "Flood evacuation tips?",
    "Fire safety steps?",
    "High risk areas TN?",
    "Emergency contacts?",
  ];

  return (
    <>
      <style>{`
        @keyframes typingBounce {
          0%, 80%, 100% { transform: translateY(0); opacity: 0.4; }
          40% { transform: translateY(-6px); opacity: 1; }
        }
        @keyframes orbPulse {
          0%, 100% { box-shadow: 0 0 20px rgba(59,130,246,0.5), 0 0 40px rgba(59,130,246,0.2); }
          50% { box-shadow: 0 0 30px rgba(59,130,246,0.8), 0 0 60px rgba(59,130,246,0.3); }
        }
      `}</style>

      {/* ── Floating Button ── */}
      <button
        onClick={() => { setIsOpen(true); setHasNewMsg(false); }}
        style={{
          position: 'fixed', bottom: '80px', right: '24px',
          width: '56px', height: '56px', borderRadius: '50%',
          background: 'linear-gradient(135deg, #2563eb, #4f46e5)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          cursor: 'pointer', border: 'none', zIndex: 50,
          animation: 'orbPulse 3s ease-in-out infinite',
          transition: 'transform 0.2s ease',
        }}
        onMouseEnter={e => (e.currentTarget.style.transform = 'scale(1.1)')}
        onMouseLeave={e => (e.currentTarget.style.transform = 'scale(1)')}
      >
        <MessageSquare style={{ width: '22px', height: '22px', color: '#fff' }} />
        {hasNewMsg && (
          <div style={{
            position: 'absolute', top: '2px', right: '2px',
            width: '12px', height: '12px', borderRadius: '50%',
            background: '#ef4444', border: '2px solid #060608',
          }} />
        )}
      </button>

      {/* ── Chat Panel ── */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 24, scale: 0.94 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 24, scale: 0.94 }}
            transition={{ duration: 0.3, ease: [0.23, 1, 0.32, 1] }}
            style={{
              position: 'fixed',
              bottom: '152px', right: '24px',
              width: '360px', height: '520px',
              borderRadius: '24px',
              display: 'flex', flexDirection: 'column',
              zIndex: 100, overflow: 'hidden',
              background: 'linear-gradient(160deg, rgba(10,10,20,0.98), rgba(6,6,15,0.98))',
              border: '1px solid rgba(255,255,255,0.07)',
              boxShadow: '0 30px 60px rgba(0,0,0,0.7), 0 0 40px rgba(59,130,246,0.08)',
              backdropFilter: 'blur(30px)',
            }}
          >
            {/* Header */}
            <div style={{
              padding: '16px 18px',
              borderBottom: '1px solid rgba(255,255,255,0.06)',
              background: 'linear-gradient(135deg, rgba(59,130,246,0.1), rgba(99,102,241,0.05))',
              display: 'flex', justifyContent: 'space-between', alignItems: 'center',
              flexShrink: 0,
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <div style={{
                  width: '36px', height: '36px', borderRadius: '12px',
                  background: 'linear-gradient(135deg, #2563eb, #4f46e5)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  boxShadow: '0 0 16px rgba(59,130,246,0.4)',
                }}>
                  <Zap style={{ width: '18px', height: '18px', color: '#fff' }} />
                </div>
                <div>
                  <div style={{
                    fontFamily: 'Orbitron, monospace', fontWeight: 900,
                    fontSize: '13px', color: '#fff', letterSpacing: '0.05em',
                  }}>
                    Sentinel<span style={{ color: '#60a5fa' }}>AI</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '5px', marginTop: '2px' }}>
                    <div style={{
                      width: '6px', height: '6px', borderRadius: '50%',
                      background: '#34d399',
                      boxShadow: '0 0 6px rgba(52,211,153,0.8)',
                    }} />
                    <span style={{ color: '#34d399', fontSize: '10px', fontWeight: 700, letterSpacing: '0.1em' }}>
                      ONLINE · GROQ AI
                    </span>
                  </div>
                </div>
              </div>
              <button
                onClick={() => setIsOpen(false)}
                style={{
                  width: '28px', height: '28px', borderRadius: '8px',
                  background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  cursor: 'pointer', color: '#64748b',
                }}
              >
                <X style={{ width: '14px', height: '14px' }} />
              </button>
            </div>

            {/* Messages */}
            <div style={{
              flex: 1, overflowY: 'auto', padding: '16px',
              display: 'flex', flexDirection: 'column', gap: '12px',
            }}>
              {messages.map(msg => (
                <MessageBubble key={msg.id} msg={msg} />
              ))}
              {isTyping && (
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: '8px' }}>
                  <div style={{
                    width: '28px', height: '28px', borderRadius: '50%',
                    background: 'rgba(59,130,246,0.15)',
                    border: '1px solid rgba(96,165,250,0.3)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                  }}>
                    <Bot style={{ width: '14px', height: '14px', color: '#60a5fa' }} />
                  </div>
                  <div style={{
                    padding: '10px 14px', borderRadius: '4px 18px 18px 18px',
                    background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.07)',
                  }}>
                    <TypingDots />
                  </div>
                </div>
              )}
              <div ref={bottomRef} />
            </div>

            {/* Quick Prompts */}
            <div style={{ padding: '0 12px 10px', display: 'flex', gap: '6px', flexWrap: 'wrap', flexShrink: 0 }}>
              {quickPrompts.map(prompt => (
                <button
                  key={prompt}
                  onClick={() => { setInputValue(prompt); inputRef.current?.focus(); }}
                  style={{
                    padding: '4px 10px', borderRadius: '99px',
                    background: 'rgba(59,130,246,0.08)', border: '1px solid rgba(59,130,246,0.2)',
                    color: '#93c5fd', fontSize: '10px', fontWeight: 700,
                    cursor: 'pointer', letterSpacing: '0.05em',
                  }}
                >
                  {prompt}
                </button>
              ))}
            </div>

            {/* Input */}
            <div style={{
              padding: '12px 14px',
              borderTop: '1px solid rgba(255,255,255,0.05)',
              background: 'rgba(0,0,0,0.2)', flexShrink: 0,
            }}>
              <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                <input
                  ref={inputRef}
                  type="text"
                  value={inputValue}
                  onChange={e => setInputValue(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && handleSend()}
                  placeholder="Ask about risks, shelters, safety..."
                  style={{
                    flex: 1, background: 'rgba(255,255,255,0.05)',
                    border: '1px solid rgba(255,255,255,0.08)',
                    borderRadius: '12px', padding: '10px 14px',
                    fontSize: '13px', color: '#e2e8f0', outline: 'none',
                    fontFamily: 'Rajdhani, sans-serif',
                  }}
                  onFocus={e => (e.target.style.borderColor = 'rgba(96,165,250,0.5)')}
                  onBlur={e => (e.target.style.borderColor = 'rgba(255,255,255,0.08)')}
                />
                <button
                  onClick={handleSend}
                  disabled={isTyping || !inputValue.trim()}
                  style={{
                    width: '38px', height: '38px', borderRadius: '12px',
                    background: inputValue.trim()
                      ? 'linear-gradient(135deg, #2563eb, #4f46e5)'
                      : 'rgba(255,255,255,0.05)',
                    border: 'none', cursor: inputValue.trim() ? 'pointer' : 'not-allowed',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    flexShrink: 0,
                    boxShadow: inputValue.trim() ? '0 0 16px rgba(59,130,246,0.4)' : 'none',
                  }}
                >
                  <Send style={{ width: '16px', height: '16px', color: inputValue.trim() ? '#fff' : '#334155', marginLeft: '1px' }} />
                </button>
              </div>
              <p style={{ color: '#1e293b', fontSize: '9px', textAlign: 'center', marginTop: '8px', letterSpacing: '0.1em' }}>
                POWERED BY GROQ AI · SENTINELALERT
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}