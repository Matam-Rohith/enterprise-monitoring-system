const { query } = require('../db');
const { successResponse } = require('../utils/response');

const getHealth = async (req, res) => {
  return res.status(200).json({
    success: true,
    status: 'healthy',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: process.env.NODE_ENV || 'development'
  });
};

const getStatus = async (req, res, next) => {
  try {
    await query('SELECT 1', []);
    return res.status(200).json({
      success: true,
      status: 'operational',
      services: {
        api: 'up',
        database: 'up'
      },
      version: process.env.npm_package_version || '1.0.0',
      timestamp: new Date().toISOString()
    });
  } catch (err) {
    return res.status(503).json({
      success: false,
      status: 'degraded',
      services: { api: 'up', database: 'down' },
      timestamp: new Date().toISOString()
    });
  }
};

module.exports = { getHealth, getStatus };
