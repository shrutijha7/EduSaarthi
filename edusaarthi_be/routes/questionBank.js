const express = require('express');
const router = express.Router();
const QuestionBank = require('../models/QuestionBank');
const { protect } = require('../middlewares/authMiddleware');

// Get all questions from bank
router.get('/', protect, async (req, res) => {
    try {
        const questions = await QuestionBank.find({ userId: req.user._id }).sort('-createdAt');
        res.status(200).json({
            status: 'success',
            results: questions.length,
            data: { questions }
        });
    } catch (err) {
        res.status(400).json({ status: 'fail', message: err.message });
    }
});

// Add a question to bank (Starring)
router.post('/', protect, async (req, res) => {
    try {
        const newQuestion = await QuestionBank.create({
            ...req.body,
            userId: req.user._id
        });
        res.status(201).json({
            status: 'success',
            data: { question: newQuestion }
        });
    } catch (err) {
        res.status(400).json({ status: 'fail', message: err.message });
    }
});

// Remove a question from bank
router.delete('/:id', protect, async (req, res) => {
    try {
        const question = await QuestionBank.findOneAndDelete({
            _id: req.params.id,
            userId: req.user._id
        });

        if (!question) {
            return res.status(404).json({ status: 'fail', message: 'Question not found' });
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
