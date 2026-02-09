const Device = require('../models/Device');
const Alert = require('../models/Alert');

/**
 * Simulate sending push notification to a device
 * In production, this would integrate with FCM/APNs
 * @param {string} fcmToken - Device FCM token
 * @param {Object} payload - Notification payload
 * @returns {Promise<boolean>} - Success status
 */
const sendPushNotification = async (fcmToken, payload) => {
    // Simulated delay (in production, this would be an API call to FCM)
    await new Promise((resolve) => setTimeout(resolve, 100));

    // Simulate 95% success rate
    const isSuccess = Math.random() > 0.05;

    if (isSuccess) {
        console.log(`[SIMULATED] Push sent to token: ${fcmToken.substring(0, 20)}...`);
    } else {
        console.log(`[SIMULATED] Push FAILED for token: ${fcmToken.substring(0, 20)}...`);
    }

    return isSuccess;
};

/**
 * Process an alert and send to all devices
 * @param {string} alertId - MongoDB Alert ID
 * @returns {Promise<Object>} - Processing result
 */
const processAlert = async (alertId) => {
    const alert = await Alert.findById(alertId);
    if (!alert) {
        throw new Error(`Alert ${alertId} not found`);
    }

    // Update status to PROCESSING
    alert.status = 'PROCESSING';
    await alert.save();

    // Get all active devices
    const devices = await Device.find({ active: true });
    alert.totalTargetDevices = devices.length;

    let successCount = 0;
    let failCount = 0;

    // Send to each device
    for (const device of devices) {
        const payload = {
            title: alert.title,
            body: alert.message,
            data: {
                alertId: alert._id.toString(),
                severity: alert.severity,
            },
        };

        const success = await sendPushNotification(device.fcmToken, payload);
        if (success) {
            successCount++;
        } else {
            failCount++;
        }
    }

    // Update alert with results
    alert.status = 'SENT';
    alert.successfulDeliveries = successCount;
    alert.failedDeliveries = failCount;
    alert.broadcastedAt = new Date();
    await alert.save();

    return {
        alertId: alert._id,
        totalTargetDevices: devices.length,
        successfulDeliveries: successCount,
        failedDeliveries: failCount,
    };
};

module.exports = {
    sendPushNotification,
    processAlert,
};
