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
 * @param {number} count
 * @returns {Promise<string[]>}
 */
const generateQuestions = async (text, count = 5) => {
    const prompt = `
    ROLE: Senior Academic Examiner.
    
    TASK: Generate ${count} conceptual, open-ended questions based on the SUBJECT MATTER mentioned in the text.

    CRITICAL CONSTRAINTS (MANDATORY):
    1. NO META-REFERENCES: Never mention terms like "Unit", "Chapter", "PDF", "Text", "Syllabus", "Section", "Course", or "Module".
    2. NO LOCATION-BASED QUESTIONS: Do NOT ask questions like "What is discussed in Unit 3?".
    3. PURE CONCEPTUAL FOCUS: If you see a topic like "Micro-operations", ask "Explain the logic behind combining arithmetic, logic, and shift micro-operations in a single hardware unit." 
    4. NO QUOTES: Do not ask "According to the text...". Ask as if you are testing their knowledge of the field of study.

    PROCESS:
    - Scan the text for technical terms and concepts.
    - Treat the text ONLY as a list of topics to be tested.
    - Use your internal knowledge to ask a sophisticated question about each topic.

    FORMAT: Return ONLY a JSON array of strings.
    
    Document Text:
    ${text.substring(0, 15000)}
    `;

    try {
        const result = await model.invoke(prompt);
        let content = result.content;
        content = content.replace(/```json/g, "").replace(/```/g, "").trim();
        const questions = JSON.parse(content);
        return Array.isArray(questions) ? questions : [];
    } catch (error) {
        console.error("AI Generation Error:", error);
        return ["Analyze the core principles of the subject matter.", "Evaluate the practical applications of the key concepts identified."];
    }
};

/**
 * Generates a quiz based on the provided text
 * @param {string} text 
 * @param {number} count
 * @returns {Promise<Array<{question: string, options: string[], answer: string}>>}
 */
const generateQuiz = async (text, count = 5) => {
    const prompt = `
    ROLE: Professional Assessment Developer.
    
    TASK: Generate ${count} Multiple Choice Questions testing scientific/technical concepts identified in the text.

    CRITICAL RULES (ABSOLUTE):
    1. ZERO DOCUMENT REFERENCES: I repeat, NEVER use words like "Unit", "III", "Unit 3", "Syllabus", "Page", "Section", "PDF", "Text", or "Mentioned".
    2. TOPIC-ONLY: If the text contains "arithmetic, logic, and shift micro-operations", your question should be: "Which hardware unit is specifically designed to combine arithmetic, logic, and shift micro-operations?" 
    3. OPTIONS QUALITY: Provide 4 distinct, technically accurate options. Avoid "All of the above".
    4. NO CHRONOLOGY: Do not ask about the order topics appeared in.

    EXAMPLE OF WHAT NOT TO DO: "Which unit is described in Unit III as...?" (THIS IS FAIL)
    EXAMPLE OF WHAT TO DO: "What is the primary function of an arithmetic logic shift unit?" (THIS IS PASS)

    FORMAT: Return ONLY a JSON array of objects.
    JSON: [{ "question": "...", "options": ["...", "...", "...", "..."] }]

    DATA SOURCE:
    ${text.substring(0, 15000)}
    `;

    try {
        const result = await model.invoke(prompt);
        let content = result.content;

        // Clean up markdown if present
        content = content.replace(/```json/g, "").replace(/```/g, "").trim();

        const quiz = JSON.parse(content);
        return Array.isArray(quiz) ? quiz : [];
    } catch (error) {
        console.error("AI Quiz Generation Error:", error);
        return [];
    }
};

/**
 * Generates fill-in-the-blanks questions based on the provided text
 * @param {string} text 
 * @param {number} count
 * @returns {Promise<Array<{question: string, answer: string}>>}
 */
const generateFillInBlanks = async (text, count = 5) => {
    const prompt = `
    ROLE: Professional Assessment Developer.
    
    TASK: Generate ${count} Fill-in-the-blanks questions based on the provided text.
    
    CRITICAL RULES:
    1. ZERO DOCUMENT REFERENCES: Never use words like "Unit", "Section", "PDF", "Text", etc.
    2. FORMAT: Each question should have one blank represented by "__________".
    3. JSON FORMAT: Return ONLY a JSON array of objects: [{ "question": "...", "answer": "..." }]
    
    Document Text:
    ${text.substring(0, 15000)}
    `;

    try {
        const result = await model.invoke(prompt);
        let content = result.content.replace(/```json/g, "").replace(/```/g, "").trim();
        const data = JSON.parse(content);
        return Array.isArray(data) ? data : [];
    } catch (error) {
        console.error("AI Fill-in-the-blanks Error:", error);
        return [];
    }
};

/**
 * Generates True/False questions based on the provided text
 * @param {string} text 
 * @param {number} count
 * @returns {Promise<Array<{question: string, answer: boolean, explanation: string}>>}
 */
const generateTrueFalse = async (text, count = 5) => {
    const prompt = `
    ROLE: Professional Assessment Developer.
    
    TASK: Generate ${count} True/False questions based on the provided text.
    
    CRITICAL RULES:
    1. ZERO DOCUMENT REFERENCES.
    2. Provide an explanation for why the statement is true or false.
    3. JSON FORMAT: Return ONLY a JSON array of objects: [{ "question": "...", "answer": true/false, "explanation": "..." }]
    
    Document Text:
    ${text.substring(0, 15000)}
    `;

    try {
        const result = await model.invoke(prompt);
        let content = result.content.replace(/```json/g, "").replace(/```/g, "").trim();
        const data = JSON.parse(content);
        return Array.isArray(data) ? data : [];
    } catch (error) {
        console.error("AI True/False Error:", error);
        return [];
    }
};

/**
 * Generates subjective (short/long answer) questions with grading suggestions
 * @param {string} text 
 * @param {number} count
 * @returns {Promise<Array<{question: string, suggestedAnswer: string, keyPoints: string[]}>>}
 */
const generateSubjective = async (text, count = 5) => {
    const prompt = `
    ROLE: Senior Academic Examiner.
    
    TASK: Generate ${count} Subjective (Short/Long Answer) questions based on the provided text.
    
    CRITICAL RULES:
    1. ZERO DOCUMENT REFERENCES.
    2. Provide a "suggestedAnswer" and a list of "keyPoints" for grading.
    3. JSON FORMAT: Return ONLY a JSON array of objects: [{ "question": "...", "suggestedAnswer": "...", "keyPoints": ["...", "..."] }]
    
    Document Text:
    ${text.substring(0, 15000)}
    `;

    try {
        const result = await model.invoke(prompt);
        let content = result.content.replace(/```json/g, "").replace(/```/g, "").trim();
        const data = JSON.parse(content);
        return Array.isArray(data) ? data : [];
    } catch (error) {
        console.error("AI Subjective Error:", error);
        return [];
    }
};

module.exports = {
    extractTextFromPDF,
    generateQuestions,
    generateQuiz,
    generateFillInBlanks,
    generateTrueFalse,
    generateSubjective
};
