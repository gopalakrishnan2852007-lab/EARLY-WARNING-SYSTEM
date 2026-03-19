
Copy

const Groq = require('groq-sdk');

/* ======================================================
   SENTINELALERT — AI Chat Service
   Powered by Groq (Free, Ultra Fast LLaMA 3)
====================================================== */

let groq = null;

if (process.env.GROQ_API_KEY) {
    groq = new Groq({ apiKey: process.env.GROQ_API_KEY });
    console.log('✅ SentinelAlert AI (Groq LLaMA) initialized');
} else {
    console.warn('⚠️  GROQ_API_KEY missing — AI chat will be offline');
}

/* ── System Prompt ────────────────────────────────────── */
const SYSTEM_PROMPT = `You are SentinelAlert AI — an emergency disaster response assistant for Tamil Nadu, India.
 
Your expertise:
- Flood and fire disaster response
- Evacuation routes and safety procedures  
- Interpreting live sensor data (temperature, gas, water level, rainfall)
- Emergency shelter locations across Tamil Nadu
- Real-time risk assessment explanation
 
Rules:
- Keep responses concise (2-4 sentences max)
- Always prioritize user safety
- Be calm, clear, and reassuring — never cause panic
- If asked about current sensor data, reference the system context provided
- Use simple language that anyone can understand
- For CRITICAL alerts, always recommend contacting emergency services (112)
- Never make up sensor values — only use what is provided in context`;

/* ── Main Chat Handler ────────────────────────────────── */
async function handleChatQuery(userMessage, systemContext = '') {
    if (!groq) {
        return '⚠️ SentinelAlert AI is currently offline. Please check official emergency channels or call 112 for immediate concerns.';
    }

    try {
        const contextBlock = systemContext
            ? `\n\nCurrent System State:\n${systemContext}`
            : '';

        const completion = await groq.chat.completions.create({
            model: 'llama-3.1-8b-instant', // Free + ultra fast
            max_tokens: 400,
            temperature: 0.4,
            messages: [
                {
                    role: 'system',
                    content: SYSTEM_PROMPT,
                },
                {
                    role: 'user',
                    content: `${userMessage}${contextBlock}`,
                },
            ],
        });

        return completion.choices[0]?.message?.content ||
            "I'm having trouble generating a response. Please check official emergency channels.";

    } catch (error) {
        console.error('❌ SentinelAlert AI Error:', error.message);
        return "I'm having trouble connecting right now. For immediate emergencies, please call 112.";
    }
}

/* ── Risk Summary Generator ───────────────────────────── */
async function generateRiskSummary(sensorData, riskLevel) {
    if (!groq) return null;

    try {
        const completion = await groq.chat.completions.create({
            model: 'llama-3.1-8b-instant',
            max_tokens: 200,
            temperature: 0.3,
            messages: [
                {
                    role: 'system',
                    content: SYSTEM_PROMPT,
                },
                {
                    role: 'user',
                    content: `Generate a 1-2 sentence emergency briefing for Tamil Nadu authorities.
Risk Level: ${riskLevel.toUpperCase()}
Sensor Data: ${JSON.stringify(sensorData)}
Be direct and actionable.`,
                },
            ],
        });

        return completion.choices[0]?.message?.content || null;
    } catch (err) {
        console.error('Risk summary generation failed:', err.message);
        return null;
    }
}

module.exports = { handleChatQuery, generateRiskSummary };