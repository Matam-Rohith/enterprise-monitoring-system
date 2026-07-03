import { Router, Response } from 'express';
import { pool } from '../db/connection';
import { authenticate, AuthRequest } from '../middleware/auth';
import { io } from '../index';

export const incidentsRouter = Router();
incidentsRouter.use(authenticate);

// GET /api/incidents
incidentsRouter.get('/', async (req: AuthRequest, res: Response) => {
  try {
    const { status, severity, service_id, page = 1, limit = 20 } = req.query;
    const offset = (Number(page) - 1) * Number(limit);
    let query = `
      SELECT i.*, s.name as service_name,
        u1.name as assignee_name, u2.name as reporter_name
      FROM incidents i
      LEFT JOIN services s ON i.service_id = s.id
      LEFT JOIN users u1 ON i.assignee_id = u1.id
      LEFT JOIN users u2 ON i.reporter_id = u2.id
      WHERE 1=1
    `;
    const params: unknown[] = [];
    let idx = 1;
    if (status) { query += ` AND i.status = $${idx++}`; params.push(status); }
    if (severity) { query += ` AND i.severity = $${idx++}`; params.push(severity); }
    if (service_id) { query += ` AND i.service_id = $${idx++}`; params.push(service_id); }
    query += ` ORDER BY i.created_at DESC LIMIT $${idx++} OFFSET $${idx++}`;
    params.push(Number(limit), offset);
    const result = await pool.query(query, params);
    const countResult = await pool.query('SELECT COUNT(*) FROM incidents WHERE 1=1');
    return res.json({ data: result.rows, total: Number(countResult.rows[0].count), page: Number(page), limit: Number(limit) });
  } catch (error) {
    return res.status(500).json({ error: 'Failed to fetch incidents' });
  }
});

// POST /api/incidents
incidentsRouter.post('/', async (req: AuthRequest, res: Response) => {
  try {
    const { title, description, severity, service_id, assignee_id } = req.body;
    if (!title) return res.status(400).json({ error: 'Title is required' });
    const result = await pool.query(
      `INSERT INTO incidents (title, description, severity, service_id, assignee_id, reporter_id)
       VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`,
      [title, description, severity || 'medium', service_id, assignee_id, req.user?.userId]
    );
    io.emit('incident:created', result.rows[0]);
    return res.status(201).json(result.rows[0]);
  } catch (error) {
    return res.status(500).json({ error: 'Failed to create incident' });
  }
});

// PUT /api/incidents/:id
incidentsRouter.put('/:id', async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { title, description, status, severity, assignee_id } = req.body;
    const resolved_at = status === 'resolved' ? 'NOW()' : 'NULL';
    const result = await pool.query(
      `UPDATE incidents SET title=$1, description=$2, status=$3, severity=$4, assignee_id=$5,
       resolved_at=${resolved_at}, updated_at=NOW() WHERE id=$6 RETURNING *`,
      [title, description, status, severity, assignee_id, id]
    );
    if (!result.rows[0]) return res.status(404).json({ error: 'Incident not found' });
    // Add update timeline entry
    await pool.query(
      `INSERT INTO incident_updates (incident_id, user_id, message, status_change) VALUES ($1, $2, $3, $4)`,
      [id, req.user?.userId, `Status changed to ${status}`, status]
    );
    io.emit('incident:updated', result.rows[0]);
    return res.json(result.rows[0]);
  } catch (error) {
    return res.status(500).json({ error: 'Failed to update incident' });
  }
});

// GET /api/incidents/:id/updates
incidentsRouter.get('/:id/updates', async (req: AuthRequest, res: Response) => {
  try {
    const result = await pool.query(
      `SELECT iu.*, u.name as user_name FROM incident_updates iu
       LEFT JOIN users u ON iu.user_id = u.id
       WHERE iu.incident_id = $1 ORDER BY iu.created_at ASC`,
      [req.params.id]
    );
    return res.json(result.rows);
  } catch (error) {
    return res.status(500).json({ error: 'Failed to fetch updates' });
  }
});
