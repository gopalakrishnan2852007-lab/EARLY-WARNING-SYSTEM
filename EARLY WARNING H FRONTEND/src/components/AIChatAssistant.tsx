import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MessageSquare, X, Send, Bot, User } from 'lucide-react';

const initialMessages = [
  { id: 1, type: 'bot', text: 'Emergency AI Assistant online. How can I help you today?' },
  { id: 2, type: 'bot', text: 'You can ask me about evacuation routes, current risk levels, or emergency shelter locations.' }
];

export default function AIChatAssistant() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState(initialMessages);
  const [inputValue, setInputValue] = useState('');

  const [isTyping, setIsTyping] = useState(false);

  const handleSend = async () => {
    if (!inputValue.trim()) return;

    // Add user message
    const userMsg = { id: Date.now(), type: 'user', text: inputValue };
    setMessages(prev => [...prev, userMsg]);
    setInputValue('');
    setIsTyping(true);

    try {
      const response = await fetch('https://early-warning-system-fh1y.onrender.com/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: inputValue, context: 'Currently on the disaster dashboard evaluating risks.' })
      });
      const data = await response.json();

      const aiMsg = {
        id: Date.now() + 1,
        type: 'bot',
        text: data.reply || "I am currently unable to reach the server. Please check my connection."
      };
      setMessages(prev => [...prev, aiMsg]);
    } catch (err) {
      setMessages(prev => [...prev, { id: Date.now(), type: 'bot', text: 'Error connecting to AI service.' }]);
    } finally {
      setIsTyping(false);
    }
  };

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-6 right-6 w-14 h-14 bg-indigo-600 rounded-full flex items-center justify-center shadow-[0_0_20px_rgba(79,70,229,0.5)] hover:scale-105 transition-transform z-50 group"
      >
        <MessageSquare className="w-6 h-6 text-white group-hover:animate-pulse" />
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            className="fixed bottom-24 right-6 w-[350px] h-[500px] bg-[#0F172A] border border-white/10 rounded-2xl shadow-2xl flex flex-col z-[100]"
          >
            {/* Header */}
            <div className="p-4 border-b border-white/10 flex justify-between items-center bg-indigo-600/10 rounded-t-2xl">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-indigo-500 flex items-center justify-center">
                  <Bot className="w-4 h-4 text-white" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-white">AquaGuard AI</h3>
                  <p className="text-[10px] text-indigo-400">Emergency Support System</p>
                </div>
              </div>
              <button
                onClick={() => setIsOpen(false)}
                className="p-1.5 rounded-full hover:bg-white/10 text-slate-400 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Chat Area */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4 custom-scrollbar">
              {messages.map(msg => (
                <div key={msg.id} className={`flex items-start gap-3 ${msg.type === 'user' ? 'flex-row-reverse' : ''}`}>
                  <div className={`w-6 h-6 rounded-full flex items-center justify-center shrink-0 ${msg.type === 'user' ? 'bg-slate-700' : 'bg-indigo-500/20 text-indigo-400'}`}>
                    {msg.type === 'user' ? <User className="w-3 h-3 text-white" /> : <Bot className="w-3 h-3" />}
                  </div>
                  <div className={`p-3 rounded-2xl text-sm max-w-[80%] ${msg.type === 'user' ? 'bg-indigo-600 text-white rounded-tr-none' : 'bg-[#1E293B] text-slate-200 rounded-tl-none border border-white/5'}`}>
                    {msg.text}
                  </div>
                </div>
              ))}
            </div>

            {/* Input Area */}
            <div className="p-4 border-t border-white/10 bg-[#0F172A] rounded-b-2xl">
              <div className="relative">
                <input
                  type="text"
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleSend()}
                  placeholder="Ask about risks, shelters..."
                  className="w-full bg-[#1E293B] border border-white/10 rounded-full pl-4 pr-12 py-3 text-sm text-white focus:outline-none focus:border-indigo-500 transition-colors"
                />
                <button
                  onClick={handleSend}
                  className="absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 bg-indigo-500 rounded-full flex items-center justify-center text-white hover:bg-indigo-600 transition-colors"
                >
                  <Send className="w-4 h-4 ml-0.5" />
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
