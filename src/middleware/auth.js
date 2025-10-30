const { pool } = require('../config/database');

// Middleware to check if user is authenticated and refresh user data
async function ensureAuthenticated(req, res, next) {
  if (req.isAuthenticated()) {
    // Refresh user data from database to get latest avatar_url and other info
    try {
      const result = await pool.query(
        'SELECT id, name, email, credits, avatar_url, role, google_id FROM users WHERE id = $1',
        [req.user.id]
      );
      
      if (result.rows.length > 0) {
        req.user = result.rows[0];
        
        // Parse credits from string (DECIMAL) to number for view rendering
        if (req.user.credits) {
          req.user.credits = parseFloat(req.user.credits);
        }
      }
    } catch (error) {
      console.error('Error refreshing user data:', error);
    }
    
    return next();
  }
  res.redirect('/login');
}

// Middleware to check if user is NOT authenticated (for login/register pages)
function ensureGuest(req, res, next) {
  if (req.isAuthenticated()) {
    return res.redirect('/dashboard');
  }
  next();
}

// Middleware to add user to all views
function addUserToViews(req, res, next) {
  // Parse credits if user exists (DECIMAL returns as string from PostgreSQL)
  if (req.user && req.user.credits) {
    req.user.credits = parseFloat(req.user.credits);
  }
  
  res.locals.user = req.user || null;
  res.locals.isAuthenticated = req.isAuthenticated();
  res.locals.isAdmin = req.user && req.user.role === 'admin';
  next();
}

module.exports = {
  ensureAuthenticated,
  ensureGuest,
  addUserToViews
};

