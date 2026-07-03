import { Router, Response } from 'express';
import bcrypt from 'bcryptjs';
import { pool } from '../db/connection';
import { authenticate, authorize, AuthRequest } from '../middleware/auth';

export const usersRouter = Router();
usersRouter.use(authenticate);

usersRouter.get('/', async (req: AuthRequest, res: Response) => {
  try {
    const result = await pool.query(
      'SELECT id, name, email, role, is_active, avatar_url, phone, created_at FROM users ORDER BY created_at DESC'
    );
    return res.json(result.rows);
  } catch {
    return res.status(500).json({ error: 'Failed to fetch users' });
  }
});

usersRouter.post('/', authorize('admin'), async (req: AuthRequest, res: Response) => {
  try {
    const { name, email, password, role } = req.body;
    if (!name || !email || !password) return res.status(400).json({ error: 'Name, email and password are required' });
    const hash = await bcrypt.hash(password, 12);
    const result = await pool.query(
      'INSERT INTO users (name, email, password_hash, role) VALUES ($1,$2,$3,$4) RETURNING id,name,email,role,created_at',
      [name, email.toLowerCase(), hash, role || 'viewer']
    );
    return res.status(201).json(result.rows[0]);
  } catch (error: unknown) {
    const pgError = error as { code?: string };
    if (pgError.code === '23505') return res.status(409).json({ error: 'Email already exists' });
    return res.status(500).json({ error: 'Failed to create user' });
  }
});

usersRouter.put('/:id', async (req: AuthRequest, res: Response) => {
  try {
    const { name, phone, avatar_url, role } = req.body;
    const result = await pool.query(
      'UPDATE users SET name=$1, phone=$2, avatar_url=$3, role=$4, updated_at=NOW() WHERE id=$5 RETURNING id,name,email,role,phone,avatar_url',
      [name, phone, avatar_url, role, req.params.id]
    );
    return res.json(result.rows[0]);
  } catch {
    return res.status(500).json({ error: 'Failed to update user' });
  }
});
