require('dotenv').config();

const app = require('./app');
const connectDB = require('./config/db');

// Import worker to start processing (runs in same process for simplicity)
require('./workers/alertWorker');

const PORT = process.env.PORT || 3000;

// Connect to MongoDB and start server
const startServer = async () => {
    try {
        await connectDB();

        app.listen(PORT, () => {
            console.log(`Server running on port ${PORT}`);
            console.log(`API available at http://localhost:${PORT}`);
            console.log(`Health check at http://localhost:${PORT}/api/v1/health`);
        });
    } catch (error) {
        console.error('Failed to start server:', error);
        process.exit(1);
    }
};

startServer();
