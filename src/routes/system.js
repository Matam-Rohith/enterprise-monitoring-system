const express = require('express');
const router = express.Router();
const { query: dbQuery } = require('../db');
const logger = require('../utils/logger');

// @route   GET /api/system/health
// @desc    Health check endpoint
// @access  Public
router.get('/health', async (req, res) => {
  try {
    await dbQuery('SELECT 1');
    res.status(200).json({
      status: 'healthy',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      environment: process.env.NODE_ENV || 'development'
    });
  } catch (error) {
    logger.error('Health check failed:', error);
    res.status(503).json({
      status: 'unhealthy',
      timestamp: new Date().toISOString(),
      error: 'Database connection failed'
    });
  }
});

// @route   GET /api/system/status
// @desc    Get system status and metrics
// @access  Public
router.get('/status', async (req, res) => {
  const memUsage = process.memoryUsage();
  res.status(200).json({
    status: 'operational',
    timestamp: new Date().toISOString(),
    version: process.env.npm_package_version || '1.0.0',
    uptime: process.uptime(),
    memory: {
      rss: `${Math.round(memUsage.rss / 1024 / 1024)} MB`,
      heapUsed: `${Math.round(memUsage.heapUsed / 1024 / 1024)} MB`,
      heapTotal: `${Math.round(memUsage.heapTotal / 1024 / 1024)} MB`
    },
    cpu: process.cpuUsage()
  });
});

module.exports = router;
