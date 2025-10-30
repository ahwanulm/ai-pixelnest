// Middleware to check if user is admin
function ensureAdmin(req, res, next) {
  if (!req.isAuthenticated()) {
    return res.redirect('/login');
  }
  
  if (req.user.role !== 'admin') {
    const error = new Error('You do not have permission to access the admin panel. Admin access required.');
    error.status = 403;
    
    return res.status(403).render('error', {
      title: 'Access Denied - Admin Only',
      message: 'You do not have permission to access the admin panel. Only administrators can access this area.',
      error: error,
      stack: null
    });
  }
  
  next();
}

// Middleware to log admin activity
function logAdminActivity(activityType) {
  return async (req, res, next) => {
    try {
      const { pool } = require('../config/database');
      
      await pool.query(`
        INSERT INTO user_activity_logs (user_id, activity_type, description, ip_address, user_agent, metadata)
        VALUES ($1, $2, $3, $4, $5, $6)
      `, [
        req.user.id,
        activityType,
        `Admin action: ${activityType}`,
        req.ip,
        req.get('user-agent'),
        JSON.stringify({
          path: req.path,
          method: req.method,
          body: req.body,
          params: req.params
        })
      ]);
    } catch (error) {
      console.error('Error logging admin activity:', error);
    }
    
    next();
  };
}

// Middleware to add admin-specific data to views
function addAdminDataToViews(req, res, next) {
  res.locals.isAdmin = req.isAuthenticated() && req.user.role === 'admin';
  next();
}

module.exports = {
  ensureAdmin,
  logAdminActivity,
  addAdminDataToViews
};

