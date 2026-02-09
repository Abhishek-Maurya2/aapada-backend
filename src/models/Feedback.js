const mongoose = require('mongoose');

const feedbackSchema = new mongoose.Schema({
    alertId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Alert',
        required: true,
        index: true,
    },
    deviceId: {
        type: String,
        required: true,
        index: true,
    },
    status: {
        type: String,
        enum: ['RECEIVED', 'ACKNOWLEDGED', 'FAILED'],
        default: 'RECEIVED',
    },
    receivedAt: {
        type: Date,
        default: Date.now,
    },
    metadata: {
        type: mongoose.Schema.Types.Mixed, // For any extra info like location, app version, etc.
        default: {},
    },
}, { timestamps: true });

// Compound index for efficient lookups
feedbackSchema.index({ alertId: 1, deviceId: 1 }, { unique: true });

module.exports = mongoose.model('Feedback', feedbackSchema);
