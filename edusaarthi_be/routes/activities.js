const express = require('express');
const router = express.Router();
const Activity = require('../models/Activity');
const { protect } = require('../middlewares/authMiddleware');

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
