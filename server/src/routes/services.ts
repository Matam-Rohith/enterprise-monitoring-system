import { Router, Response } from 'express';
import { pool } from '../db/connection';
import { authenticate, AuthRequest } from '../middleware/auth';
import { io } from '../index';

export const servicesRouter = Router();
servicesRouter.use(authenticate);

// GET /api/services
servicesRouter.get('/', async (req: AuthRequest, res: Response) => {
  try {
    const result = await pool.query(`
      SELECT s.*, u.name as owner_name,
        (SELECT COUNT(*) FROM incidents i WHERE i.service_id = s.id AND i.status != 'resolved') as open_incidents,
        (SELECT response_time FROM metrics m WHERE m.service_id = s.id ORDER BY recorded_at DESC LIMIT 1) as last_response_time
      FROM services s
      LEFT JOIN users u ON s.owner_id = u.id
      ORDER BY s.created_at DESC
    `);
    return res.json(result.rows);
  } catch (error) {
    return res.status(500).json({ error: 'Failed to fetch services' });
  }
});

// POST /api/services
servicesRouter.post('/', async (req: AuthRequest, res: Response) => {
  try {
    const { name, description, url, team, check_interval } = req.body;
    if (!name) return res.status(400).json({ error: 'Service name is required' });
    const result = await pool.query(
      `INSERT INTO services (name, description, url, team, owner_id, check_interval)
       VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`,
      [name, description, url, team, req.user?.userId, check_interval || 60]
    );
    io.emit('service:created', result.rows[0]);
    return res.status(201).json(result.rows[0]);
  } catch (error) {
    return res.status(500).json({ error: 'Failed to create service' });
  }
});

// PUT /api/services/:id
servicesRouter.put('/:id', async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { name, description, url, team, status, check_interval } = req.body;
    const result = await pool.query(
      `UPDATE services SET name=$1, description=$2, url=$3, team=$4, status=$5, check_interval=$6, updated_at=NOW()
       WHERE id=$7 RETURNING *`,
      [name, description, url, team, status, check_interval, id]
    );
    if (!result.rows[0]) return res.status(404).json({ error: 'Service not found' });
    io.emit('service:updated', result.rows[0]);
    return res.json(result.rows[0]);
  } catch (error) {
    return res.status(500).json({ error: 'Failed to update service' });
  }
});

// DELETE /api/services/:id
servicesRouter.delete('/:id', async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    await pool.query('DELETE FROM services WHERE id = $1', [id]);
    io.emit('service:deleted', { id });
    return res.json({ message: 'Service deleted successfully' });
  } catch (error) {
    return res.status(500).json({ error: 'Failed to delete service' });
  }
});
