const express = require('express');
const router = express.Router();
const Batch = require('../models/Batch');
const { protect } = require('../middlewares/authMiddleware');

// Get all batches for the current user
router.get('/', protect, async (req, res) => {
    try {
        const batches = await Batch.find({ userId: req.user._id });
        res.status(200).json({
            status: 'success',
            results: batches.length,
            data: { batches }
        });
    } catch (err) {
        res.status(400).json({ status: 'fail', message: err.message });
    }
});

// Create a new batch
router.post('/', protect, async (req, res) => {
    try {
        const newBatch = await Batch.create({
            ...req.body,
            userId: req.user._id
        });

        res.status(201).json({
            status: 'success',
            data: { batch: newBatch }
        });
    } catch (err) {
        res.status(400).json({ status: 'fail', message: err.message });
    }
});

// Get single batch by ID
router.get('/:id', protect, async (req, res) => {
    try {
        const batch = await Batch.findOne({ _id: req.params.id, userId: req.user._id });
        if (!batch) {
            return res.status(404).json({ status: 'fail', message: 'Batch not found' });
        }
        res.status(200).json({
            status: 'success',
            data: { batch }
        });
    } catch (err) {
        res.status(400).json({ status: 'fail', message: err.message });
    }
});

// Update batch
router.patch('/:id', protect, async (req, res) => {
    try {
        const batch = await Batch.findOneAndUpdate(
            { _id: req.params.id, userId: req.user._id },
            req.body,
            { new: true, runValidators: true }
        );

        if (!batch) {
            return res.status(404).json({ status: 'fail', message: 'Batch not found' });
        }

        res.status(200).json({
            status: 'success',
            data: { batch }
        });
    } catch (err) {
        res.status(400).json({ status: 'fail', message: err.message });
    }
});

// Delete batch
router.delete('/:id', protect, async (req, res) => {
    try {
        const batch = await Batch.findOneAndDelete({ _id: req.params.id, userId: req.user._id });

        if (!batch) {
            return res.status(404).json({ status: 'fail', message: 'Batch not found' });
        }

        res.status(204).json({
            status: 'success',
            data: null
        });
    } catch (err) {
        res.status(400).json({ status: 'fail', message: err.message });
    }
});

module.exports = router;
