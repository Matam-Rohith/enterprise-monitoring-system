const bcrypt = require('bcryptjs');
const { query } = require('../db');
const { generateToken } = require('../utils/helpers');
const { successResponse, createdResponse, errorResponse } = require('../utils/response');

const register = async (req, res, next) => {
  try {
    const { name, email, password, role = 'viewer' } = req.body;
    const existing = await query('SELECT id FROM users WHERE email = $1', [email]);
    if (existing.rows.length > 0) return res.status(409).json({ success: false, message: 'Email already registered' });
    const hash = await bcrypt.hash(password, 12);
    const result = await query(
      'INSERT INTO users (name, email, password, role) VALUES ($1, $2, $3, $4) RETURNING id, name, email, role, created_at',
      [name, email, hash, role]
    );
    const user = result.rows[0];
    const token = generateToken(user.id);
    return createdResponse(res, { user, token }, 'User registered successfully');
  } catch (err) { next(err); }
};

const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;
    const result = await query('SELECT * FROM users WHERE email = $1', [email]);
    if (!result.rows.length) return res.status(401).json({ success: false, message: 'Invalid credentials' });
    const user = result.rows[0];
    const match = await bcrypt.compare(password, user.password);
    if (!match) return res.status(401).json({ success: false, message: 'Invalid credentials' });
    await query('UPDATE users SET last_login = NOW() WHERE id = $1', [user.id]);
    const token = generateToken(user.id);
    const { password: _, ...safeUser } = user;
    return successResponse(res, { user: safeUser, token }, 'Login successful');
  } catch (err) { next(err); }
};

const logout = async (req, res) => {
  return successResponse(res, null, 'Logged out successfully');
};

const getMe = async (req, res, next) => {
  try {
    const result = await query('SELECT id, name, email, role, created_at, last_login FROM users WHERE id = $1', [req.user.id]);
    return successResponse(res, { user: result.rows[0] });
  } catch (err) { next(err); }
};

const changePassword = async (req, res, next) => {
  try {
    const { currentPassword, newPassword } = req.body;
    const result = await query('SELECT password FROM users WHERE id = $1', [req.user.id]);
    const match = await bcrypt.compare(currentPassword, result.rows[0].password);
    if (!match) return res.status(400).json({ success: false, message: 'Current password is incorrect' });
    const hash = await bcrypt.hash(newPassword, 12);
    await query('UPDATE users SET password = $1 WHERE id = $2', [hash, req.user.id]);
    return successResponse(res, null, 'Password changed successfully');
  } catch (err) { next(err); }
};

module.exports = { register, login, logout, getMe, changePassword };
