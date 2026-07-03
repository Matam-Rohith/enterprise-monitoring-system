const logger = require('../utils/logger');

function errorHandler(err, req, res, next) {
  let statusCode = err.statusCode || err.status || 500;
  let message = err.message || 'Internal Server Error';

  // Handle specific error types
  if (err.code === '23505') {
    statusCode = 409;
    message = 'Resource already exists.';
  } else if (err.code === '23503') {
    statusCode = 400;
    message = 'Referenced resource not found.';
  } else if (err.code === '22P02') {
    statusCode = 400;
    message = 'Invalid input format.';
  }

  // Log server errors
  if (statusCode >= 500) {
    logger.error('Server Error:', {
      message: err.message,
      stack: err.stack,
      url: req.originalUrl,
      method: req.method,
      ip: req.ip
    });
  }

  res.status(statusCode).json({
    success: false,
    message,
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
  });
}

function notFound(req, res, next) {
  const error = new Error(`Route not found: ${req.originalUrl}`);
  error.statusCode = 404;
  next(error);
}

module.exports = { errorHandler, notFound };
