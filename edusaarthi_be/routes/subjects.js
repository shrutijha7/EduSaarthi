const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const Subject = require('../models/Subject');
const { protect } = require('../middlewares/authMiddleware');

// Configure multer for file uploads
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        const uploadDir = 'uploads/subjects';
        // Create directory if it doesn't exist
        if (!fs.existsSync(uploadDir)) {
            fs.mkdirSync(uploadDir, { recursive: true });
        }
        cb(null, uploadDir);
    },
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
    }
});

const upload = multer({
    storage: storage,
    limits: { fileSize: 50 * 1024 * 1024 }, // 50MB limit
    fileFilter: (req, file, cb) => {
        // Allow common document types
        const allowedTypes = /pdf|doc|docx|txt|ppt|pptx|xls|xlsx/;
        const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
        const mimetype = allowedTypes.test(file.mimetype);

        if (extname || mimetype) {
            return cb(null, true);
        } else {
            cb(new Error('Only document files are allowed!'));
        }
    }
});

// Get all subjects for the current user
router.get('/', protect, async (req, res) => {
    try {
        const subjects = await Subject.find({ userId: req.user._id }).populate('batches');
        res.status(200).json({
            status: 'success',
            results: subjects.length,
            data: { subjects }
        });
    } catch (err) {
        res.status(400).json({ status: 'fail', message: err.message });
    }
});

// Create a new subject
router.post('/', protect, async (req, res) => {
    try {
        console.log('Received subject creation request from user:', req.user._id);
        console.log('Request body:', req.body);

        const newSubject = await Subject.create({
            ...req.body,
            userId: req.user._id,
            // Set defaults if not provided in UI
            progress: 0,
            lessons: req.body.lessons || 0,
            rating: 0,
            color: req.body.color || '#6366f1',
            imageName: req.body.imageName || 'automation_workflow',
            category: req.body.category || 'General',
            instructor: req.body.instructor || 'Self',
            files: [],
            batches: []
        });

        console.log('Subject created successfully:', newSubject);
        res.status(201).json({
            status: 'success',
            data: { subject: newSubject }
        });
    } catch (err) {
        console.error('Error creating subject:', err);
        res.status(400).json({ status: 'fail', message: err.message });
    }
});

// Get single subject by ID
router.get('/:id', protect, async (req, res) => {
    try {
        const subject = await Subject.findOne({ _id: req.params.id, userId: req.user._id }).populate('batches');
        if (!subject) {
            return res.status(404).json({ status: 'fail', message: 'Subject not found' });
        }
        res.status(200).json({
            status: 'success',
            data: { subject }
        });
    } catch (err) {
        res.status(400).json({ status: 'fail', message: err.message });
    }
});

// Update subject (Rename/Update)
router.patch('/:id', protect, async (req, res) => {
    try {
        const subject = await Subject.findOneAndUpdate(
            { _id: req.params.id, userId: req.user._id },
            req.body,
            { new: true, runValidators: true }
        ).populate('batches');

        if (!subject) {
            return res.status(404).json({ status: 'fail', message: 'Subject not found' });
        }

        res.status(200).json({
            status: 'success',
            data: { subject }
        });
    } catch (err) {
        res.status(400).json({ status: 'fail', message: err.message });
    }
});

// Upload file to subject
router.post('/:id/files', protect, upload.single('file'), async (req, res) => {
    try {
        const subject = await Subject.findOne({ _id: req.params.id, userId: req.user._id });

        if (!subject) {
            // Delete uploaded file if subject not found
            if (req.file) fs.unlinkSync(req.file.path);
            return res.status(404).json({ status: 'fail', message: 'Subject not found' });
        }

        if (!req.file) {
            return res.status(400).json({ status: 'fail', message: 'No file uploaded' });
        }

        const fileInfo = {
            filename: req.file.filename,
            originalName: req.file.originalname,
            path: req.file.path,
            size: req.file.size,
            uploadDate: new Date()
        };

        subject.files.push(fileInfo);
        subject.lessons = subject.files.length; // Update lesson count
        await subject.save();

        res.status(200).json({
            status: 'success',
            data: { subject }
        });
    } catch (err) {
        // Delete uploaded file on error
        if (req.file) fs.unlinkSync(req.file.path);
        res.status(400).json({ status: 'fail', message: err.message });
    }
});

// Delete file from subject
router.delete('/:id/files/:fileId', protect, async (req, res) => {
    try {
        const subject = await Subject.findOne({ _id: req.params.id, userId: req.user._id });

        if (!subject) {
            return res.status(404).json({ status: 'fail', message: 'Subject not found' });
        }

        const fileIndex = subject.files.findIndex(f => f._id.toString() === req.params.fileId);
        if (fileIndex === -1) {
            return res.status(404).json({ status: 'fail', message: 'File not found' });
        }

        // Delete physical file
        const filePath = subject.files[fileIndex].path;
        if (fs.existsSync(filePath)) {
            fs.unlinkSync(filePath);
        }

        subject.files.splice(fileIndex, 1);
        subject.lessons = subject.files.length; // Update lesson count
        await subject.save();

        res.status(200).json({
            status: 'success',
            data: { subject }
        });
    } catch (err) {
        res.status(400).json({ status: 'fail', message: err.message });
    }
});

// Add batch to subject
router.post('/:id/batches/:batchId', protect, async (req, res) => {
    try {
        const subject = await Subject.findOne({ _id: req.params.id, userId: req.user._id });

        if (!subject) {
            return res.status(404).json({ status: 'fail', message: 'Subject not found' });
        }

        // Check if batch is already associated
        if (subject.batches.includes(req.params.batchId)) {
            return res.status(400).json({ status: 'fail', message: 'Batch already associated' });
        }

        subject.batches.push(req.params.batchId);
        await subject.save();
        await subject.populate('batches');

        res.status(200).json({
            status: 'success',
            data: { subject }
        });
    } catch (err) {
        res.status(400).json({ status: 'fail', message: err.message });
    }
});

// Remove batch from subject
router.delete('/:id/batches/:batchId', protect, async (req, res) => {
    try {
        const subject = await Subject.findOne({ _id: req.params.id, userId: req.user._id });

        if (!subject) {
            return res.status(404).json({ status: 'fail', message: 'Subject not found' });
        }

        subject.batches = subject.batches.filter(b => b.toString() !== req.params.batchId);
        await subject.save();
        await subject.populate('batches');

        res.status(200).json({
            status: 'success',
            data: { subject }
        });
    } catch (err) {
        res.status(400).json({ status: 'fail', message: err.message });
    }
});

// Delete subject
router.delete('/:id', protect, async (req, res) => {
    try {
        const subject = await Subject.findOne({ _id: req.params.id, userId: req.user._id });

        if (!subject) {
            return res.status(404).json({ status: 'fail', message: 'Subject not found' });
        }

        // Delete all associated files
        subject.files.forEach(file => {
            if (fs.existsSync(file.path)) {
                fs.unlinkSync(file.path);
            }
        });

        await Subject.findByIdAndDelete(req.params.id);

        res.status(204).json({
            status: 'success',
            data: null
        });
    } catch (err) {
        res.status(400).json({ status: 'fail', message: err.message });
    }
});

module.exports = router;
