# Enterprise Application Monitoring & Incident Management System

![License](https://img.shields.io/badge/license-MIT-blue.svg)
![Node](https://img.shields.io/badge/node-%3E%3D18.0.0-brightgreen)
![React](https://img.shields.io/badge/react-18.x-blue)

A full-stack enterprise-grade monitoring and incident management platform featuring real-time alerts, service health dashboards, on-call scheduling, and incident lifecycle management.

## 🚀 Features

- **Real-time Service Monitoring** — Track uptime, response times, and health status of all services
- **Incident Management** — Create, assign, escalate, and resolve incidents with full audit trail
- **Alert Engine** — Rule-based alerting with email, Slack, and webhook notifications
- **On-Call Scheduling** — Rotations, escalation policies, and override management
- **Dashboard & Analytics** — MTTR, MTTD, SLA tracking, and custom reports
- **Multi-tenant** — Org-level isolation with role-based access control (RBAC)

## 🛠 Tech Stack

| Layer | Technology |
|-------|------------|
| Frontend | React 18, TypeScript, TailwindCSS, Recharts |
| Backend | Node.js, Express.js, TypeScript |
| Database | PostgreSQL + Redis (caching & pub/sub) |
| Auth | JWT + Refresh tokens |
| Real-time | Socket.IO |
| Infra | Docker, GitHub Actions CI/CD |

## 📁 Project Structure

```
enterprise-monitoring-system/
├── client/          # React frontend
├── server/          # Node.js backend API
├── docker-compose.yml
├── .github/workflows/  # CI/CD pipelines
└── docs/            # API documentation
```

## 🏃 Quick Start

### Prerequisites
- Node.js >= 18
- PostgreSQL >= 14
- Redis >= 7
- Docker (optional)

### Installation

```bash
# Clone the repository
git clone https://github.com/Matam-Rohith/enterprise-monitoring-system.git
cd enterprise-monitoring-system

# Install dependencies
npm run install:all

# Setup environment
cp server/.env.example server/.env
cp client/.env.example client/.env

# Run database migrations
npm run db:migrate

# Start development servers
npm run dev
```

### Docker Setup

```bash
docker-compose up -d
```

App runs at: http://localhost:3000  
API runs at: http://localhost:5000

## 🔐 Default Credentials (Dev)

- **Admin**: admin@example.com / Admin@123
- **Viewer**: viewer@example.com / Viewer@123

## 📄 License

MIT © [Matam Rohith](https://rohith-portfolio-six.vercel.app/)
