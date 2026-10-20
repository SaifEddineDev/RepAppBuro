const Dashboard = require('../models/Dashboard');

// Check if user has access to dashboard
const checkDashboardAccess = async (req, res, next) => {
  try {
    const dashboardId = req.params.dashboardId || req.params.id;
    const userId = req.user.id;
    
    const dashboard = await Dashboard.findById(dashboardId);
    
    if (!dashboard) {
      return res.status(404).json({ error: 'Dashboard not found' });
    }
    
    // Check if user is owner
    if (dashboard.owner.toString() === userId.toString()) {
      req.dashboardPermission = 'owner';
      return next();
    }
    
    // Check if dashboard is public
    if (dashboard.isPublic) {
      req.dashboardPermission = 'viewer';
      return next();
    }
    
    // Check if user is shared with
    const sharedAccess = dashboard.sharedWith.find(
      share => share.user.toString() === userId.toString()
    );
    
    if (sharedAccess) {
      req.dashboardPermission = sharedAccess.permission;
      return next();
    }
    
    res.status(403).json({ error: 'Access denied to this dashboard' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Check specific permission level
const requireDashboardPermission = (requiredPermission) => {
  return (req, res, next) => {
    const userPermission = req.dashboardPermission;
    
    if (requiredPermission === 'edit' && userPermission !== 'owner' && userPermission !== 'edit') {
      return res.status(403).json({ error: 'Edit permission required' });
    }
    
    if (requiredPermission === 'owner' && userPermission !== 'owner') {
      return res.status(403).json({ error: 'Owner permission required' });
    }
    
    next();
  };
};

module.exports = {
  checkDashboardAccess,
  requireDashboardPermission
};