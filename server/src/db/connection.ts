import { Pool } from 'pg';
import { logger } from '../utils/logger';

export const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
});

export async function connectDB(): Promise<void> {
  try {
    const client = await pool.connect();
    await client.query('SELECT 1');
    client.release();
    logger.info('✅ PostgreSQL connected successfully');
    await runMigrations();
  } catch (error) {
    logger.error('❌ PostgreSQL connection failed:', error);
    throw error;
  }
}

async function runMigrations(): Promise<void> {
  const client = await pool.connect();
  try {
    await client.query(`
      CREATE TABLE IF NOT EXISTS users (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        name VARCHAR(255) NOT NULL,
        email VARCHAR(255) UNIQUE NOT NULL,
        password_hash VARCHAR(255) NOT NULL,
        role VARCHAR(50) NOT NULL DEFAULT 'viewer',
        is_active BOOLEAN DEFAULT true,
        avatar_url VARCHAR(500),
        phone VARCHAR(50),
        created_at TIMESTAMPTZ DEFAULT NOW(),
        updated_at TIMESTAMPTZ DEFAULT NOW()
      );

      CREATE TABLE IF NOT EXISTS services (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        name VARCHAR(255) NOT NULL,
        description TEXT,
        url VARCHAR(500),
        status VARCHAR(50) DEFAULT 'operational',
        team VARCHAR(255),
        owner_id UUID REFERENCES users(id),
        check_interval INTEGER DEFAULT 60,
        created_at TIMESTAMPTZ DEFAULT NOW(),
        updated_at TIMESTAMPTZ DEFAULT NOW()
      );

      CREATE TABLE IF NOT EXISTS incidents (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        title VARCHAR(500) NOT NULL,
        description TEXT,
        status VARCHAR(50) DEFAULT 'open',
        severity VARCHAR(50) DEFAULT 'medium',
        service_id UUID REFERENCES services(id),
        assignee_id UUID REFERENCES users(id),
        reporter_id UUID REFERENCES users(id),
        resolved_at TIMESTAMPTZ,
        created_at TIMESTAMPTZ DEFAULT NOW(),
        updated_at TIMESTAMPTZ DEFAULT NOW()
      );

      CREATE TABLE IF NOT EXISTS incident_updates (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        incident_id UUID REFERENCES incidents(id) ON DELETE CASCADE,
        user_id UUID REFERENCES users(id),
        message TEXT NOT NULL,
        status_change VARCHAR(100),
        created_at TIMESTAMPTZ DEFAULT NOW()
      );

      CREATE TABLE IF NOT EXISTS alert_rules (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        name VARCHAR(255) NOT NULL,
        service_id UUID REFERENCES services(id),
        condition_type VARCHAR(100) NOT NULL,
        condition_value NUMERIC,
        severity VARCHAR(50) DEFAULT 'warning',
        is_active BOOLEAN DEFAULT true,
        notification_channels JSONB DEFAULT '[]',
        created_at TIMESTAMPTZ DEFAULT NOW(),
        updated_at TIMESTAMPTZ DEFAULT NOW()
      );

      CREATE TABLE IF NOT EXISTS metrics (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        service_id UUID REFERENCES services(id),
        response_time NUMERIC,
        status_code INTEGER,
        is_up BOOLEAN,
        error_message TEXT,
        recorded_at TIMESTAMPTZ DEFAULT NOW()
      );

      CREATE INDEX IF NOT EXISTS idx_metrics_service_id ON metrics(service_id);
      CREATE INDEX IF NOT EXISTS idx_metrics_recorded_at ON metrics(recorded_at);
      CREATE INDEX IF NOT EXISTS idx_incidents_status ON incidents(status);
      CREATE INDEX IF NOT EXISTS idx_incidents_service_id ON incidents(service_id);
    `);

    // Seed admin user
    const adminCheck = await client.query('SELECT id FROM users WHERE email = $1', ['admin@example.com']);
    if (adminCheck.rows.length === 0) {
      const bcrypt = require('bcryptjs');
      const hash = await bcrypt.hash('Admin@123', 12);
      await client.query(
        `INSERT INTO users (name, email, password_hash, role) VALUES ($1, $2, $3, $4)`,
        ['Admin User', 'admin@example.com', hash, 'admin']
      );
      logger.info('✅ Admin user seeded');
    }

    logger.info('✅ Database migrations completed');
  } finally {
    client.release();
  }
}
