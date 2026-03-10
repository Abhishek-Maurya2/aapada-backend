const serverless = require('serverless-http');
const mongoose = require('mongoose');
const app = require('../src/app');

// Database connection state
let isConnected = false;

const connectToDatabase = async () => {
    if (isConnected) {
        console.log('Using existing database connection');
        return;
    }

    console.log('Creating new database connection');
    const db = await mongoose.connect(process.env.MONGODB_URI);
    isConnected = db.connections[0].readyState;
};

const handler = serverless(app);

module.exports.handler = async (event, context) => {
    // Make sure to connect to DB before processing request
    try {
        await connectToDatabase();
    } catch (err) {
        console.error('Database connection error:', err);
        return {
            statusCode: 500,
            body: JSON.stringify({ error: 'Could not connect to database' })
        };
    }

    // Handle the request
    return await handler(event, context);
};
