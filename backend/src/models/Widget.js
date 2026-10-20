const mongoose = require('mongoose');

const widgetSchema = new mongoose.Schema({
  type: {
    type: String,
    enum: ['line-chart', 'bar-chart', 'pie-chart', 'metric', 'table', 'gauge'],
    required: true
  },
  title: {
    type: String,
    required: true
  },
  dataSource: {
    type: String, // e.g., 'sales', 'users', 'revenue'
    required: true
  },
  config: {
    type: Map,
    of: mongoose.Schema.Types.Mixed,
    default: new Map()
  },
  refreshInterval: {
    type: Number, // seconds
    default: 300
  },
  dashboard: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Dashboard',
    required: true
  },
  position: {
    x: Number,
    y: Number,
    w: Number,
    h: Number
  }
});

module.exports = mongoose.model('Widget', widgetSchema);