const { Server } = require('socket.io');
const jwt = require('jsonwebtoken');
const logger = require('../utils/logger');
const { query } = require('../db');

let io;

function initializeSocket(server) {
  io = new Server(server, {
    cors: {
      origin: process.env.CORS_ORIGIN || 'http://localhost:3000',
      methods: ['GET', 'POST'],
      credentials: true
    },
    transports: ['websocket', 'polling']
  });

  // Authentication middleware for Socket.IO
  io.use(async (socket, next) => {
    try {
      const token = socket.handshake.auth.token ||
        socket.handshake.headers.authorization?.split(' ')[1];

      if (!token) {
        return next(new Error('Authentication required'));
      }

      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      const result = await query(
        'SELECT id, name, email, role FROM users WHERE id = $1 AND is_active = true',
        [decoded.userId]
      );

      if (result.rows.length === 0) {
        return next(new Error('Invalid or expired token'));
      }

      socket.user = result.rows[0];
      next();
    } catch (error) {
      logger.error('Socket authentication error:', error.message);
      next(new Error('Authentication failed'));
    }
  });

  io.on('connection', (socket) => {
    logger.info(`Client connected: ${socket.id} | User: ${socket.user?.email}`);

    // Join user to their personal room
    socket.join(`user:${socket.user.id}`);

    // Join role-based room
    socket.join(`role:${socket.user.role}`);

    // Handle subscription to metric streams
    socket.on('subscribe:metrics', (metricTypes) => {
      if (Array.isArray(metricTypes)) {
        metricTypes.forEach(type => socket.join(`metric:${type}`));
        logger.debug(`User ${socket.user.email} subscribed to metrics: ${metricTypes.join(', ')}`);
      }
    });

    // Handle subscription to alert channels
    socket.on('subscribe:alerts', () => {
      socket.join('alerts:live');
      logger.debug(`User ${socket.user.email} subscribed to live alerts`);
    });

    socket.on('unsubscribe:metrics', (metricTypes) => {
      if (Array.isArray(metricTypes)) {
        metricTypes.forEach(type => socket.leave(`metric:${type}`));
      }
    });

    socket.on('disconnect', (reason) => {
      logger.info(`Client disconnected: ${socket.id} | Reason: ${reason}`);
    });

    socket.on('error', (error) => {
      logger.error(`Socket error for ${socket.id}:`, error);
    });
  });

  logger.info('Socket.IO server initialized');
  return io;
}

function getIO() {
  if (!io) {
    throw new Error('Socket.IO has not been initialized. Call initializeSocket first.');
  }
  return io;
}

function emitMetricUpdate(metricType, data) {
  if (io) {
    io.to(`metric:${metricType}`).emit('metric:update', { type: metricType, data, timestamp: new Date().toISOString() });
  }
}

function emitAlert(alert) {
  if (io) {
    io.to('alerts:live').emit('alert:triggered', { ...alert, timestamp: new Date().toISOString() });
    if (alert.severity === 'critical') {
      io.to('role:admin').emit('alert:critical', { ...alert, timestamp: new Date().toISOString() });
    }
  }
}

function emitToUser(userId, event, data) {
  if (io) {
    io.to(`user:${userId}`).emit(event, data);
  }
}

module.exports = { initializeSocket, getIO, emitMetricUpdate, emitAlert, emitToUser };
