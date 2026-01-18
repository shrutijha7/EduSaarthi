const express = require("express");
const router = express.Router();
const multer = require("multer");
const { z } = require("zod"); // Import Zod
const Resume = require("../models/resume");
// --- IMPORT THE NEW PACKAGE ---
const pdfParse = require("pdf-parse-new");
const upload = multer({ storage: multer.memoryStorage() });
const { chatModel: model, embeddingModel: embeddings } = require("./config/aiConfig");



router.post("/analyze-resumez", upload.single("resume"), async (req, res) => {
    try {
        // Validation: Check if file exists
        if (!req.file) {
            return res
                .status(400)
                .json({ success: false, error: "No PDF file provided" });
        }
        // STEP A: Extract Text from PDF (Handling Node 23 compatibility)
        const pdfData = await (typeof pdfParse === "function"
            ? pdfParse(req.file.buffer)
            : pdfParse.default(req.file.buffer));
        const extractedText = pdfData.text;
        if (!extractedText.trim()) {
            throw new Error("PDF content is empty or unreadable");
        }
        // STEP B: Define AI Schema (Structured Output)
        const resumeSchema = z.object({
            candidateName: z.string().describe("The full name of the person"),
            summary: z
                .string()
                .describe("3-4 bullet points of experience and skills"),
        });
        // STEP C: AI Reasoning (Extraction)
        const structuredModel = model.withStructuredOutput(resumeSchema);
        const aiResult = await structuredModel.invoke(
            `Extract details from this resume: ${extractedText}`
        );
        // STEP D: Knowledge Generation (Vectorizing)
        const vectorData = await embeddings.embedQuery(extractedText);
        // STEP E: Persistence (Saving to MERN Stack)
        const newResume = new Resume({
            fileName: req.file.originalname,
            candidateName: aiResult.candidateName,
            rawText: extractedText,
            summary: aiResult.summary,
            vector: vectorData,
        });
        await newResume.save();
        // Success Response
        res.status(201).json({
            success: true,
            candidate: aiResult.candidateName,
            summary: aiResult.summary,
        });
    } catch (error) {
        console.error(">>> Upload Error:", error);
        res.status(500).json({
            success: false,
            error: "AI Analysis failed",
            details: error.message,
        });
    }
});
router.post("/search-candidates", async (req, res) => {
    try {
        const { query } = req.body;
        if (!query)
            return res.status(400).json({ success: false, error: "Query required" });

        // STEP A: Vectorize User Query
        const queryVector = await embeddings.embedQuery(query);

        // STEP B: MongoDB Atlas Vector Search (Top-K Retrieval)
        const results = await Resume.aggregate([
            {
                $vectorSearch: {
                    index: "vector_index", // Name of index in Atlas UI
                    path: "vector", // Field in MongoDB
                    queryVector: queryVector,
                    numCandidates: 100,
                    limit: 5,
                },
            },
            {
                $project: {
                    candidateName: 1,
                    summary: 1,
                    score: { $meta: "vectorSearchScore" },
                },
            },
        ]);

        // GUARDRAIL 1: Mathematical Threshold (Math Guard)
        const topScore = results.length > 0 ? results[0].score : 0;
        if (results.length === 0 || topScore < 0.6) {
            return res.json({
                success: true,
                isMatchFound: false,
                aiReasoning: "No candidates found in that industry.",
                candidates: [],
            });
        }

        // STEP C: Agentic Gatekeeper (Reasoning Guard)
        const comparisonSchema = z.object({
            isMatchFound: z
                .boolean()
                .describe("True only if candidates match the requested role/industry"),
            aiReasoning: z
                .string()
                .describe("Explain why it matches or why it is irrelevant"),
            rankings: z
                .array(
                    z.object({
                        rank: z.number(),
                        name: z.string(),
                        matchScore: z.string(),
                        keyReason: z.string(),
                        missingSkills: z.string(),
                    })
                )
                .optional(),
        });

        const structuredAgent = model.withStructuredOutput(comparisonSchema);
        const tablePrompt = `
      You are a Strict Recruiter. User wants: "${query}".
      Database matches: ${results
                .map((r, i) => `[ID ${i}] ${r.candidateName}: ${r.summary}`)
                .join("\n")}

      Instruction: If the user wants a different job (like a Chef) and these are Developers, set isMatchFound to false.
    `;

        const aiResponse = await structuredAgent.invoke(tablePrompt);

        // GUARDRAIL 2: Agentic Filtering (Action Guard)
        if (!aiResponse.isMatchFound) {
            return res.json({
                success: true,
                isMatchFound: false,
                aiReasoning: aiResponse.aiReasoning,
                candidates: [], // Wipe data for irrelevance
            });
        }

        // SUCCESS: Return Ranked matches
        res.json({
            success: true,
            isMatchFound: true,
            aiReasoning: aiResponse.aiReasoning,
            tableData: aiResponse.rankings,
            candidates: results,
        });
    } catch (error) {
        console.error("Search Error:", error);
        res.status(500).json({ success: false, error: error.message });
    }
});

module.exports = router;