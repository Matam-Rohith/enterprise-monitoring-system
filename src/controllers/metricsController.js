const { query } = require('../db');
const { successResponse, createdResponse, paginatedResponse } = require('../utils/response');
const { parsePagination } = require('../utils/helpers');

const getMetrics = async (req, res, next) => {
  try {
    const { page = 1, limit = 20, service, type } = req.query;
    const { offset } = parsePagination(parseInt(page), parseInt(limit));
    let sql = 'SELECT * FROM metrics WHERE 1=1';
    const params = [];
    if (service) { params.push(service); sql += ` AND service_name = $${params.length}`; }
    if (type) { params.push(type); sql += ` AND metric_type = $${params.length}`; }
    sql += ` ORDER BY created_at DESC LIMIT $${params.length + 1} OFFSET $${params.length + 2}`;
    params.push(parseInt(limit), offset);
    const result = await query(sql, params);
    const countResult = await query('SELECT COUNT(*) FROM metrics', []);
    return paginatedResponse(res, result.rows, parseInt(countResult.rows[0].count), parseInt(page), parseInt(limit));
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

const getMetricsSummary = async (req, res, next) => {
  try {
    const result = await query(
      'SELECT service_name, metric_type, AVG(value) as avg_value, MAX(value) as max_value, MIN(value) as min_value, COUNT(*) as count FROM metrics GROUP BY service_name, metric_type ORDER BY service_name',
      []
    );
    return successResponse(res, { summary: result.rows });
  } catch (err) { next(err); }
};

const getMetricById = async (req, res, next) => {
  try {
    const result = await query('SELECT * FROM metrics WHERE id = $1', [req.params.id]);
    if (!result.rows.length) return res.status(404).json({ success: false, message: 'Metric not found' });
    return successResponse(res, { metric: result.rows[0] });
  } catch (err) { next(err); }
};

const deleteMetric = async (req, res, next) => {
  try {
    const result = await query('DELETE FROM metrics WHERE id = $1 RETURNING id', [req.params.id]);
    if (!result.rows.length) return res.status(404).json({ success: false, message: 'Metric not found' });
    return successResponse(res, null, 'Metric deleted');
  } catch (err) { next(err); }
};

module.exports = { getMetrics, createMetric, getMetricsSummary, getMetricById, deleteMetric };
