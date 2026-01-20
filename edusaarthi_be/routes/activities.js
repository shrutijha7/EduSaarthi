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

        // 6. Send Email Notification if enabled
        if (req.user.notificationsEnabled !== false) {
            const emailHtml = formatEmailBody(activityTitle, generatedContent || { type: 'status', data: activityDescription }, originalName);
            await sendEmail(req.user.email, `Automation Complete: ${activityTitle}`, emailHtml);
        }

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
                textContent += `   Answer: ${item.answer}\n\n`;
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
    let html = `<div style="font-family: sans-serif; padding: 20px; color: #333;">`;
    html += `<h2 style="color: #6366f1;">${title}</h2>`;
    html += `<p>Assignment Automation Update for: <strong>${fileName}</strong></p>`;
    html += `<hr style="border: 0; border-top: 1px solid #eee; margin: 20px 0;">`;

    if (content.type === 'questions' && Array.isArray(content.data)) {
        html += '<p>The following questions were generated:</p><ul>';
        content.data.forEach(q => html += `<li style="margin-bottom: 10px;">${q}</li>`);
        html += '</ul>';
    } else if (content.type === 'quiz' && Array.isArray(content.data)) {
        html += '<p>The following quiz was generated:</p>';
        content.data.forEach((item, index) => {
            html += `<div style="margin-bottom: 20px; padding: 10px; background: #f3f4f6; border-radius: 8px;">`;
            html += `<p><strong>Q${index + 1}: ${item.question}</strong></p>`;
            html += `<ul style="list-style-type: none; padding-left: 0;">`;
            item.options.forEach(opt => {
                html += `<li style="margin-bottom: 5px; padding: 5px; border: 1px solid #ddd; ${opt === item.answer ? 'background: #d1fae5; font-bold: true;' : ''}">${opt}</li>`;
            });
            html += `</ul>`;
            html += `<p style="font-size: 0.8rem; color: #059669;">Correct Answer: ${item.answer}</p>`;
            html += `</div>`;
        });
    } else if (content.type === 'status') {
        html += `<p>${content.data}</p>`;
    } else {
        html += `<p>Your task has been processed successfully. You can view the results in your dashboard.</p>`;
    }

    html += `<hr style="border: 0; border-top: 1px solid #eee; margin: 20px 0;">`;
    html += `<p style="font-size: 0.8rem; color: #6b7280;">This is an automated notification from Edusaarthi AI. You can disable these emails in your Settings.</p>`;
    html += `</div>`;
    return html;
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
        const formatEmailBody = (title, content, fileName) => {
            let html = `<h2>${title}</h2><p>Here is the content generated from your file: <strong>${fileName}</strong></p>`;
            if (content.type === 'questions') {
                html += '<ul>';
                content.data.forEach(q => html += `<li>${q}</li>`);
                html += '</ul>';
            } else if (content.type === 'quiz') {
                content.data.forEach((item, index) => {
                    html += `<p><strong>Q${index + 1}: ${item.question}</strong></p><ul>`;
                    item.options.forEach(opt => {
                        html += `<li>${opt} ${opt === item.answer ? '(Correct)' : ''}</li>`;
                    });
                    html += `</ul>`;
                });
            }
            html += '<br><p>Sent via Edusaarthi Assignment Automation</p>';
            return html;
        };

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
