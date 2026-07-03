require('dotenv').config();
const http = require('http');
const app = require('./app');
const { initializeSocket } = require('./socket');
const { connectDB } = require('./db');
const logger = require('./utils/logger');

const PORT = process.env.PORT || 5000;

async function startServer() {
  try {
    // Connect to database
    await connectDB();
    logger.info('Database connected successfully');

    // Create HTTP server
    const server = http.createServer(app);

    // Initialize Socket.IO
    initializeSocket(server);
    logger.info('Socket.IO initialized');

    // Start listening
    server.listen(PORT, () => {
      logger.info(`Enterprise Monitoring System running on port ${PORT}`);
      logger.info(`Environment: ${process.env.NODE_ENV || 'development'}`);
    });

    // Graceful shutdown
    process.on('SIGTERM', async () => {
      logger.info('SIGTERM received. Shutting down gracefully...');
      server.close(() => {
        logger.info('HTTP server closed.');
        process.exit(0);
      });
    });

    process.on('SIGINT', async () => {
      logger.info('SIGINT received. Shutting down gracefully...');
      server.close(() => {
        logger.info('HTTP server closed.');
        process.exit(0);
      });
    });

    process.on('unhandledRejection', (reason, promise) => {
      logger.error('Unhandled Rejection at:', promise, 'reason:', reason);
    });

  } catch (error) {
    logger.error('Failed to start server:', error);
    process.exit(1);
  }
}

// Create Express app
const express = require('express');
const helmet = require('helmet');
const cors = require('cors');
const compression = require('compression');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');

const authRoutes = require('./routes/auth');
const metricsRoutes = require('./routes/metrics');
const alertsRoutes = require('./routes/alerts');
const systemRoutes = require('./routes/system');
const { errorHandler } = require('./middleware/errorHandler');
const { notFound } = require('./middleware/notFound');

const appInstance = express();

// Security middleware
appInstance.use(helmet());
appInstance.use(cors({
  origin: process.env.CORS_ORIGIN || 'http://localhost:3000',
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  message: 'Too many requests from this IP, please try again later.'
});
appInstance.use('/api/', limiter);

// General middleware
appInstance.use(compression());
appInstance.use(express.json({ limit: '10mb' }));
appInstance.use(express.urlencoded({ extended: true }));
appInstance.use(morgan('combined', { stream: { write: msg => logger.info(msg.trim()) } }));

// Routes
appInstance.use('/api/auth', authRoutes);
appInstance.use('/api/metrics', metricsRoutes);
appInstance.use('/api/alerts', alertsRoutes);
appInstance.use('/api/system', systemRoutes);

// Error handlers
appInstance.use(notFound);
appInstance.use(errorHandler);

module.exports = appInstance;

startServer();
