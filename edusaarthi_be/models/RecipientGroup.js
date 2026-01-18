const mongoose = require('mongoose');

const recipientGroupSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    name: {
        type: String,
        required: [true, 'Please provide a group name'],
        trim: true
    },
    emails: {
        type: [String],
        required: [true, 'Please provide at least one email'],
        validate: {
            validator: function (v) {
                return v && v.length > 0;
            },
            message: 'A group must have at least one email.'
        }
    }
}, { timestamps: true });

// Ensure unique group names per user
recipientGroupSchema.index({ userId: 1, name: 1 }, { unique: true });

module.exports = mongoose.model('RecipientGroup', recipientGroupSchema);
