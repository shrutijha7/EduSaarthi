const mongoose = require('mongoose');

const subjectSchema = new mongoose.Schema({
    title: { type: String, required: true },
    instructor: { type: String, default: 'Self' },
    progress: { type: Number, default: 0 },
    lessons: { type: Number, default: 0 },
    category: { type: String, default: 'General' },
    rating: { type: Number, default: 0 },
    color: { type: String, default: '#6366f1' },
    imageName: { type: String, default: 'automation_workflow' },
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    // Files storage - permanently stored until user deletes
    files: [{
        filename: { type: String, required: true },
        originalName: { type: String, required: true },
        path: { type: String, required: true },
        size: { type: Number },
        uploadDate: { type: Date, default: Date.now }
    }],
    // Associated batches for this subject
    batches: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Batch' }]
}, { timestamps: true });

module.exports = mongoose.model('Subject', subjectSchema);
