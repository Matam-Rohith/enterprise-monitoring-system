const express = require('express');
const router = express.Router();
const { body, query } = require('express-validator');
const metricsController = require('../controllers/metricsController');
const { authenticate } = require('../middleware/auth');
const { authorize } = require('../middleware/authorize');
const { validateRequest } = require('../middleware/validate');

// All routes require authentication
router.use(authenticate);

// @route   GET /api/metrics
// @desc    Get all metrics with filters
// @access  Private
router.get(
  '/',
  [
    query('startDate').optional().isISO8601().withMessage('Invalid start date'),
    query('endDate').optional().isISO8601().withMessage('Invalid end date'),
    query('type').optional().isString(),
    query('limit').optional().isInt({ min: 1, max: 1000 }),
    query('offset').optional().isInt({ min: 0 })
  ],
  validateRequest,
  metricsController.getMetrics
);

// @route   POST /api/metrics
// @desc    Create a new metric entry
// @access  Private (admin, manager)
router.post(
  '/',
  authorize('admin', 'manager'),
  [
    body('type').notEmpty().withMessage('Metric type is required'),
    body('value').isNumeric().withMessage('Metric value must be numeric'),
    body('unit').optional().isString(),
    body('source').optional().isString(),
    body('tags').optional().isObject()
  ],
  validateRequest,
  metricsController.createMetric
);

// @route   GET /api/metrics/summary
// @desc    Get metrics summary/aggregation
// @access  Private
router.get('/summary', metricsController.getMetricsSummary);

// @route   GET /api/metrics/:id
// @desc    Get single metric
// @access  Private
router.get('/:id', metricsController.getMetricById);

// @route   DELETE /api/metrics/:id
// @desc    Delete a metric
// @access  Private (admin only)
router.delete('/:id', authorize('admin'), metricsController.deleteMetric);

module.exports = router;
