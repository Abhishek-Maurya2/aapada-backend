# Disaster Alert System - Backend

A Node.js backend for a disaster alert system with message queue and feedback mechanism.

## Tech Stack
- **Node.js** + **Express.js** - API Server
- **MongoDB** - Database
- **Redis** + **BullMQ** - Message Queue

## Setup

### Prerequisites
- Node.js v18+
- MongoDB running locally or connection string
- Redis running locally

### Installation
```bash
npm install
```

### Configuration
Copy `.env.example` to `.env` and update values:
```bash
PORT=3000
MONGODB_URI=mongodb://localhost:27017/disaster_alert
REDIS_HOST=localhost
REDIS_PORT=6379
```

### Run
```bash
# Development (with auto-reload)
npm run dev

# Production
npm start
```

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/v1/health` | Health check |
| POST | `/api/v1/devices/register` | Register a device |
| GET | `/api/v1/devices` | List all devices |
| POST | `/api/v1/alerts` | Create new alert |
| GET | `/api/v1/alerts` | List all alerts |
| GET | `/api/v1/alerts/:id` | Get alert with stats |
| POST | `/api/v1/alerts/feedback` | Submit receipt feedback |
| GET | `/api/v1/alerts/:id/feedback` | Get feedback for alert |
| GET | `/api/v1/queue/status` | Queue status |

## Project Structure
```
backend/
├── src/
│   ├── config/      # DB and Redis config
│   ├── models/      # Mongoose schemas
│   ├── routes/      # API routes
│   ├── services/    # Business logic
│   ├── workers/     # Queue workers
│   ├── app.js       # Express app
│   └── server.js    # Entry point
├── .env
└── package.json
```
