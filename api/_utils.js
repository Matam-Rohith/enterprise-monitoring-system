const jwt = require('jsonwebtoken');

function successResponse(res, data, message = 'Success', statusCode = 200) {
  return res.status(statusCode).json({ success: true, message, data });
}

function createdResponse(res, data, message = 'Created successfully') {
  return successResponse(res, data, message, 201);
}

function errorResponse(res, message = 'An error occurred', statusCode = 500, errors = null) {
  const body = { success: false, message };
  if (errors) body.errors = errors;
  return res.status(statusCode).json(body);
}

function paginatedResponse(res, data, total, page, limit) {
  const totalPages = Math.ceil(total / limit);
  return res.status(200).json({
    success: true,
    message: 'Success',
    data,
    pagination: { total, page, limit, totalPages, hasNext: page < totalPages, hasPrev: page > 1 }
  });
}

function parsePagination(query) {
  const page = Math.max(1, parseInt(query.page) || 1);
  const limit = Math.min(100, Math.max(1, parseInt(query.limit) || 20));
  const offset = (page - 1) * limit;
  return { page, limit, offset };
}

function generateToken(userId) {
  return jwt.sign({ userId }, process.env.JWT_SECRET, { expiresIn: '7d' });
}

function verifyToken(token) {
  return jwt.verify(token, process.env.JWT_SECRET);
}

async function authenticate(req) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    const err = new Error('Access denied. No token provided.');
    err.statusCode = 401;
    throw err;
  }
  const token = authHeader.split(' ')[1];
  let decoded;
  try {
    decoded = verifyToken(token);
  } catch (e) {
    const err = new Error(e.name === 'TokenExpiredError' ? 'Token expired.' : 'Invalid token.');
    err.statusCode = 401;
    throw err;
  }
  const { query } = require('./_db');
  const result = await query(
    'SELECT id, name, email, role, is_active FROM users WHERE id = $1 AND is_active = true',
    [decoded.userId]
  );
  if (result.rows.length === 0) {
    const err = new Error('Invalid token. User not found or inactive.');
    err.statusCode = 401;
    throw err;
  }
  return result.rows[0];
}

function runMiddleware(req, res, fn) {
  return new Promise((resolve, reject) => {
    fn(req, res, (result) => {
      if (result instanceof Error) return reject(result);
      return resolve(result);
    });
  });
}

function setCors(res) {
  res.setHeader('Access-Control-Allow-Origin', process.env.CORS_ORIGIN || '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,PUT,PATCH,DELETE,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
}

function handleError(res, err) {
  const statusCode = err.statusCode || err.status || 500;
  const message = err.message || 'Internal Server Error';
  if (statusCode >= 500) {
    console.error('Server Error:', err);
  }
  return res.status(statusCode).json({ success: false, message });
}

module.exports = {
  successResponse,
  createdResponse,
  errorResponse,
  paginatedResponse,
  parsePagination,
  generateToken,
  verifyToken,
  authenticate,
  runMiddleware,
  setCors,
  handleError
};
