const pdfParse = require("pdf-parse-new");
const { z } = require("zod");
const { chatModel: model } = require("../config/aiConfig");

/**
 * Extracts text from a PDF buffer
 * @param {Buffer} buffer 
 * @returns {Promise<string>}
 */
const extractTextFromPDF = async (buffer) => {
    try {
        const data = await (typeof pdfParse === "function" ? pdfParse(buffer) : pdfParse.default(buffer));
        return data.text;
    } catch (error) {
        console.error("PDF Parse Error:", error);
        throw new Error("Failed to extract text from PDF");
    }
};

/**
 * Generates questions based on the provided text
 * @param {string} text 
 * @returns {Promise<string[]>}
 */
const generateQuestions = async (text) => {
    const prompt = `
    Analyze the following document text and generate 5 insightful, open-ended questions that test understanding of the key concepts.
    Return ONLY a JSON array of strings. Do not include markdown formatting like \`\`\`json.
    
    Document Text:
    ${text.substring(0, 10000)} // Truncate to avoid context limits if necessary
    `;

    try {
        const result = await model.invoke(prompt);
        let content = result.content;

        // Clean up markdown if present
        content = content.replace(/```json/g, "").replace(/```/g, "").trim();

        const questions = JSON.parse(content);
        return Array.isArray(questions) ? questions : ["Failed to parse questions."];
    } catch (error) {
        console.error("AI Generation Error:", error);
        return [
            "1. What is the main topic of this document?",
            "2. improved Could you summarize the key points?",
            `3. (AI Service Unavailable: ${error.message})`
        ];
    }
};

/**
 * Generates an email draft based on the provided text
 * @param {string} text 
 * @param {string} originalName
 * @returns {Promise<{subject: string, body: string}>}
 */
const generateEmail = async (text, originalName) => {
    const prompt = `
    You are a professional assistant. Write a professional email draft sharing the key insights from the attached document named "${originalName}".
    The email should have a clear subject line and a structured body summarizing 3 main points from the text below.
    Return ONLY a JSON object with keys "subject" and "body". Do not include markdown formatting.

    Document Text:
    ${text.substring(0, 10000)}
    `;

    try {
        const result = await model.invoke(prompt);
        let content = result.content;

        // Clean up markdown if present
        content = content.replace(/```json/g, "").replace(/```/g, "").trim();

        return JSON.parse(content);
    } catch (error) {
        console.error("AI Email Generation Error:", error);
        return {
            subject: `Review of ${originalName}`,
            body: `(AI Service Error) Please manually review the document ${originalName}.`
        };
    }
};

module.exports = {
    extractTextFromPDF,
    generateQuestions,
    generateEmail
};
