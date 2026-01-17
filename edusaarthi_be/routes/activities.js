const express = require('express');
const router = express.Router();
const Activity = require('../models/Activity');
const { protect } = require('../middlewares/authMiddleware');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

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

        // Mock processing logic based on taskType
        // In a real app, you would parse the file and use an AI service here

        let activityTitle = '';
        let activityDescription = '';
        let generatedContent = null;

        if (taskType === 'question_generation') {
            activityTitle = 'Generated Questions';
            activityDescription = `Questions generated from ${req.file.originalname}`;
            generatedContent = {
                type: 'questions',
                data: [
                    "1. What are the primary objectives outlined in the provided document?",
                    "2. Compare and contrast the methodologies discussed in section 2.",
                    "3. Critically analyze the impact of the proposed solution on the target demographic.",
                    "4. Summarize the key findings and their implications for future research.",
                    "5. Based on the document, what are the potential risks and mitigation strategies?"
                ]
            };
        } else if (taskType === 'email_automation') {
            activityTitle = 'Email Drafts';
            activityDescription = `Email drafts created from ${req.file.originalname}`;
            generatedContent = {
                type: 'email',
                data: {
                    subject: `Follow-up: ${req.file.originalname} Review`,
                    body: `Dear Team,\n\nI have reviewed the document "${req.file.originalname}" and here are the key takeaways...\n\nPlease let me know if you have any questions.\n\nBest regards,\n[Your Name]`
                }
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
        res.status(500).json({ status: 'error', message: 'Error processing file' });
    }
});

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

module.exports = router;
