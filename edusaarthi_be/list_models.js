const { GoogleGenerativeAI } = require("@google/generative-ai");
require('dotenv').config();

async function listModels() {
    try {
        const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${process.env.GEMINI_API_KEY}`);
        const data = await response.json();

        if (data.models) {
            console.log("\n=== Available Gemini Models ===\n");
            data.models.forEach(model => {
                console.log(`Name: ${model.name}`);
                console.log(`Display Name: ${model.displayName || 'N/A'}`);
                console.log(`Supported Methods: ${model.supportedGenerationMethods?.join(', ') || 'N/A'}`);
                console.log('---');
            });
        } else {
            console.log("Response:", JSON.stringify(data, null, 2));
        }
    } catch (error) {
        console.error("Error listing models:", error.message);
    }
}

listModels();
