import { Router, Response } from 'express';
import { pool } from '../db/connection';
import { authenticate, AuthRequest } from '../middleware/auth';

export const metricsRouter = Router();
metricsRouter.use(authenticate);

// GET /api/metrics/summary
metricsRouter.get('/summary', async (req: AuthRequest, res: Response) => {
  try {
    const [services, incidents, alerts] = await Promise.all([
      pool.query('SELECT COUNT(*) as total, COUNT(CASE WHEN status = $1 THEN 1 END) as operational FROM services', ['operational']),
      pool.query('SELECT COUNT(*) as total, COUNT(CASE WHEN status = $1 THEN 1 END) as open FROM incidents', ['open']),
      pool.query('SELECT COUNT(*) as total, COUNT(CASE WHEN is_active = true THEN 1 END) as active FROM alert_rules'),
    ]);
    const mttr = await pool.query(`
      SELECT AVG(EXTRACT(EPOCH FROM (resolved_at - created_at))/60) as avg_minutes
      FROM incidents WHERE status = 'resolved' AND resolved_at IS NOT NULL
      AND created_at > NOW() - INTERVAL '30 days'
    `);
    return res.json({
      services: { total: Number(services.rows[0].total), operational: Number(services.rows[0].operational) },
      incidents: { total: Number(incidents.rows[0].total), open: Number(incidents.rows[0].open) },
      alerts: { total: Number(alerts.rows[0].total), active: Number(alerts.rows[0].active) },
      mttr_minutes: Math.round(Number(mttr.rows[0].avg_minutes) || 0),
    });
  } catch {
    return res.status(500).json({ error: 'Failed to fetch summary' });
  }
});

// GET /api/metrics/service/:id
metricsRouter.get('/service/:id', async (req: AuthRequest, res: Response) => {
  try {
    const { hours = 24 } = req.query;
    const result = await pool.query(
      `SELECT DATE_TRUNC('hour', recorded_at) as hour,
        AVG(response_time) as avg_response_time,
        COUNT(*) as checks,
        COUNT(CASE WHEN is_up = true THEN 1 END) as up_count
       FROM metrics WHERE service_id = $1 AND recorded_at > NOW() - INTERVAL '${Number(hours)} hours'
       GROUP BY hour ORDER BY hour`,
      [req.params.id]
    );
    return res.json(result.rows);
  } catch {
    return res.status(500).json({ error: 'Failed to fetch metrics' });
  }
});
