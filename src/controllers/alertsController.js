const { query } = require('../db');
const { successResponse, createdResponse } = require('../utils/response');

const getAlerts = async (req, res, next) => {
  try {
    const result = await query('SELECT * FROM alerts ORDER BY created_at DESC LIMIT 100', []);
    return successResponse(res, { alerts: result.rows });
  } catch (err) { next(err); }
};

const createAlert = async (req, res, next) => {
  try {
    const { name, service_name, metric_type, condition, threshold, severity = 'medium' } = req.body;
    const result = await query(
      'INSERT INTO alerts (name, service_name, metric_type, condition, threshold, severity, created_by) VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *',
      [name, service_name, metric_type, condition, threshold, severity, req.user.id]
    );
    return createdResponse(res, { alert: result.rows[0] }, 'Alert rule created');
  } catch (err) { next(err); }
};

const getAlert = async (req, res, next) => {
  try {
    const result = await query('SELECT * FROM alerts WHERE id = $1', [req.params.id]);
    if (!result.rows.length) return res.status(404).json({ success: false, message: 'Alert not found' });
    return successResponse(res, { alert: result.rows[0] });
  } catch (err) { next(err); }
};

const updateAlert = async (req, res, next) => {
  try {
    const { name, threshold, severity, enabled } = req.body;
    const result = await query(
      'UPDATE alerts SET name = COALESCE($1, name), threshold = COALESCE($2, threshold), severity = COALESCE($3, severity), enabled = COALESCE($4, enabled), updated_at = NOW() WHERE id = $5 RETURNING *',
      [name, threshold, severity, enabled, req.params.id]
    );
    if (!result.rows.length) return res.status(404).json({ success: false, message: 'Alert not found' });
    return successResponse(res, { alert: result.rows[0] }, 'Alert updated');
  } catch (err) { next(err); }
};

const deleteAlert = async (req, res, next) => {
  try {
    const result = await query('DELETE FROM alerts WHERE id = $1 RETURNING id', [req.params.id]);
    if (!result.rows.length) return res.status(404).json({ success: false, message: 'Alert not found' });
    return successResponse(res, null, 'Alert deleted');
  } catch (err) { next(err); }
};

const acknowledgeAlert = async (req, res, next) => {
  try {
    const result = await query(
      'UPDATE alerts SET acknowledged = true, acknowledged_by = $1, acknowledged_at = NOW() WHERE id = $2 RETURNING *',
      [req.user.id, req.params.id]
    );
    if (!result.rows.length) return res.status(404).json({ success: false, message: 'Alert not found' });
    return successResponse(res, { alert: result.rows[0] }, 'Alert acknowledged');
  } catch (err) { next(err); }
};

module.exports = { getAlerts, createAlert, getAlert, updateAlert, deleteAlert, acknowledgeAlert };
