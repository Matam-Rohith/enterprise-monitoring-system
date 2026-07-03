const { query } = require('../db');
const { successResponse, createdResponse, paginatedResponse } = require('../utils/response');
const { getPagination } = require('../utils/helpers');

const getMetrics = async (req, res, next) => {
  try {
    const { page = 1, limit = 20, service, type } = req.query;
    const { offset, limitNum } = getPagination(page, limit);
    let sql = 'SELECT * FROM metrics WHERE 1=1';
    const params = [];
    if (service) { params.push(service); sql += ` AND service_name = $${params.length}`; }
    if (type) { params.push(type); sql += ` AND metric_type = $${params.length}`; }
    sql += ` ORDER BY created_at DESC LIMIT $${params.length + 1} OFFSET $${params.length + 2}`;
    params.push(limitNum, offset);
    const result = await query(sql, params);
    const countResult = await query('SELECT COUNT(*) FROM metrics WHERE 1=1', []);
    return paginatedResponse(res, result.rows, parseInt(countResult.rows[0].count), page, limitNum);
  } catch (err) { next(err); }
};

const createMetric = async (req, res, next) => {
  try {
    const { service_name, metric_type, value, unit, metadata } = req.body;
    const result = await query(
      'INSERT INTO metrics (service_name, metric_type, value, unit, metadata, created_by) VALUES ($1, $2, $3, $4, $5, $6) RETURNING *',
      [service_name, metric_type, value, unit, metadata || {}, req.user.id]
    );
    return createdResponse(res, { metric: result.rows[0] }, 'Metric created');
  } catch (err) { next(err); }
};

const getMetric = async (req, res, next) => {
  try {
    const result = await query('SELECT * FROM metrics WHERE id = $1', [req.params.id]);
    if (!result.rows.length) return res.status(404).json({ success: false, message: 'Metric not found' });
    return successResponse(res, { metric: result.rows[0] });
  } catch (err) { next(err); }
};

const updateMetric = async (req, res, next) => {
  try {
    const { value, unit, metadata } = req.body;
    const result = await query(
      'UPDATE metrics SET value = $1, unit = $2, metadata = $3, updated_at = NOW() WHERE id = $4 RETURNING *',
      [value, unit, metadata, req.params.id]
    );
    if (!result.rows.length) return res.status(404).json({ success: false, message: 'Metric not found' });
    return successResponse(res, { metric: result.rows[0] }, 'Metric updated');
  } catch (err) { next(err); }
};

const deleteMetric = async (req, res, next) => {
  try {
    const result = await query('DELETE FROM metrics WHERE id = $1 RETURNING id', [req.params.id]);
    if (!result.rows.length) return res.status(404).json({ success: false, message: 'Metric not found' });
    return successResponse(res, null, 'Metric deleted');
  } catch (err) { next(err); }
};

module.exports = { getMetrics, createMetric, getMetric, updateMetric, deleteMetric };
