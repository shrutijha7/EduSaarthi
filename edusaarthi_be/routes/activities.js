const express = require('express');
const router = express.Router();
const Activity = require('../models/Activity');
const { protect } = require('../middlewares/authMiddleware');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { sendEmail } = require('../services/emailService');

// Configure Multer for file uploads
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        const uploadDir = 'uploads/';
        if (!fs.existsSync(uploadDir)) {
            fs.mkdirSync(uploadDir);
        }
        cb(null, uploadDir);
    },
    filename: function (req, file, cb) {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
    }
});

const upload = multer({ storage: storage });

// Generate task from file
router.post('/generate', protect, upload.single('file'), async (req, res) => {
    try {
        const { taskType, questionCount, subjectId, existingFilePath, existingFileName } = req.body;

        // Check if we have either a new upload or an existing file reference
        if (!req.file && !existingFilePath) {
            return res.status(400).json({ status: 'fail', message: 'No file provided' });
        }

        const aiService = require('../services/aiService'); // Import here or at top

        let filePath, originalName;

        // Determine file source
        if (req.file) {
            // Newly uploaded file
            filePath = req.file.path;
            originalName = req.file.originalname;
        } else {
            // Existing file from subject
            filePath = existingFilePath;
            originalName = existingFileName;

            // Verify the file exists
            if (!fs.existsSync(filePath)) {
                return res.status(404).json({ status: 'fail', message: 'Referenced file not found' });
            }
        }

        // 1. Extract Text
        let extractedText = "";
        const fileBuffer = fs.readFileSync(filePath);
        const mimeType = path.extname(filePath).toLowerCase();

        if (mimeType === '.pdf') {
            extractedText = await aiService.extractTextFromPDF(fileBuffer);
        } else if (mimeType === '.txt') {
            extractedText = fs.readFileSync(filePath, 'utf8');
        } else {
            // Fallback for other file types
            extractedText = "File content extraction skipped (supports PDF and TXT). Using metadata only.";
        }

        let activityTitle = '';
        let activityDescription = '';
        let generatedContent = null;

        if (taskType === 'question_generation') {
            activityTitle = 'Generated Questions';
            activityDescription = `AI-generated questions from ${originalName}`;
            const questions = await aiService.generateQuestions(extractedText, parseInt(questionCount) || 5);
            generatedContent = {
                type: 'questions',
                data: questions
            };
        } else if (taskType === 'quiz') {
            activityTitle = 'Generated Quiz';
            activityDescription = `AI-generated quiz from ${originalName}`;
            const quizData = await aiService.generateQuiz(extractedText, parseInt(questionCount) || 5);
            generatedContent = {
                type: 'quiz',
                data: quizData
            };
        } else {
            activityTitle = 'File Processed';
            activityDescription = `Processed ${originalName}`;
        }

        const newActivity = await Activity.create({
            userId: req.user._id,
            subjectId: subjectId || null, // Link to subject if provided
            title: activityTitle,
            description: activityDescription,
            fileName: originalName, // Store original file name
            filePath: filePath, // Store file path
            type: taskType || 'automation',
            content: generatedContent // Store the actual generated JSON
        });

        /* 
        // 6. Send Email Notification if enabled
        if (req.user.notificationsEnabled !== false) {
            const emailHtml = formatEmailBody(activityTitle, generatedContent || { type: 'status', data: activityDescription }, originalName);
            await sendEmail(req.user.email, `Automation Complete: ${activityTitle}`, emailHtml);
        }
        */

        // Create results folder if it doesn't exist
        const resultsDir = path.join(__dirname, '../results');
        if (!fs.existsSync(resultsDir)) {
            fs.mkdirSync(resultsDir, { recursive: true });
        }

        // Save generated results to a file (JSON)
        const timestamp = Date.now();
        const safeTitle = activityTitle.replace(/[^a-z0-9]/gi, '_').toLowerCase();
        const resultFilenameJson = `result-${timestamp}-${safeTitle}.json`;
        const resultFilenameTxt = `result-${timestamp}-${safeTitle}.txt`;

        const resultPathJson = path.join(resultsDir, resultFilenameJson);
        const resultPathTxt = path.join(resultsDir, resultFilenameTxt);

        fs.writeFileSync(resultPathJson, JSON.stringify(generatedContent, null, 2));

        // Generate a text version for easy reading
        let textContent = `${activityTitle}\n${'='.repeat(activityTitle.length)}\n\n`;
        textContent += `Source File: ${originalName}\n`;
        textContent += `Date: ${new Date().toLocaleString()}\n\n`;

        if (generatedContent.type === 'questions' && Array.isArray(generatedContent.data)) {
            generatedContent.data.forEach((q, i) => textContent += `${i + 1}. ${q}\n`);
        } else if (generatedContent.type === 'quiz' && Array.isArray(generatedContent.data)) {
            generatedContent.data.forEach((item, i) => {
                textContent += `Q${i + 1}: ${item.question}\n`;
                item.options.forEach((opt, j) => textContent += `   ${String.fromCharCode(65 + j)}) ${opt}\n`);
                textContent += `\n`;
            });
        }

        fs.writeFileSync(resultPathTxt, textContent);

        console.log(`Results saved to ${resultsDir}`);

        // Cleanup uploaded file if it was a new upload (not from subject)
        // Only delete if it's in the temporary uploads directory, not the subjects directory
        if (req.file && filePath.includes('uploads/') && !filePath.includes('uploads/subjects')) {
            // fs.unlinkSync(filePath); // Uncomment if you want to delete temporary uploads
        }

        res.status(200).json({
            status: 'success',
            message: 'File processed successfully',
            data: {
                activity: newActivity,
                file: path.basename(filePath),
                generatedContent
            }
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({ status: 'error', message: 'Error processing file: ' + err.message });
    }
});

// Schedule a task
router.post('/schedule', protect, upload.single('file'), async (req, res) => {
    try {
        const { taskType, questionCount, recipientEmails, scheduledDate, existingFilePath, existingFileName, subjectId } = req.body;
        const ScheduledTask = require('../models/ScheduledTask');

        if (!scheduledDate) {
            return res.status(400).json({ status: 'fail', message: 'Scheduled date is required' });
        }

        // Check if we have either a new upload or an existing file reference
        if (!req.file && !existingFilePath) {
            return res.status(400).json({ status: 'fail', message: 'No file provided' });
        }

        let filePath, originalName;

        // Determine file source
        if (req.file) {
            filePath = req.file.path;
            originalName = req.file.originalname;
        } else {
            filePath = existingFilePath;
            originalName = existingFileName;

            if (!fs.existsSync(filePath)) {
                return res.status(404).json({ status: 'fail', message: 'Referenced file not found' });
            }
        }

        const newTask = await ScheduledTask.create({
            userId: req.user._id,
            subjectId: subjectId || null,
            filePath: filePath,
            originalFileName: originalName,
            taskType: taskType || 'automation',
            questionCount: parseInt(questionCount) || 5,
            recipientEmails: recipientEmails || req.user.email,
            scheduledDate: new Date(scheduledDate),
            status: 'pending'
        });

        res.status(201).json({
            status: 'success',
            message: 'Task scheduled successfully',
            data: { task: newTask }
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({ status: 'error', message: 'Error scheduling task: ' + err.message });
    }
});

// Get scheduled tasks
router.get('/scheduled', protect, async (req, res) => {
    try {
        const ScheduledTask = require('../models/ScheduledTask');
        const tasks = await ScheduledTask.find({ userId: req.user._id }).sort('scheduledDate');
        res.status(200).json({
            status: 'success',
            results: tasks.length,
            data: { tasks }
        });
    } catch (err) {
        res.status(400).json({ status: 'fail', message: err.message });
    }
});

// Helper function to format email body
const formatEmailBody = (title, content, fileName) => {
    let questionsHtml = '';

    if (content.type === 'questions' && Array.isArray(content.data)) {
        content.data.forEach((q, i) => {
            questionsHtml += `
                <div style="margin-bottom: 16px; padding: 16px; border: 1px solid #e2e8f0; border-radius: 12px;">
                    <p style="margin: 0; font-weight: 600; color: #1e293b;">Question ${i + 1}</p>
                    <p style="margin: 8px 0 0; color: #475569;">${q}</p>
                </div>
            `;
        });
    } else if (content.type === 'quiz' && Array.isArray(content.data)) {
        content.data.forEach((item, i) => {
            questionsHtml += `
                <div style="margin-bottom: 20px; padding: 20px; background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 12px;">
                    <p style="margin: 0; font-weight: 600; color: #1e293b;">Q${i + 1}: ${item.question}</p>
                    <div style="margin-top: 12px; display: grid; gap: 8px;">
                        ${item.options.map((opt, j) => `
                            <div style="padding: 8px 12px; background: white; border: 1px solid #cbd5e1; border-radius: 6px; font-size: 14px; color: #475569;">
                                <strong>${String.fromCharCode(65 + j)}.</strong> ${opt}
                            </div>
                        `).join('')}
                    </div>
                </div>
            `;
        });
    }

    return `
        <div style="background-color: #f1f5f9; padding: 40px 20px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;">
            <div style="max-width: 600px; margin: 0 auto; background: white; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);">
                <div style="background: linear-gradient(135deg, #6366f1 0%, #4f46e5 100%); padding: 32px; color: white; text-align: center;">
                    <h1 style="margin: 0; font-size: 24px; font-weight: 700;">EduSaarthi Assessment</h1>
                    <p style="margin: 8px 0 0; opacity: 0.9; font-size: 14px;">Academic Evaluation Portal</p>
                </div>
                <div style="padding: 32px; color: #1e293b; line-height: 1.6;">
                    <p style="margin-top: 0; font-weight: 600; font-size: 16px;">Dear Student,</p>
                    <p style="margin-bottom: 24px; color: #475569;">An assessment has been generated for you based on the course material: <strong>${fileName}</strong>.</p>
                    
                    <div style="margin: 24px 0; padding: 16px; background: #f8fafc; border-radius: 12px; border-left: 4px solid #6366f1;">
                        <span style="display: block; font-size: 11px; color: #64748b; text-transform: uppercase; letter-spacing: 0.05em; margin-bottom: 4px;">Topic / Category</span>
                        <span style="font-weight: 600; color: #0f172a;">${title}</span>
                    </div>

                    <div style="margin-top: 32px;">
                        ${questionsHtml || `<p style="text-align: center; color: #94a3b8;">${content.data && typeof content.data === 'string' ? content.data : 'Assessment processed successfully.'}</p>`}
                    </div>

                    <div style="margin-top: 32px; padding-top: 24px; border-top: 1px solid #e2e8f0;">
                        <p style="margin: 0; font-size: 14px; color: #64748b;">Please review these materials to enhance your understanding of the subject. Best of luck with your studies!</p>
                    </div>
                </div>
                <div style="background: #f8fafc; padding: 24px; text-align: center; border-top: 1px solid #e2e8f0;">
                    <p style="margin: 0; font-size: 12px; color: #94a3b8;">&copy; 2026 EduSaarthi AI Learning. All rights reserved.</p>
                    <p style="margin: 4px 0 0; font-size: 11px; color: #cbd5e1;">This is a system-generated academic notification.</p>
                </div>
            </div>
        </div>
    `;
};

// Get user activities
router.get('/', protect, async (req, res) => {
    try {
        const activities = await Activity.find({ userId: req.user._id }).sort('-createdAt');
        res.status(200).json({
            status: 'success',
            results: activities.length,
            data: { activities }
        });
    } catch (err) {
        res.status(400).json({ status: 'fail', message: err.message });
    }
});

// Get activities for a specific subject
router.get('/subject/:subjectId', protect, async (req, res) => {
    try {
        const activities = await Activity.find({
            userId: req.user._id,
            subjectId: req.params.subjectId,
            type: { $in: ['question_generation', 'quiz', 'automation'] } // Only return assessment/automation related
        }).sort('-createdAt');

        res.status(200).json({
            status: 'success',
            results: activities.length,
            data: { activities }
        });
    } catch (err) {
        res.status(400).json({ status: 'fail', message: err.message });
    }
});

// Get a single activity by ID
router.get('/:id', protect, async (req, res) => {
    try {
        const mongoose = require('mongoose');
        if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
            return res.status(400).json({ status: 'fail', message: 'Invalid Assessment ID format' });
        }

        const activity = await Activity.findOne({
            _id: req.params.id,
            userId: req.user._id
        });

        if (!activity) {
            return res.status(404).json({ status: 'fail', message: 'Assessment not found or access denied' });
        }

        res.status(200).json({
            status: 'success',
            data: { activity }
        });
    } catch (err) {
        console.error('Error fetching activity:', err);
        res.status(500).json({ status: 'error', message: err.message });
    }
});

// Post a new activity
router.post('/', protect, async (req, res) => {
    try {
        const newActivity = await Activity.create({
            userId: req.user._id,
            title: req.body.title,
            description: req.body.description,
            type: req.body.type
        });
        res.status(201).json({ status: 'success', data: { activity: newActivity } });
    } catch (err) {
        res.status(400).json({ status: 'fail', message: err.message });
    }
});

// Manual send results to recipients
router.post('/send-manual', protect, async (req, res) => {
    try {
        const { recipientEmail, title, content, fileName } = req.body;
        const { sendEmail } = require('../services/emailService');

        if (!recipientEmail || !content) {
            return res.status(400).json({ status: 'fail', message: 'Missing recipient or content' });
        }

        const emails = typeof recipientEmail === 'string'
            ? recipientEmail.split(',').map(e => e.trim()).filter(e => e)
            : [recipientEmail];

        // This uses the same formatting as the automatic send
        // (Note: In a more modular setup, we'd export formatEmailBody from a shared utility)
        const emailHtml = formatEmailBody(title, content, fileName);

        for (const email of emails) {
            await sendEmail(email, `Edusaarthi: ${title}`, emailHtml);
        }

        res.status(200).json({ status: 'success', message: `Email(s) sent to ${emails.length} recipient(s)` });
    } catch (err) {
        res.status(500).json({ status: 'error', message: err.message });
    }
});

module.exports = router;
