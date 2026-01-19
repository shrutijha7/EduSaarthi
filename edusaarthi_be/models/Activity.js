const mongoose = require('mongoose');

const activitySchema = new mongoose.Schema({
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    subjectId: { type: mongoose.Schema.Types.ObjectId, ref: 'Subject' }, // Reference to subject
    title: { type: String, required: true },
    description: { type: String, required: true },
    fileName: { type: String }, // Original file name
    filePath: { type: String }, // Path to stored file
    type: {
        type: String,
        enum: ['course_complete', 'lesson_complete', 'assignment_submit', 'signup', 'question_generation', 'quiz', 'automation'],
        default: 'lesson_complete'
    }
}, { timestamps: true });

module.exports = mongoose.model('Activity', activitySchema);
