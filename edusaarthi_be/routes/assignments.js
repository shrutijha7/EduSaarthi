const express = require('express');
const router = express.Router();
const Assignment = require('../models/Assignment');
const Submission = require('../models/Submission');
const Activity = require('../models/Activity');
const Batch = require('../models/Batch');
const { protect } = require('../middlewares/authMiddleware');
const { sendEmail } = require('../services/emailService');

// Assign an activity to a batch
router.post('/assign', protect, async (req, res) => {
    try {
        const { activityId, batchId, dueDate } = req.body;

        const activity = await Activity.findById(activityId);
        if (!activity) return res.status(404).json({ status: 'fail', message: 'Activity not found' });

        const batch = await Batch.findById(batchId);
        if (!batch) return res.status(404).json({ status: 'fail', message: 'Batch not found' });

        const assignment = await Assignment.create({
            activityId,
            batchId,
            teacherId: req.user._id,
            dueDate: dueDate || null
        });

        // Notify students via email with link to dashboard
        // In a real app, this link would point to the student dashboard
        const dashboardUrl = `${process.env.FRONTEND_URL || 'http://localhost:5173'}/student/dashboard`;

        const emailPromises = batch.students.map(student => {
            const emailHtml = `
                <div style="font-family: sans-serif; padding: 20px; color: #333;">
                    <h2 style="color: #6366f1;">New Assessment Assigned</h2>
                    <p>Hello <b>${student.name}</b>,</p>
                    <p>Your teacher has assigned a new assessment: <b>${activity.title}</b>.</p>
                    <p>Please log in to your student dashboard to complete it.</p>
                    <a href="${dashboardUrl}" style="display: inline-block; padding: 12px 24px; background: #6366f1; color: white; text-decoration: none; border-radius: 8px; margin-top: 10px;">Go to Dashboard</a>
                    <p style="margin-top: 20px; font-size: 12px; color: #666;">If you don't have an account, please register using this email: ${student.email}</p>
                </div>
            `;
            return sendEmail(student.email, `New Assignment: ${activity.title}`, emailHtml);
        });

        await Promise.all(emailPromises);

        res.status(201).json({
            status: 'success',
            data: { assignment }
        });
    } catch (err) {
        res.status(500).json({ status: 'error', message: err.message });
    }
});

// Get assessments for logged in student
router.get('/student/my-assessments', protect, async (req, res) => {
    try {
        if (req.user.role !== 'student') {
            return res.status(403).json({ status: 'fail', message: 'Only students can access this' });
        }

        // Find batches where this student is enrolled (by email, case-insensitive)
        const myBatches = await Batch.find({
            'students.email': { $regex: new RegExp('^' + req.user.email + '$', 'i') }
        });
        const batchIds = myBatches.map(b => b._id);

        // Find assignments for these batches
        const assignments = await Assignment.find({ batchId: { $in: batchIds } })
            .populate('activityId')
            .populate('teacherId', 'name')
            .sort('-createdAt');

        // Check submission status for each
        const submissions = await Submission.find({ studentId: req.user._id });

        const result = assignments.map(a => {
            const submission = submissions.find(s => s.assignmentId.toString() === a._id.toString());
            return {
                ...a.toObject(),
                submissionStatus: submission ? submission.status : 'pending',
                score: submission ? submission.score : null
            };
        });

        res.status(200).json({
            status: 'success',
            data: { assignments: result }
        });
    } catch (err) {
        res.status(500).json({ status: 'error', message: err.message });
    }
});

// Submit assessment
router.post('/student/submit', protect, async (req, res) => {
    try {
        const { assignmentId, answers } = req.body;

        const assignment = await Assignment.findById(assignmentId).populate('activityId');
        if (!assignment) return res.status(404).json({ status: 'fail', message: 'Assignment not found' });

        // Simple scoring for quizzes
        let score = 0;
        const activity = assignment.activityId;

        if (activity.content.type === 'quiz') {
            activity.content.data.forEach((q, index) => {
                const studentAnswer = answers.find(a => a.questionIndex === index);
                if (studentAnswer && studentAnswer.selectedOption === q.correctAnswer) {
                    score++;
                }
            });
        }

        const submission = await Submission.create({
            assignmentId,
            studentId: req.user._id,
            answers,
            score,
            totalQuestions: activity.content.type === 'quiz' ? activity.content.data.length : 0,
            status: 'submitted',
            submittedAt: new Date()
        });

        res.status(200).json({
            status: 'success',
            data: { submission }
        });
    } catch (err) {
        res.status(500).json({ status: 'error', message: err.message });
    }
});

module.exports = router;
