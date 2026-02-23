require('dotenv').config();
const mongoose = require('mongoose');
const Device = require('./src/models/Device');

async function testGeofence() {
    try {
        await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/aapada');
        console.log('Connected to DB');

        // Clean up old ones
        await Device.deleteMany({ deviceId: { $in: ['test-device-1', 'test-device-2', 'test-device-3'] } });

        // Create 3 stub devices
        // Device 1: near Delhi (28.6139, 77.2090)
        await Device.create({
            deviceId: 'test-device-1',
            fcmToken: 'token-1',
            lastLocation: { type: 'Point', coordinates: [77.2090, 28.6139] } // [lon, lat]
        });

        // Device 2: near Noida (28.5355, 77.3910)
        await Device.create({
            deviceId: 'test-device-2',
            fcmToken: 'token-2',
            lastLocation: { type: 'Point', coordinates: [77.3910, 28.5355] }
        });

        // Device 3: far (Bangalore: 12.9716, 77.5946)
        await Device.create({
            deviceId: 'test-device-3',
            fcmToken: 'token-3',
            lastLocation: { type: 'Point', coordinates: [77.5946, 12.9716] }
        });

        console.log('Created 3 test devices');

        // Test Query: Radius of 20km around Delhi (28.6139, 77.2090)
        // Note: Noida is about 20-25km away from center Delhi, so let's use 30000 (30km) to catch both, 
        // and check that Bangalore is excluded.
        const targetLng = 77.2090;
        const targetLat = 28.6139;
        const radius = 30000; // 30km

        const devices = await Device.find({
            active: true,
            lastLocation: {
                $near: {
                    $geometry: {
                        type: "Point",
                        coordinates: [targetLng, targetLat]
                    },
                    $maxDistance: radius
                }
            }
        });

        console.log(`Found ${devices.length} devices within ${radius}m of [${targetLng}, ${targetLat}]`);
        devices.forEach(d => console.log(`- ${d.deviceId} at [${d.lastLocation.coordinates}]`));

        if (devices.length === 2) {
            console.log('✅ TEST PASSED: Found exact number of devices expected!');
        } else {
            console.error('❌ TEST FAILED: Unexpected number of devices found.');
        }

    } catch (err) {
        console.error('Test Error:', err);
    } finally {
        await mongoose.disconnect();
    }
}

testGeofence();
