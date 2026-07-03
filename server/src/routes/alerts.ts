import { Router, Response } from 'express';
import { pool } from '../db/connection';
import { authenticate, AuthRequest } from '../middleware/auth';

export const alertsRouter = Router();
alertsRouter.use(authenticate);

alertsRouter.get('/', async (req: AuthRequest, res: Response) => {
  try {
    const result = await pool.query(`
      SELECT ar.*, s.name as service_name FROM alert_rules ar
      LEFT JOIN services s ON ar.service_id = s.id
      ORDER BY ar.created_at DESC
    `);
    return res.json(result.rows);
  } catch {
    return res.status(500).json({ error: 'Failed to fetch alert rules' });
  }
});

alertsRouter.post('/', async (req: AuthRequest, res: Response) => {
  try {
    const { name, service_id, condition_type, condition_value, severity, notification_channels } = req.body;
    if (!name || !condition_type) return res.status(400).json({ error: 'Name and condition type are required' });
    const result = await pool.query(
      `INSERT INTO alert_rules (name, service_id, condition_type, condition_value, severity, notification_channels)
       VALUES ($1,$2,$3,$4,$5,$6) RETURNING *`,
      [name, service_id, condition_type, condition_value, severity || 'warning', JSON.stringify(notification_channels || [])]
    );
    return res.status(201).json(result.rows[0]);
  } catch {
    return res.status(500).json({ error: 'Failed to create alert rule' });
  }
});

alertsRouter.delete('/:id', async (req: AuthRequest, res: Response) => {
  try {
    await pool.query('DELETE FROM alert_rules WHERE id = $1', [req.params.id]);
    return res.json({ message: 'Alert rule deleted' });
  } catch {
    return res.status(500).json({ error: 'Failed to delete alert rule' });
  }
});
