const express = require('express');
const router = express.Router();
const Course = require('../models/Course');
const { protect } = require('../middlewares/authMiddleware');

// Get all courses for the current user
router.get('/', protect, async (req, res) => {
    try {
        const courses = await Course.find({ userId: req.user._id });
        res.status(200).json({
            status: 'success',
            results: courses.length,
            data: { courses }
        });
    } catch (err) {
        res.status(400).json({ status: 'fail', message: err.message });
    }
});

// Create a new course/assignment
router.post('/', protect, async (req, res) => {
    try {
        const newCourse = await Course.create({
            ...req.body,
            userId: req.user._id,
            // Set defaults if not provided in UI
            progress: 0,
            lessons: req.body.lessons || 10,
            rating: 0,
            color: req.body.color || '#6366f1',
            imageName: req.body.imageName || 'react_course' // Default image
        });
        res.status(201).json({
            status: 'success',
            data: { course: newCourse }
        });
    } catch (err) {
        res.status(400).json({ status: 'fail', message: err.message });
    }
});

// Get single course by ID
router.get('/:id', protect, async (req, res) => {
    try {
        const course = await Course.findOne({ _id: req.params.id, userId: req.user._id });
        if (!course) {
            return res.status(404).json({ status: 'fail', message: 'Course not found' });
        }
        res.status(200).json({
            status: 'success',
            data: { course }
        });
    } catch (err) {
        res.status(400).json({ status: 'fail', message: err.message });
    }
});

// Seed courses (for demo purposes)
// Seed route disabled for data safety
router.post('/seed', protect, async (req, res) => {
    return res.status(403).json({ status: 'fail', message: 'Seeding is disabled.' });
});

module.exports = router;
