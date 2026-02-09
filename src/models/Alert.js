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
        type: String, // Can be extended to GeoJSON for geo-fenced alerts
        default: 'ALL',
    },
    status: {
        type: String,
        enum: ['PENDING', 'PROCESSING', 'SENT', 'FAILED'],
        default: 'PENDING',
    },
    totalRecipients: {
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
    createdBy: {
        type: String,
        default: 'SYSTEM',
    },
    broadcastedAt: Date,
}, { timestamps: true });

module.exports = mongoose.model('Alert', alertSchema);
