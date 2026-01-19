const { chatModel } = require('./config/aiConfig');

async function testAI() {
    console.log("Starting AI Diagnostic...");
    try {
        const timeout = new Promise((_, reject) =>
            setTimeout(() => reject(new Error("Request Timed Out after 15s")), 15000)
        );

        console.log("Sending request to models/gemini-1.5-flash...");
        const response = await Promise.race([
            chatModel.invoke("Test"),
            timeout
        ]);

        console.log("Success!");
        console.log("Response:", response.content);
    } catch (error) {
        console.error("DIAGNOSTIC ERROR:", error.message);
        if (error.stack) console.error(error.stack);
    }
}

testAI();
