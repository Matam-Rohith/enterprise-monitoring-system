const { query } = require('../_db');
const { authenticate, successResponse, setCors, handleError } = require('../_utils');

module.exports = async (req, res) => {
  setCors(res);
  if (req.method === 'OPTIONS') return res.status(204).end();

  try {
    await authenticate(req);
    const { id } = req.query;

    if (req.method === 'GET') {
      const result = await query('SELECT * FROM metrics WHERE id = $1', [id]);
      if (!result.rows.length) return res.status(404).json({ success: false, message: 'Metric not found' });
      return successResponse(res, { metric: result.rows[0] });
    }

    if (req.method === 'DELETE') {
      const result = await query('DELETE FROM metrics WHERE id = $1 RETURNING id', [id]);
      if (!result.rows.length) return res.status(404).json({ success: false, message: 'Metric not found' });
      return successResponse(res, null, 'Metric deleted');
    }

    return res.status(405).json({ success: false, message: 'Method not allowed' });
  } catch (err) {
    return handleError(res, err);
  }
};
