const { query } = require('./_db');
const { setCors } = require('./_utils');

module.exports = async (req, res) => {
  setCors(res);
  if (req.method === 'OPTIONS') return res.status(204).end();

  try {
    await query('SELECT 1', []);
    return res.status(200).json({
      success: true,
      status: 'operational',
      services: { api: 'up', database: 'up' },
      version: process.env.npm_package_version || '1.0.0',
      timestamp: new Date().toISOString()
    });
  } catch (err) {
    return res.status(503).json({
      success: false,
      status: 'degraded',
      services: { api: 'up', database: 'down' },
      timestamp: new Date().toISOString()
    });
  }
};
