# Enterprise Monitoring System

A full-stack enterprise-grade monitoring system with real-time dashboards, alerting, and analytics.

## Features

- Real-time monitoring via WebSockets
- RESTful API with Express.js
- PostgreSQL database integration
- Docker containerization
- CI/CD pipeline with GitHub Actions
- JWT-based authentication
- Role-based access control

## Tech Stack

- **Runtime**: Node.js
- **Framework**: Express.js
- **Database**: PostgreSQL
- **Real-time**: Socket.IO
- **Auth**: JWT
- **Containerization**: Docker & Docker Compose

## Getting Started

### Prerequisites

- Node.js >= 18
- Docker & Docker Compose
- PostgreSQL

### Installation

```bash
# Clone the repository
git clone https://github.com/Matam-Rohith/enterprise-monitoring-system.git
cd enterprise-monitoring-system

# Install dependencies
npm install

# Copy environment variables
cp .env.example .env

# Start with Docker
docker-compose up -d

# Or run locally
npm run dev
```

### Environment Variables

```env
NODE_ENV=development
PORT=5000
DB_HOST=localhost
DB_PORT=5432
DB_NAME=enterprise_monitoring
DB_USER=postgres
DB_PASSWORD=your_password
JWT_SECRET=your_jwt_secret
JWT_EXPIRES_IN=7d
CORS_ORIGIN=http://localhost:3000
```

## API Documentation

### Auth Routes
- `POST /api/auth/register` - Register a new user
- `POST /api/auth/login` - Login
- `POST /api/auth/logout` - Logout
- `GET /api/auth/me` - Get current user

### Monitoring Routes
- `GET /api/metrics` - Get all metrics
- `POST /api/metrics` - Create metric entry
- `GET /api/alerts` - Get all alerts
- `POST /api/alerts` - Create alert
- `PUT /api/alerts/:id` - Update alert
- `DELETE /api/alerts/:id` - Delete alert

### System Routes
- `GET /api/system/health` - Health check
- `GET /api/system/status` - System status

## Docker

```bash
# Build and start all services
docker-compose up -d

# Stop services
docker-compose down

# View logs
docker-compose logs -f
```

## Running Tests

```bash
npm test
npm run test:coverage
```

## License

MIT
