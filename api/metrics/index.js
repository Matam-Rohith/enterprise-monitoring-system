const { query } = require('../_db');
const { authenticate, createdResponse, paginatedResponse, parsePagination, setCors, handleError } = require('../_utils');

module.exports = async (req, res) => {
  setCors(res);
  if (req.method === 'OPTIONS') return res.status(204).end();

  try {
    const user = await authenticate(req);

    if (req.method === 'GET') {
      const { page = 1, limit = 20, service, type } = req.query;
      const { offset } = parsePagination({ page, limit });
      let sql = 'SELECT * FROM metrics WHERE 1=1';
      const params = [];
      if (service) { params.push(service); sql += ` AND service_name = $${params.length}`; }
      if (type) { params.push(type); sql += ` AND metric_type = $${params.length}`; }
      sql += ` ORDER BY created_at DESC LIMIT $${params.length + 1} OFFSET $${params.length + 2}`;
      params.push(parseInt(limit), offset);
      const result = await query(sql, params);
      const countResult = await query('SELECT COUNT(*) FROM metrics', []);
      return paginatedResponse(res, result.rows, parseInt(countResult.rows[0].count), parseInt(page), parseInt(limit));
    }

    if (req.method === 'POST') {
      const { service_name, metric_type, value, unit, metadata } = req.body;
      const result = await query(
        'INSERT INTO metrics (service_name, metric_type, value, unit, metadata, created_by) VALUES ($1, $2, $3, $4, $5, $6) RETURNING *',
        [service_name, metric_type, value, unit, metadata || {}, user.id]
      );
      return createdResponse(res, { metric: result.rows[0] }, 'Metric created');
    }

    return res.status(405).json({ success: false, message: 'Method not allowed' });
  } catch (err) {
    return handleError(res, err);
  }
};
