const express = require('express');
const router = express.Router();
const Device = require('../models/Device');
const Alert = require('../models/Alert');
const Feedback = require('../models/Feedback');
const { addAlertToQueue, alertQueue, getQueueStatus } = require('../services/queue');

// Health check
router.get('/health', (req, res) => {
    res.json({ status: 'ok', timestamp: new Date() });
});

// ============== DEVICE ROUTES ==============

/**
 * Update device profile
 * PUT /api/v1/devices/:deviceId/profile
 */
router.put('/devices/:deviceId/profile', async (req, res) => {
    try {
        const { deviceId } = req.params;
        const { name, email, phone, profilePhoto } = req.body;

        const updateData = {};
        if (name !== undefined) updateData.name = name;
        if (email !== undefined) updateData.email = email;
        if (phone !== undefined) updateData.phone = phone;
        if (profilePhoto !== undefined) updateData.profilePhoto = profilePhoto;

        const device = await Device.findOneAndUpdate(
            { deviceId },
            updateData,
            { new: true }
        );

        if (!device) {
            return res.status(404).json({
                success: false,
                message: 'Device not found',
            });
        }

        res.json({
            success: true,
            message: 'Profile updated successfully',
            data: device,
        });
    } catch (error) {
        console.error('Profile update error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to update profile',
            error: error.message,
        });
    }
});

/**
 * Register a new device
 * POST /api/v1/devices/register
 */
