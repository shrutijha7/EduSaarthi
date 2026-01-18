const { ChatGoogleGenerativeAI, GoogleGenerativeAIEmbeddings } = require("@langchain/google-genai");
require('dotenv').config();

// Consolidated Configuration
const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
const MODEL_NAME = "gemini-2.5-flash"; // Validated as working
const EMBEDDING_MODEL = "text-embedding-004";

if (!GEMINI_API_KEY) {
    console.warn("WARNING: GEMINI_API_KEY is missing in environment variables. AI features will fail.");
}

// Singleton Model Instances
const chatModel = new ChatGoogleGenerativeAI({
    apiKey: GEMINI_API_KEY,
    model: MODEL_NAME,
    temperature: 0.7,
});

const embeddingModel = new GoogleGenerativeAIEmbeddings({
    apiKey: GEMINI_API_KEY,
    model: EMBEDDING_MODEL,
});

module.exports = {
    chatModel,
    embeddingModel,
    MODEL_NAME
};
