const { query } = require('../config/database');

const auditLog = async (req, res, next) => {
  // Store original json method
  const originalJson = res.json;

  // Override json method to capture response
  res.json = function(data) {
    // Log the action after response is sent
    setImmediate(async () => {
      try {
        const userId = req.user?.id || null;
        const action = `${req.method} ${req.path}`;
        const entityType = req.path.split('/')[1] || 'unknown';
        const entityId = req.params.id || data?.id || null;

        await query(
          `INSERT INTO audit_logs (user_id, action, entity_type, entity_id, details, ip_address, user_agent)
           VALUES ($1, $2, $3, $4, $5, $6, $7)`,
          [
            userId,
            action,
            entityType,
            entityId,
            JSON.stringify({
              method: req.method,
              path: req.path,
              params: req.params,
              query: req.query,
              statusCode: res.statusCode,
            }),
            req.ip || req.connection.remoteAddress,
            req.get('user-agent'),
          ]
        );
      } catch (error) {
        console.error('Audit log error:', error);
      }
    });

    // Call original json method
    return originalJson.call(this, data);
  };

  next();
};

module.exports = auditLog;

