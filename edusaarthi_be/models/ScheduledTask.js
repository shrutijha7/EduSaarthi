const mongoose = require('mongoose');

const scheduledTaskSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    filePath: {
        type: String,
        required: true
    },
    originalFileName: {
        type: String,
        required: true
    },
    taskType: {
        type: String,
        required: true,
        enum: ['question_generation', 'quiz', 'automation', 'fill_in_blanks', 'true_false', 'subjective']
    },
    questionCount: {
        type: Number,
        default: 5
    },
    recipientEmails: {
        type: String,
        required: true // Can be comma separated
    },
    scheduledDate: {
        type: Date,
        required: true
    },
    status: {
        type: String,
        enum: ['pending', 'completed', 'failed'],
        default: 'pending'
    },
    error: String
}, { timestamps: true });

module.exports = mongoose.model('ScheduledTask', scheduledTaskSchema);
