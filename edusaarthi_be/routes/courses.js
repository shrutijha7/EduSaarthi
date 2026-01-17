const express = require('express');
const router = express.Router();
const Course = require('../models/Course');
const { protect } = require('../middlewares/authMiddleware');

// Get all courses
router.get('/', protect, async (req, res) => {
    try {
        const courses = await Course.find();
        res.status(200).json({
            status: 'success',
            results: courses.length,
            data: { courses }
        });
    } catch (err) {
        res.status(400).json({ status: 'fail', message: err.message });
    }
});

// Seed courses (for demo purposes)
router.post('/seed', async (req, res) => {
    try {
        const courses = [
            {
                title: 'Advanced React Patterns',
                instructor: 'Dr. Sarah Smith',
                progress: 65,
                lessons: 24,
                category: 'Frontend',
                rating: 4.9,
                color: '#6366f1',
                imageName: 'react_course'
            },
            {
                title: 'Node.js Microservices',
                instructor: 'Michael Chen',
                progress: 30,
                lessons: 18,
                category: 'Backend',
                rating: 4.8,
                color: '#10b981',
                imageName: 'node_course'
            },
            {
                title: 'UX/UI Design Fundamentals',
                instructor: 'Emma Wilson',
                progress: 90,
                lessons: 12,
                category: 'Design',
                rating: 4.7,
                color: '#f59e0b',
                imageName: 'design_course'
            },
            {
                title: 'Python for Data Science',
                instructor: 'Alex Rivera',
                progress: 10,
                lessons: 32,
                category: 'Data Science',
                rating: 4.9,
                color: '#ec4899',
                imageName: 'python_course'
            }
        ];
        await Course.deleteMany();
        await Course.create(courses);
        res.status(201).json({ status: 'success', message: 'Courses seeded' });
    } catch (err) {
        res.status(400).json({ status: 'fail', message: err.message });
    }
});

module.exports = router;
