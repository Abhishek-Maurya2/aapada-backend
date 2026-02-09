const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const apiRoutes = require('./routes/api');

const app = express();

// Security middleware
app.use(helmet());

// CORS
app.use(cors());

// Logging
app.use(morgan('dev'));

// Body parsing
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// API routes
app.use('/api/v1', apiRoutes);

// Root route
app.get('/', (req, res) => {
    res.json({
        name: 'Disaster Alert System API',
        version: '1.0.0',
        endpoints: {
            health: 'GET /api/v1/health',
            devices: {
                register: 'POST /api/v1/devices/register',
                list: 'GET /api/v1/devices',
            },
            alerts: {
                create: 'POST /api/v1/alerts',
                list: 'GET /api/v1/alerts',
                get: 'GET /api/v1/alerts/:id',
                feedback: 'POST /api/v1/alerts/feedback',
                getFeedback: 'GET /api/v1/alerts/:id/feedback',
            },
            queue: {
                status: 'GET /api/v1/queue/status',
            },
        },
    });
});

// 404 handler
app.use((req, res) => {
    res.status(404).json({
        success: false,
        message: 'Route not found',
    });
});

// Error handler
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({
        success: false,
        message: 'Internal server error',
        error: process.env.NODE_ENV === 'development' ? err.message : undefined,
    });
});

module.exports = app;
