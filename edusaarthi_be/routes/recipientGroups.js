const express = require('express');
const router = express.Router();
const RecipientGroup = require('../models/RecipientGroup');
const { protect } = require('../middlewares/authMiddleware');

// Get all groups for the logged-in user
router.get('/', protect, async (req, res) => {
    try {
        const groups = await RecipientGroup.find({ userId: req.user._id }).sort('-createdAt');
        res.status(200).json({
            status: 'success',
            results: groups.length,
            data: { groups }
        });
    } catch (err) {
        res.status(400).json({ status: 'fail', message: err.message });
    }
});

// Create a new group
router.post('/', protect, async (req, res) => {
    try {
        // Handle comma-separated string or array
        let emails = req.body.emails;
        if (typeof emails === 'string') {
            emails = emails.split(',').map(e => e.trim()).filter(e => e);
        }

        const newGroup = await RecipientGroup.create({
            userId: req.user._id,
            name: req.body.name,
            emails
        });

        res.status(201).json({
            status: 'success',
            data: { group: newGroup }
        });
    } catch (err) {
        if (err.code === 11000) {
            return res.status(400).json({ status: 'fail', message: 'A group with this name already exists.' });
        }
        res.status(400).json({ status: 'fail', message: err.message });
    }
});

// Delete a group
router.delete('/:id', protect, async (req, res) => {
    try {
        const group = await RecipientGroup.findOneAndDelete({ _id: req.params.id, userId: req.user._id });
        if (!group) {
            return res.status(404).json({ status: 'fail', message: 'Group not found' });
        }
        res.status(204).json({ status: 'success', data: null });
    } catch (err) {
        res.status(400).json({ status: 'fail', message: err.message });
    }
});

module.exports = router;
