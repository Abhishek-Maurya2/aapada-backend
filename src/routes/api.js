const express = require('express');
const router = express.Router();
const Device = require('../models/Device');
const Alert = require('../models/Alert');
const Feedback = require('../models/Feedback');
const { addAlertToQueue, alertQueue } = require('../services/queue');

// Health check
router.get('/health', (req, res) => {
    res.json({ status: 'ok', timestamp: new Date() });
});

// ============== DEVICE ROUTES ==============

/**
 * Register a new device
 * POST /api/v1/devices/register
 */
router.post('/devices/register', async (req, res) => {
    try {
        const { deviceId, fcmToken, platform, location } = req.body;

        if (!deviceId || !fcmToken) {
            return res.status(400).json({
                success: false,
                message: 'deviceId and fcmToken are required',
            });
        }

        // Upsert device (update if exists, create if not)
        const device = await Device.findOneAndUpdate(
            { deviceId },
            {
                deviceId,
                fcmToken,
                platform: platform || 'android',
                lastLocation: location || { type: 'Point', coordinates: [0, 0] },
                active: true,
            },
            { upsert: true, new: true }
        );

        res.status(201).json({
            success: true,
            message: 'Device registered successfully',
            data: device,
        });
    } catch (error) {
        console.error('Device registration error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to register device',
            error: error.message,
        });
    }
});

/**
 * Get all registered devices
 * GET /api/v1/devices
 */
router.get('/devices', async (req, res) => {
    try {
        const devices = await Device.find({ active: true }).select('-fcmToken');
        res.json({
            success: true,
            count: devices.length,
            data: devices,
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Failed to fetch devices',
            error: error.message,
        });
    }
});

// ============== ALERT ROUTES ==============

/**
 * Create and broadcast a new alert
 * POST /api/v1/alerts
 */
router.post('/alerts', async (req, res) => {
    try {
        const { title, message, severity, targetRegion, createdBy } = req.body;

        if (!title || !message) {
            return res.status(400).json({
                success: false,
                message: 'title and message are required',
            });
        }

        // Create alert in database
        const alert = await Alert.create({
            title,
            message,
            severity: severity || 'MEDIUM',
            targetRegion: targetRegion || 'ALL',
            createdBy: createdBy || 'SYSTEM',
            status: 'PENDING',
        });

        // Add to processing queue
        await addAlertToQueue({
            alertId: alert._id.toString(),
            severity: alert.severity,
        });

        res.status(202).json({
            success: true,
            message: 'Alert created and queued for broadcast',
            data: alert,
        });
    } catch (error) {
        console.error('Alert creation error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to create alert',
            error: error.message,
        });
    }
});

/**
 * Get all alerts
 * GET /api/v1/alerts
 */
router.get('/alerts', async (req, res) => {
    try {
        const alerts = await Alert.find().sort({ createdAt: -1 }).limit(100);
        res.json({
            success: true,
            count: alerts.length,
            data: alerts,
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Failed to fetch alerts',
            error: error.message,
        });
    }
});

/**
 * Get a specific alert with feedback stats
 * GET /api/v1/alerts/:id
 */
router.get('/alerts/:id', async (req, res) => {
    try {
        const alert = await Alert.findById(req.params.id);
        if (!alert) {
            return res.status(404).json({
                success: false,
                message: 'Alert not found',
            });
        }

        // Get feedback statistics
        const feedbackStats = await Feedback.aggregate([
            { $match: { alertId: alert._id } },
            {
                $group: {
                    _id: '$status',
                    count: { $sum: 1 },
                },
            },
        ]);

        res.json({
            success: true,
            data: {
                alert,
                feedbackStats,
            },
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Failed to fetch alert',
            error: error.message,
        });
    }
});

// ============== FEEDBACK ROUTES ==============

/**
 * Submit feedback for an alert (device confirms receipt)
 * POST /api/v1/alerts/feedback
 */
