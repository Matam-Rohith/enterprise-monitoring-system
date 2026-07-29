const bcrypt = require('bcryptjs');
const { query } = require('../_db');
const { generateToken, successResponse, setCors, handleError } = require('../_utils');

module.exports = async (req, res) => {
  setCors(res);
  if (req.method === 'OPTIONS') return res.status(204).end();
  if (req.method !== 'POST') return res.status(405).json({ success: false, message: 'Method not allowed' });

  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ success: false, message: 'Email and password are required' });
    }

    const result = await query('SELECT * FROM users WHERE email = $1', [email]);
    if (!result.rows.length) {
      return res.status(401).json({ success: false, message: 'Invalid credentials' });
    }

    const user = result.rows[0];
    const match = await bcrypt.compare(password, user.password);
    if (!match) {
      return res.status(401).json({ success: false, message: 'Invalid credentials' });
    }

    await query('UPDATE users SET last_login = NOW() WHERE id = $1', [user.id]);
    const token = generateToken(user.id);
    const { password: _pw, ...safeUser } = user;
    return successResponse(res, { user: safeUser, token }, 'Login successful');
  } catch (err) {
    return handleError(res, err);
  }
};
