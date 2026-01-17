const mongoose = require('mongoose');

const courseSchema = new mongoose.Schema({
    title: { type: String, required: true },
    instructor: { type: String, required: true },
    progress: { type: Number, default: 0 },
    lessons: { type: Number, required: true },
    category: { type: String, required: true },
    rating: { type: Number, default: 0 },
    color: { type: String, default: '#6366f1' },
    imageName: { type: String, required: true }, // Key to identify image in FE assets
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true }
}, { timestamps: true });

module.exports = mongoose.model('Course', courseSchema);
