const { query } = require('../_db');
const { authenticate, successResponse, setCors, handleError } = require('../_utils');

// Lightweight polling endpoint used by the client instead of a persistent
// WebSocket connection (Vercel serverless functions cannot hold long-lived
// socket connections). Client polls this every few seconds and only new
// alerts since `since` are returned.
module.exports = async (req, res) => {
  setCors(res);
  if (req.method === 'OPTIONS') return res.status(204).end();
  if (req.method !== 'GET') return res.status(405).json({ success: false, message: 'Method not allowed' });

  try {
    await authenticate(req);
    const { since } = req.query;
    const sinceDate = since ? new Date(since) : new Date(Date.now() - 60000);

    const result = await query(
      'SELECT * FROM alerts WHERE created_at > $1 ORDER BY created_at DESC LIMIT 50',
      [sinceDate.toISOString()]
    );

    return successResponse(res, {
      alerts: result.rows,
      polledAt: new Date().toISOString()
    });
  } catch (err) {
    return handleError(res, err);
  }
};
