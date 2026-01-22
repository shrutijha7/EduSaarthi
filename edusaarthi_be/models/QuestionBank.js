const mongoose = require('mongoose');

const questionBankSchema = new mongoose.Schema({
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    subjectId: { type: mongoose.Schema.Types.ObjectId, ref: 'Subject' },
    type: {
        type: String,
        enum: ['question_generation', 'quiz', 'fill_in_blanks', 'true_false', 'subjective'],
        required: true
    },
    question: { type: String, required: true },
    options: [String], // For MCQs
    answer: mongoose.Schema.Types.Mixed, // String, Boolean, etc.
    explanation: String, // For T/F
    suggestedAnswer: String, // For subjective
    keyPoints: [String], // For subjective
    difficulty: {
        type: String,
        enum: ['easy', 'medium', 'hard'],
        default: 'medium'
    },
    tags: [String]
}, { timestamps: true });

module.exports = mongoose.model('QuestionBank', questionBankSchema);
