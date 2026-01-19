const mongoose = require('mongoose');

const batchSchema = new mongoose.Schema({
    name: { type: String, required: true },
    description: { type: String, default: '' },
    students: [{
        name: { type: String, required: true },
        email: { type: String, required: true },
        rollNumber: { type: String }
    }],
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true }
}, { timestamps: true });

module.exports = mongoose.model('Batch', batchSchema);
