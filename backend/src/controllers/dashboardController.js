const Dashboard = require('../models/Dashboard');
const Widget = require('../models/Widget');

exports.createDashboard = async (req, res) => {
  try {
    const dashboard = new Dashboard({
      ...req.body,
      owner: req.user.id
    });
    await dashboard.save();
    res.status(201).json(dashboard);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

exports.getDashboards = async (req, res) => {
  try {
    const dashboards = await Dashboard.find({
      $or: [
        { owner: req.user.id },
        { 'sharedWith.user': req.user.id },
        { isPublic: true }
      ]
    }).populate('widgets');
    res.json(dashboards);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.updateDashboardLayout = async (req, res) => {
  try {
    const { dashboardId } = req.params;
    const { layout, widgets } = req.body;
    
    // Update widget positions
    await Promise.all(widgets.map(async (widget) => {
      await Widget.findByIdAndUpdate(widget.id, {
        position: widget.position
      });
    }));
    
    // Update dashboard layout
    const dashboard = await Dashboard.findByIdAndUpdate(
      dashboardId,
      { layout, updatedAt: Date.now() },
      { new: true }
    );
    
    res.json(dashboard);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};


// Add these methods to your existing dashboardController.js

exports.getDashboardById = async (req, res) => {
  try {
    const dashboard = await Dashboard.findById(req.params.id)
      .populate('widgets')
      .populate('owner', 'username email')
      .populate('sharedWith.user', 'username email');
    
    if (!dashboard) {
      return res.status(404).json({ error: 'Dashboard not found' });
    }
    
    res.json(dashboard);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.updateDashboard = async (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;
    
    // Remove fields that shouldn't be updated
    delete updates.owner;
    delete updates.createdAt;
    
    const dashboard = await Dashboard.findByIdAndUpdate(
      id,
      { ...updates, updatedAt: Date.now() },
      { new: true, runValidators: true }
    );
    
    res.json(dashboard);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

exports.deleteDashboard = async (req, res) => {
  try {
    const { id } = req.params;
    
    // Delete associated widgets first
    await Widget.deleteMany({ dashboard: id });
    
    // Delete dashboard
    await Dashboard.findByIdAndDelete(id);
    
    res.json({ message: 'Dashboard deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.shareDashboard = async (req, res) => {
  try {
    const { id } = req.params;
    const { userId, permission } = req.body;
    
    const dashboard = await Dashboard.findById(id);
    
    if (!dashboard) {
      return res.status(404).json({ error: 'Dashboard not found' });
    }
    
    // Check if user is already shared
    const existingShare = dashboard.sharedWith.find(
      share => share.user.toString() === userId
    );
    
    if (existingShare) {
      // Update existing permission
      existingShare.permission = permission;
    } else {
      // Add new share
      dashboard.sharedWith.push({ user: userId, permission });
    }
    
    await dashboard.save();
    
    res.json({ message: 'Dashboard shared successfully', dashboard });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

exports.createWidget = async (req, res) => {
  try {
    const { dashboardId } = req.params;
    const widgetData = req.body;
    
    // Create widget
    const widget = new Widget({
      ...widgetData,
      dashboard: dashboardId
    });
    
    await widget.save();
    
    // Add widget to dashboard
    const dashboard = await Dashboard.findByIdAndUpdate(
      dashboardId,
      { $push: { widgets: widget._id } },
      { new: true }
    );
    
    res.status(201).json({ widget, dashboard });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};