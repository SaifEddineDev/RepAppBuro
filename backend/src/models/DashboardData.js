const mongoose = require('mongoose');

const dashboardDataSchema = new mongoose.Schema({
  dataSource: {
    type: String,
    required: true,
    enum: ['sales', 'users', 'revenue', 'orders', 'products', 'traffic']
  },
  timePeriod: {
    type: String,
    enum: ['daily', 'weekly', 'monthly', 'yearly', 'real-time'],
    required: true
  },
  data: {
    type: Map,
    of: mongoose.Schema.Types.Mixed,
    required: true
  },
  timestamp: {
    type: Date,
    default: Date.now,
    index: true
  },
  metadata: {
    totalRecords: Number,
    startDate: Date,
    endDate: Date,
    generatedAt: Date
  }
});

// Create indexes for efficient querying
dashboardDataSchema.index({ dataSource: 1, timePeriod: 1, timestamp: -1 });

module.exports = mongoose.model('DashboardData', dashboardDataSchema);