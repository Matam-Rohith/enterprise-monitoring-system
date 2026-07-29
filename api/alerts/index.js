const { query } = require('../_db');
const { authenticate, successResponse, createdResponse, setCors, handleError } = require('../_utils');

module.exports = async (req, res) => {
  setCors(res);
  if (req.method === 'OPTIONS') return res.status(204).end();

  try {
    const user = await authenticate(req);

    if (req.method === 'GET') {
      const result = await query('SELECT * FROM alerts ORDER BY created_at DESC LIMIT 100', []);
      return successResponse(res, { alerts: result.rows });
    }

    if (req.method === 'POST') {
      const { name, service_name, metric_type, condition, threshold, severity = 'medium' } = req.body;
      const result = await query(
        'INSERT INTO alerts (name, service_name, metric_type, condition, threshold, severity, created_by) VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *',
        [name, service_name, metric_type, condition, threshold, severity, user.id]
      );
      return createdResponse(res, { alert: result.rows[0] }, 'Alert rule created');
    }

    return res.status(405).json({ success: false, message: 'Method not allowed' });
  } catch (err) {
    return handleError(res, err);
  }
};
