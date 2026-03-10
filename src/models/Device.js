const mongoose = require('mongoose');

const deviceSchema = new mongoose.Schema({
    deviceId: {
        type: String,
        required: true,
        unique: true,
        index: true,
    },
    fcmToken: {
        type: String,
        required: true,
    },
    platform: {
        type: String,
        enum: ['android', 'ios', 'web'],
        default: 'android',
    },
    lastLocation: {
        type: {
            type: String,
            enum: ['Point'],
            default: 'Point',
        },
        coordinates: {
            type: [Number], // [longitude, latitude]
            default: [0, 0],
        },
    },
    active: {
        type: Boolean,
        default: true,
    },
    name: {
        type: String,
        trim: true,
    },
    email: {
        type: String,
        trim: true,
    },
    phone: {
        type: String,
        trim: true,
    },
    profilePhoto: {
        type: String, // Can store base64 or URL
    },
}, { timestamps: true });

// Geospatial index for location-based queries
deviceSchema.index({ lastLocation: '2dsphere' });

module.exports = mongoose.model('Device', deviceSchema);
