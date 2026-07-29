const { query } = require('../_db');
const { authenticate, successResponse, setCors, handleError } = require('../_utils');

module.exports = async (req, res) => {
  setCors(res);
  if (req.method === 'OPTIONS') return res.status(204).end();
  if (req.method !== 'GET') return res.status(405).json({ success: false, message: 'Method not allowed' });

  try {
    await authenticate(req);
    const result = await query(
      'SELECT service_name, metric_type, AVG(value) as avg_value, MAX(value) as max_value, MIN(value) as min_value, COUNT(*) as count FROM metrics GROUP BY service_name, metric_type ORDER BY service_name',
      []
    );
    return successResponse(res, { summary: result.rows });
  } catch (err) {
    return handleError(res, err);
  }
};
