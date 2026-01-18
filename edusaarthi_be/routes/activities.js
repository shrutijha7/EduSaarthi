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
        if (!req.file) {
            return res.status(400).json({ status: 'fail', message: 'No file uploaded' });
        }

        const { taskType } = req.body;
        const aiService = require('../services/aiService'); // Import here or at top

        // 1. Extract Text
        // Ensure we handle different file types, but focusing on PDF for now as per ai.js legacy
        let extractedText = "";
        if (req.file.mimetype === 'application/pdf') {
            extractedText = await aiService.extractTextFromPDF(req.file.buffer || fs.readFileSync(req.file.path));
        } else {
            // Fallback for text files or treat as basic text
            extractedText = "File content extraction skipped (supports PDF). using metadata only.";
            // In a real app we'd read .txt or .docx here too.
            // Forcing simple text read for .txt
            if (req.file.mimetype === 'text/plain') {
                extractedText = fs.readFileSync(req.file.path, 'utf8');
            }
        }

        let activityTitle = '';
        let activityDescription = '';
        let generatedContent = null;

        if (taskType === 'question_generation') {
            activityTitle = 'Generated Questions';
            activityDescription = `AI-generated questions from ${req.file.originalname}`;
            const questions = await aiService.generateQuestions(extractedText);
            generatedContent = {
                type: 'questions',
                data: questions
            };
        } else if (taskType === 'email_automation') {
            activityTitle = 'Email Drafts';
            activityDescription = `AI-drafted email for ${req.file.originalname}`;
            const emailData = await aiService.generateEmail(extractedText, req.file.originalname);
            generatedContent = {
                type: 'email',
                data: emailData
            };
        } else {
            activityTitle = 'File Processed';
            activityDescription = `Processed ${req.file.originalname}`;
        }

        const newActivity = await Activity.create({
            userId: req.user._id,
            title: activityTitle,
            description: activityDescription,
            type: taskType || 'automation'
        });

        // AUTOMATED EMAIL SENDING
        const recipientData = req.body.recipientEmail || req.user.email;

        if (generatedContent && recipientData) {
            // Split by comma if it's a string, or treat as array
            const emails = typeof recipientData === 'string'
                ? recipientData.split(',').map(e => e.trim()).filter(e => e)
                : [recipientData];

            console.log(`Sending emails to: ${emails.join(', ')}...`);
            const emailHtml = formatEmailBody(activityTitle, generatedContent, req.file.originalname);

            // Send to each recipient
            for (const email of emails) {
                await sendEmail(email, `Edusaarthi: ${activityTitle}`, emailHtml);
            }
        }

        // Cleanup uploaded file if using diskStorage temporary
        // fs.unlinkSync(req.file.path);

        res.status(200).json({
            status: 'success',
            message: 'File processed successfully',
            data: {
                activity: newActivity,
                file: req.file.filename,
                generatedContent
            }
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({ status: 'error', message: 'Error processing file: ' + err.message });
    }
});

// Helper function to format email body
const formatEmailBody = (title, content, fileName) => {
    let html = `<h2>${title}</h2><p>Here is the content generated from your file: <strong>${fileName}</strong></p>`;

    if (content.type === 'questions') {
        html += '<ul>';
        content.data.forEach(q => html += `<li>${q}</li>`);
        html += '</ul>';
    } else if (content.type === 'email') {
        html += `<h3>Subject: ${content.data.subject}</h3>`;
        html += `<div>${content.data.body.replace(/\n/g, '<br>')}</div>`;
    }

    html += '<br><p>Thank you for using Edusaarthi!</p>';
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
            } else if (content.type === 'email') {
                html += `<h3>Subject: ${content.data.subject}</h3>`;
                html += `<div>${content.data.body.replace(/\n/g, '<br>')}</div>`;
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
