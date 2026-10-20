const DashboardData = require('../models/DashboardData');
const User = require('../models/User');

// Get analytics data for specific data source
exports.getAnalyticsData = async (req, res) => {
  try {
    const { dataSource, timePeriod, startDate, endDate } = req.query;
    
    const query = { dataSource, timePeriod };
    
    // Add date range if provided
    if (startDate && endDate) {
      query.timestamp = {
        $gte: new Date(startDate),
        $lte: new Date(endDate)
      };
    }
    
    const data = await DashboardData.find(query)
      .sort({ timestamp: -1 })
      .limit(100); // Limit to prevent overload
    
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Get summary metrics
exports.getMetrics = async (req, res) => {
  try {
    const { metrics } = req.query;
    const requestedMetrics = metrics ? metrics.split(',') : ['users', 'revenue', 'orders'];
    
    const results = {};
    
    for (const metric of requestedMetrics) {
      switch (metric) {
        case 'users':
          const totalUsers = await User.countDocuments();
          const activeUsers = await User.countDocuments({ lastActive: { $gt: new Date(Date.now() - 24 * 60 * 60 * 1000) } });
          results.users = { total: totalUsers, active: activeUsers };
          break;
          
        case 'revenue':
          // Example: Sum revenue from your orders/sales model
          // You'll need to replace this with your actual revenue calculation
          results.revenue = { 
            total: 15000, // Placeholder
            today: 500, 
            change: 12.5 
          };
          break;
          
        case 'orders':
          // Placeholder - replace with your actual orders model
          results.orders = { 
            total: 1200, 
            pending: 45, 
            completed: 1155 
          };
          break;
          
        default:
          results[metric] = { value: 0, status: 'not_implemented' };
      }
    }
    
    res.json(results);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Generate sample data for testing
exports.generateSampleData = async (req, res) => {
  try {
    const sampleData = {
      sales: generateSalesData(),
      users: generateUserData(),
      revenue: generateRevenueData()
    };
    
    // Save sample data
    for (const [dataSource, data] of Object.entries(sampleData)) {
      await DashboardData.create({
        dataSource,
        timePeriod: 'daily',
        data,
        metadata: {
          totalRecords: Object.keys(data).length,
          generatedAt: new Date()
        }
      });
    }
    
    res.json({ message: 'Sample data generated successfully', sampleData });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Helper functions for sample data
function generateSalesData() {
  const data = {};
  const now = new Date();
  
  for (let i = 30; i >= 0; i--) {
    const date = new Date(now);
    date.setDate(date.getDate() - i);
    const dateKey = date.toISOString().split('T')[0];
    data[dateKey] = {
      amount: Math.floor(Math.random() * 1000) + 500,
      count: Math.floor(Math.random() * 50) + 10,
      average: Math.floor(Math.random() * 100) + 20
    };
  }
  
  return data;
}

function generateUserData() {
  const categories = ['new', 'returning', 'active', 'churned'];
  const data = {};
  
  categories.forEach(category => {
    data[category] = Math.floor(Math.random() * 1000) + 100;
  });
  
  return data;
}

function generateRevenueData() {
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'];
  const data = {};
  
  months.forEach(month => {
    data[month] = Math.floor(Math.random() * 10000) + 5000;
  });
  
  return data;
}