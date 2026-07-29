const { query } = require('../_db');
const { authenticate, successResponse, setCors, handleError } = require('../_utils');

module.exports = async (req, res) => {
  setCors(res);
  if (req.method === 'OPTIONS') return res.status(204).end();

  try {
    const user = await authenticate(req);
    const { id, action } = req.query;

    if (req.method === 'GET') {
      const result = await query('SELECT * FROM alerts WHERE id = $1', [id]);
      if (!result.rows.length) return res.status(404).json({ success: false, message: 'Alert not found' });
      return successResponse(res, { alert: result.rows[0] });
    }

    if (req.method === 'PUT' || req.method === 'PATCH') {
      if (action === 'acknowledge') {
        const result = await query(
          'UPDATE alerts SET acknowledged = true, acknowledged_by = $1, acknowledged_at = NOW() WHERE id = $2 RETURNING *',
          [user.id, id]
        );
        if (!result.rows.length) return res.status(404).json({ success: false, message: 'Alert not found' });
        return successResponse(res, { alert: result.rows[0] }, 'Alert acknowledged');
      }

      const { name, threshold, severity, enabled } = req.body;
      const result = await query(
        'UPDATE alerts SET name = COALESCE($1, name), threshold = COALESCE($2, threshold), severity = COALESCE($3, severity), enabled = COALESCE($4, enabled), updated_at = NOW() WHERE id = $5 RETURNING *',
        [name, threshold, severity, enabled, id]
      );
      if (!result.rows.length) return res.status(404).json({ success: false, message: 'Alert not found' });
      return successResponse(res, { alert: result.rows[0] }, 'Alert updated');
    }

    if (req.method === 'DELETE') {
      const result = await query('DELETE FROM alerts WHERE id = $1 RETURNING id', [id]);
      if (!result.rows.length) return res.status(404).json({ success: false, message: 'Alert not found' });
      return successResponse(res, null, 'Alert deleted');
    }

    return res.status(405).json({ success: false, message: 'Method not allowed' });
  } catch (err) {
    return handleError(res, err);
  }
};
