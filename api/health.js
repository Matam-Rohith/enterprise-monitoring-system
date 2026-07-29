const { setCors } = require('./_utils');

module.exports = (req, res) => {
  setCors(res);
  if (req.method === 'OPTIONS') return res.status(204).end();

  return res.status(200).json({
    success: true,
    status: 'healthy',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'production'
  });
};
