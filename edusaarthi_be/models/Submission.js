const mongoose = require('mongoose');

const submissionSchema = new mongoose.Schema({
    assignmentId: { type: mongoose.Schema.Types.ObjectId, ref: 'Assignment', required: true },
    studentId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    answers: [{
        questionIndex: Number,
        selectedOption: Number,
        answerText: String
    }],
    score: { type: Number },
    totalQuestions: { type: Number },
    status: {
        type: String,
        enum: ['pending', 'submitted'],
        default: 'pending'
    },
    submittedAt: { type: Date }
}, { timestamps: true });

module.exports = mongoose.model('Submission', submissionSchema);