router.post('/devices/register', async (req, res) => {
    try {
        const { deviceId, fcmToken, platform, location, name, email, phone, profilePhoto } = req.body;

        if (!deviceId || !fcmToken) {
            return res.status(400).json({
                success: false,
                message: 'deviceId and fcmToken are required',
            });
        }

        // Collect update fields
        const updateData = {
            deviceId,
            fcmToken,
            platform: platform || 'android',
            active: true,
        };

        if (location) updateData.lastLocation = location;
        if (name !== undefined) updateData.name = name;
        if (email !== undefined) updateData.email = email;
        if (phone !== undefined) updateData.phone = phone;
        if (profilePhoto !== undefined) updateData.profilePhoto = profilePhoto;

        // Upsert device (update if exists, create if not)
        const device = await Device.findOneAndUpdate(
            { deviceId },
            updateData,
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
        const { title, message, severity, alertType, flag, expiresIn, additionalInfo, targetRegion, createdBy } = req.body;

        if (!title || !message) {
            return res.status(400).json({
                success: false,
                message: 'title and message are required',
            });
        }

        // Handle targetRegion logic (geofencing)
        let processedTargetRegion = { type: 'ALL', coordinates: null, radius: null };
        if (targetRegion && targetRegion.type === 'Point' && targetRegion.coordinates && targetRegion.radius) {
            processedTargetRegion = {
                type: 'Point',
                coordinates: targetRegion.coordinates,
                radius: targetRegion.radius
            };
        }

        // Calculate expiresAt from expiresIn (in hours)
        let expiresAt = null;
        if (expiresIn && Number(expiresIn) > 0) {
            expiresAt = new Date(Date.now() + Number(expiresIn) * 60 * 60 * 1000);
        }

        // Create alert in database
        const alert = await Alert.create({
            title,
            message,
            severity: severity || 'MEDIUM',
            alertType: alertType || 'Other',
            flag: flag || 'YELLOW',
            expiresAt,
            additionalInfo: additionalInfo || '',
            targetRegion: processedTargetRegion,
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
        const { includeExpired } = req.query;

        // Build query: exclude expired alerts unless explicitly requested
        const query = {};
        if (includeExpired !== 'true') {
            query.$or = [
                { expiresAt: null },
                { expiresAt: { $gt: new Date() } },
            ];
        }

        const alerts = await Alert.find(query).sort({ createdAt: -1 }).limit(100);
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

/**
 * Delete an alert and its feedback
 * DELETE /api/v1/alerts/:id
 */
router.delete('/alerts/:id', async (req, res) => {
    try {
        const alert = await Alert.findByIdAndDelete(req.params.id);
        if (!alert) {
            return res.status(404).json({
                success: false,
                message: 'Alert not found',
            });
        }

        // Also delete all feedback for this alert
        await Feedback.deleteMany({ alertId: req.params.id });

        res.json({
            success: true,
            message: 'Alert deleted successfully',
        });
    } catch (error) {
        console.error('Alert deletion error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to delete alert',
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
        const status = await getQueueStatus();

        res.json({
            success: true,
            data: status,
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

// ============== DEVICE LOCATION UPDATE ==============

/**
 * Update device location
 * PUT /api/v1/devices/:deviceId/location
 */
router.put('/devices/:deviceId/location', async (req, res) => {
    try {
        const { deviceId } = req.params;
        const { latitude, longitude } = req.body;

        if (latitude == null || longitude == null) {
            return res.status(400).json({
                success: false,
                message: 'latitude and longitude are required',
            });
        }

        const device = await Device.findOneAndUpdate(
            { deviceId },
            {
                lastLocation: {
                    type: 'Point',
                    coordinates: [parseFloat(longitude), parseFloat(latitude)],
                },
            },
            { new: true }
        );

        if (!device) {
            return res.status(404).json({
                success: false,
                message: 'Device not found',
            });
        }

        res.json({
            success: true,
            message: 'Location updated',
            data: { deviceId, lastLocation: device.lastLocation },
        });
    } catch (error) {
        console.error('Location update error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to update location',
            error: error.message,
        });
    }
});

// ============== DEVICE-AWARE ALERTS ==============

/**
 * Haversine distance between two points in meters
 */
function haversineDistance(lat1, lon1, lat2, lon2) {
    const R = 6371000; // Earth radius in meters
    const dLat = ((lat2 - lat1) * Math.PI) / 180;
    const dLon = ((lon2 - lon1) * Math.PI) / 180;
    const a =
        Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos((lat1 * Math.PI) / 180) *
        Math.cos((lat2 * Math.PI) / 180) *
        Math.sin(dLon / 2) *
        Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
}

/**
 * Get alerts relevant to a specific device (geofence-filtered)
 * GET /api/v1/alerts/device/:deviceId
 * 
 * Returns:
 * - ALL global alerts (targetRegion.type !== 'Point')
 * - Geofenced alerts ONLY if device is within the alert's radius
 */
router.get('/alerts/device/:deviceId', async (req, res) => {
    try {
        const { deviceId } = req.params;

        // Get the device's current location
        const device = await Device.findOne({ deviceId });
        if (!device) {
            return res.status(404).json({
                success: false,
                message: 'Device not found',
            });
        }

        const deviceCoords = device.lastLocation?.coordinates; // [lng, lat]

        // Fetch all recent alerts (exclude expired ones — expired alerts never reach users)
        const allAlerts = await Alert.find({
            $or: [
                { expiresAt: null },
                { expiresAt: { $gt: new Date() } },
            ]
        }).sort({ createdAt: -1 }).limit(100);

        // Filter: include global alerts + geofenced alerts where device is in range
        const relevantAlerts = allAlerts.filter(alert => {
            // Global alert (no geofence) — always include
            if (
                !alert.targetRegion ||
                alert.targetRegion.type !== 'Point' ||
                !alert.targetRegion.coordinates ||
                !alert.targetRegion.radius
            ) {
                return true;
            }

            // Geofenced alert — check if device is within radius
            if (!deviceCoords || (deviceCoords[0] === 0 && deviceCoords[1] === 0)) {
                // Device has no valid location — exclude geofenced alerts
                return false;
            }

            const [alertLng, alertLat] = alert.targetRegion.coordinates;
            const [deviceLng, deviceLat] = deviceCoords;
            const distance = haversineDistance(deviceLat, deviceLng, alertLat, alertLng);

            return distance <= alert.targetRegion.radius;
        });

        res.json({
            success: true,
            count: relevantAlerts.length,
            data: relevantAlerts,
        });
    } catch (error) {
        console.error('Device alerts fetch error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch device alerts',
            error: error.message,
        });
    }
});

module.exports = router;
