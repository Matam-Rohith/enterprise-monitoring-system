const bcrypt = require('bcryptjs');
const { query } = require('../_db');
const { generateToken, createdResponse, setCors, handleError } = require('../_utils');

module.exports = async (req, res) => {
  setCors(res);
  if (req.method === 'OPTIONS') return res.status(204).end();
  if (req.method !== 'POST') return res.status(405).json({ success: false, message: 'Method not allowed' });

  try {
    const { name, email, password, role = 'viewer' } = req.body;
    if (!name || !email || !password) {
      return res.status(400).json({ success: false, message: 'Name, email and password are required' });
    }

    const existing = await query('SELECT id FROM users WHERE email = $1', [email]);
    if (existing.rows.length > 0) {
      return res.status(409).json({ success: false, message: 'Email already registered' });
    }

    const hash = await bcrypt.hash(password, 12);
    const result = await query(
      'INSERT INTO users (name, email, password, role) VALUES ($1, $2, $3, $4) RETURNING id, name, email, role, created_at',
      [name, email, hash, role]
    );
    const user = result.rows[0];
    const token = generateToken(user.id);
    return createdResponse(res, { user, token }, 'User registered successfully');
  } catch (err) {
    return handleError(res, err);
  }
};
