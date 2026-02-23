const mongoose = require('mongoose');

const alertSchema = new mongoose.Schema({
    title: {
        type: String,
        required: true,
    },
    message: {
        type: String,
        required: true,
    },
    severity: {
        type: String,
        enum: ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'],
        default: 'MEDIUM',
    },
    targetRegion: {
        type: {
            type: String, // Can be "ALL" or "Point"
            default: 'ALL',
        },
        coordinates: {
            type: [Number], // [longitude, latitude]
            default: null,
        },
        radius: {
            type: Number, // In meters
            default: null,
        }
    },
    status: {
        type: String,
        enum: ['PENDING', 'PROCESSING', 'SENT', 'FAILED'],
        default: 'PENDING',
    },
    // Tracking fields
    totalTargetDevices: {
        type: Number,
        default: 0,
    },
    successfulDeliveries: {
        type: Number,
        default: 0,
    },
    failedDeliveries: {
        type: Number,
        default: 0,
    },
    // Feedback breakdown by type
    feedbackBreakdown: {
        SAFE: { type: Number, default: 0 },
        MEDICAL: { type: Number, default: 0 },
        FIRE: { type: Number, default: 0 },
        HELP: { type: Number, default: 0 },
        ACKNOWLEDGED: { type: Number, default: 0 },
    },
    createdBy: {
        type: String,
        default: 'SYSTEM',
    },
    broadcastedAt: Date,
}, { timestamps: true });

// Virtual for devices that haven't received
alertSchema.virtual('notReceivedCount').get(function () {
    return this.totalTargetDevices - this.successfulDeliveries;
});

// Virtual for total feedback count
alertSchema.virtual('totalFeedbackCount').get(function () {
    const fb = this.feedbackBreakdown || {};
    return (fb.SAFE || 0) + (fb.MEDICAL || 0) + (fb.FIRE || 0) + (fb.HELP || 0) + (fb.ACKNOWLEDGED || 0);
});

// Ensure virtuals are included in JSON
alertSchema.set('toJSON', { virtuals: true });
alertSchema.set('toObject', { virtuals: true });

module.exports = mongoose.model('Alert', alertSchema);
