/**
 * Send a success response
 */
function successResponse(res, data, message = 'Success', statusCode = 200) {
  return res.status(statusCode).json({
    success: true,
    message,
    data
  });
}

/**
 * Send a created response
 */
function createdResponse(res, data, message = 'Created successfully') {
  return successResponse(res, data, message, 201);
}

/**
 * Send an error response
 */
function errorResponse(res, message = 'An error occurred', statusCode = 500, errors = null) {
  const body = { success: false, message };
  if (errors) body.errors = errors;
  return res.status(statusCode).json(body);
}

/**
 * Send a not found response
 */
function notFoundResponse(res, resource = 'Resource') {
  return errorResponse(res, `${resource} not found`, 404);
}

/**
 * Send a paginated response
 */
function paginatedResponse(res, data, pagination, message = 'Success') {
  return res.status(200).json({
    success: true,
    message,
    data,
    pagination
  });
}

module.exports = {
  successResponse,
  createdResponse,
  errorResponse,
  notFoundResponse,
  paginatedResponse
};
