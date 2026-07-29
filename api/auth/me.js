const { query } = require('../_db');
const { authenticate, successResponse, setCors, handleError } = require('../_utils');

module.exports = async (req, res) => {
  setCors(res);
  if (req.method === 'OPTIONS') return res.status(204).end();

  try {
    const user = await authenticate(req);

    if (req.method === 'GET') {
      const result = await query(
        'SELECT id, name, email, role, created_at, last_login FROM users WHERE id = $1',
        [user.id]
      );
      return successResponse(res, { user: result.rows[0] });
    }

    if (req.method === 'POST' && req.query.action === 'change-password') {
      const bcrypt = require('bcryptjs');
      const { currentPassword, newPassword } = req.body;
      const result = await query('SELECT password FROM users WHERE id = $1', [user.id]);
      const match = await bcrypt.compare(currentPassword, result.rows[0].password);
      if (!match) return res.status(400).json({ success: false, message: 'Current password is incorrect' });
      const hash = await bcrypt.hash(newPassword, 12);
      await query('UPDATE users SET password = $1 WHERE id = $2', [hash, user.id]);
      return successResponse(res, null, 'Password changed successfully');
    }

    return res.status(405).json({ success: false, message: 'Method not allowed' });
  } catch (err) {
    return handleError(res, err);
  }
};
