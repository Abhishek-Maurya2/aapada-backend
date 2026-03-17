const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        trim: true,
    },
    email: {
        type: String,
        required: true,
        unique: true,
        lowercase: true,
        trim: true,
        index: true,
    },
    passwordHash: {
        type: String,
        required: true,
    },
    phone: {
        type: String,
        trim: true,
        default: '',
    },
    profilePhoto: {
        type: String,
        default: null,
    },
    active: {
        type: Boolean,
        default: true,
    },
    lastLoginAt: {
        type: Date,
        default: null,
    },
}, { timestamps: true });

module.exports = mongoose.model('User', userSchema);
