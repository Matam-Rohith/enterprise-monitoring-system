const express = require('express');
const router = express.Router();

const authRoutes = require('./auth');
const metricsRoutes = require('./metrics');
const alertsRoutes = require('./alerts');
const systemRoutes = require('./system');

// Mount routes
router.use('/auth', authRoutes);
router.use('/metrics', metricsRoutes);
router.use('/alerts', alertsRoutes);
router.use('/system', systemRoutes);

module.exports = router;
