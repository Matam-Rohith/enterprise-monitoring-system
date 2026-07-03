const express = require('express');
const router = express.Router();
const { body } = require('express-validator');
const alertsController = require('../controllers/alertsController');
const { authenticate } = require('../middleware/auth');
const { authorize } = require('../middleware/authorize');
const { validateRequest } = require('../middleware/validate');

router.use(authenticate);

// @route   GET /api/alerts
// @desc    Get all alerts
// @access  Private
router.get('/', alertsController.getAlerts);

// @route   POST /api/alerts
// @desc    Create new alert rule
// @access  Private (admin, manager)
router.post(
  '/',
  authorize('admin', 'manager'),
  [
    body('name').trim().notEmpty().withMessage('Alert name is required'),
    body('condition').notEmpty().withMessage('Alert condition is required'),
    body('threshold').isNumeric().withMessage('Threshold must be numeric'),
    body('severity').isIn(['low', 'medium', 'high', 'critical']).withMessage('Invalid severity'),
    body('metricType').notEmpty().withMessage('Metric type is required'),
    body('notifyChannels').optional().isArray()
  ],
  validateRequest,
  alertsController.createAlert
);

// @route   GET /api/alerts/:id
// @desc    Get single alert
// @access  Private
router.get('/:id', alertsController.getAlertById);

// @route   PUT /api/alerts/:id
// @desc    Update alert
// @access  Private (admin, manager)
router.put(
  '/:id',
  authorize('admin', 'manager'),
  [
    body('name').optional().trim().notEmpty(),
    body('threshold').optional().isNumeric(),
    body('severity').optional().isIn(['low', 'medium', 'high', 'critical']),
    body('isActive').optional().isBoolean()
  ],
  validateRequest,
  alertsController.updateAlert
);

// @route   DELETE /api/alerts/:id
// @desc    Delete alert
// @access  Private (admin only)
router.delete('/:id', authorize('admin'), alertsController.deleteAlert);

// @route   POST /api/alerts/:id/acknowledge
// @desc    Acknowledge an alert
// @access  Private
router.post('/:id/acknowledge', alertsController.acknowledgeAlert);

module.exports = router;
