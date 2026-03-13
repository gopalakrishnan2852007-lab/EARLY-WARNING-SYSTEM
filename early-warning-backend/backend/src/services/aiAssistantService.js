const { GoogleGenerativeAI } = require("@google/generative-ai");

// Access your API key as an environment variable (see "Set up your API key" above)
let genAI = null;
if (process.env.GEMINI_API_KEY) {
    genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
}

async function handleChatQuery(userMessage, systemContext) {
    if (!genAI) {
        return "AI Assistant is currently offline (Missing API Key).";
    }

    try {
        const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

        const prompt = `
You are an AI Disaster Early Warning Assistant. 
You help users understand disaster risks, explain alerts, answer safety questions, and summarize sensor data.

Context of current system state:
${systemContext}

User Query: ${userMessage}

Respond concisely and professionally, providing actionable guidance if the user is asking about safety.
`;

        const result = await model.generateContent(prompt);
        const response = await result.response;
        return response.text();
    } catch (error) {
        console.error("AI Assistant Error:", error);
        return "I'm having trouble connecting to my knowledge base right now. Please check official emergency channels for immediate concerns.";
    }
}

module.exports = { handleChatQuery };