router.post('/alerts/feedback', async (req, res) => {
    try {
        const { alertId, deviceId, status, metadata } = req.body;

        if (!alertId || !deviceId) {
            return res.status(400).json({
                success: false,
                message: 'alertId and deviceId are required',
            });
        }

        // Check if feedback already exists for this device/alert pair
        const existingFeedback = await Feedback.findOne({ alertId, deviceId });
        const feedbackStatus = status || 'ACKNOWLEDGED';

        // If new feedback, increment the feedbackBreakdown on the Alert
        if (!existingFeedback) {
            const updateField = `feedbackBreakdown.${feedbackStatus}`;
            await Alert.findByIdAndUpdate(alertId, {
                $inc: { [updateField]: 1 }
            });
        } else if (existingFeedback.status !== feedbackStatus) {
            // If updating status, adjust counts
            const oldField = `feedbackBreakdown.${existingFeedback.status}`;
            const newField = `feedbackBreakdown.${feedbackStatus}`;
            await Alert.findByIdAndUpdate(alertId, {
                $inc: { [oldField]: -1, [newField]: 1 }
            });
        }

        // Upsert feedback (update if exists, create if not)
        const feedback = await Feedback.findOneAndUpdate(
            { alertId, deviceId },
            {
                alertId,
                deviceId,
                status: feedbackStatus,
                receivedAt: new Date(),
                metadata: metadata || {},
            },
            { upsert: true, new: true }
        );

        res.status(200).json({
            success: true,
            message: 'Feedback recorded successfully',
            data: feedback,
        });
    } catch (error) {
        console.error('Feedback submission error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to record feedback',
            error: error.message,
        });
    }
});

/**
 * Get feedback for a specific alert
 * GET /api/v1/alerts/:id/feedback
 */
router.get('/alerts/:id/feedback', async (req, res) => {
    try {
        const feedbacks = await Feedback.find({ alertId: req.params.id });
        res.json({
            success: true,
            count: feedbacks.length,
            data: feedbacks,
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Failed to fetch feedback',
            error: error.message,
        });
    }
});

// ============== QUEUE STATUS ROUTE ==============

/**
 * Get queue status
 * GET /api/v1/queue/status
 */
router.get('/queue/status', async (req, res) => {
    try {
        const waiting = await alertQueue.getWaitingCount();
        const active = await alertQueue.getActiveCount();
        const completed = await alertQueue.getCompletedCount();
        const failed = await alertQueue.getFailedCount();

        res.json({
            success: true,
            data: {
                waiting,
                active,
                completed,
                failed,
            },
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Failed to fetch queue status',
            error: error.message,
        });
    }
});

// ============== HISTORY ROUTES ==============

/**
 * Get alerts that a device has responded to (history)
 * GET /api/v1/alerts/history/:deviceId
 */
router.get('/alerts/history/:deviceId', async (req, res) => {
    try {
        const { deviceId } = req.params;

        // Find all feedback entries for this device
        const feedbacks = await Feedback.find({ deviceId }).sort({ receivedAt: -1 });

        // Get the corresponding alerts
        const alertIds = feedbacks.map(f => f.alertId);
        const alerts = await Alert.find({ _id: { $in: alertIds } });

        // Combine alert info with the user's response
        const history = feedbacks.map(feedback => {
            const alert = alerts.find(a => a._id.toString() === feedback.alertId.toString());
            return {
                alertId: feedback.alertId,
                title: alert?.title || 'Unknown Alert',
                message: alert?.message || '',
                severity: alert?.severity || 'MEDIUM',
                targetRegion: alert?.targetRegion || 'ALL',
                userResponse: feedback.status,
                respondedAt: feedback.receivedAt,
                alertCreatedAt: alert?.createdAt,
            };
        });

        res.json({
            success: true,
            count: history.length,
            data: history,
        });
    } catch (error) {
        console.error('History fetch error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch alert history',
            error: error.message,
        });
    }
});

module.exports = router;
