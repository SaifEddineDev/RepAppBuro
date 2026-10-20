const DashboardData = require('../models/DashboardData');

class AnalyticsService {
  
  // Aggregate data over time period
  async aggregateData(dataSource, aggregationType, startDate, endDate) {
    const matchStage = {
      dataSource,
      timestamp: { $gte: new Date(startDate), $lte: new Date(endDate) }
    };
    
    const aggregationPipeline = [
      { $match: matchStage },
      { $sort: { timestamp: 1 } }
    ];
    
    switch (aggregationType) {
      case 'hourly':
        aggregationPipeline.push({
          $group: {
            _id: {
              year: { $year: '$timestamp' },
              month: { $month: '$timestamp' },
              day: { $dayOfMonth: '$timestamp' },
              hour: { $hour: '$timestamp' }
            },
            data: { $push: '$data' }
          }
        });
        break;
        
      case 'daily':
        aggregationPipeline.push({
          $group: {
            _id: {
              year: { $year: '$timestamp' },
              month: { $month: '$timestamp' },
              day: { $dayOfMonth: '$timestamp' }
            },
            data: { $push: '$data' }
          }
        });
        break;
        
      case 'weekly':
        aggregationPipeline.push({
          $group: {
            _id: {
              year: { $year: '$timestamp' },
              week: { $week: '$timestamp' }
            },
            data: { $push: '$data' }
          }
        });
        break;
    }
    
    return await DashboardData.aggregate(aggregationPipeline);
  }
  
  // Calculate trends and growth
  calculateTrend(currentValue, previousValue) {
    if (!previousValue || previousValue === 0) return 100;
    return ((currentValue - previousValue) / previousValue) * 100;
  }
  
  // Generate insights from data
  generateInsights(data) {
    const insights = [];
    
    // Example insight generation logic
    if (data.users && data.users.growth < -5) {
      insights.push({
        type: 'warning',
        message: 'User growth is declining',
        suggestion: 'Consider running a marketing campaign'
      });
    }
    
    if (data.revenue && data.revenue.growth > 20) {
      insights.push({
        type: 'success',
        message: 'Revenue growing strongly',
        suggestion: 'Consider expanding inventory'
      });
    }
    
    return insights;
  }
  
  // Format data for specific widget types
  formatForWidget(widgetType, rawData) {
    switch (widgetType) {
      case 'line-chart':
        return this.formatLineChartData(rawData);
        
      case 'bar-chart':
        return this.formatBarChartData(rawData);
        
      case 'pie-chart':
        return this.formatPieChartData(rawData);
        
      case 'metric':
        return this.formatMetricData(rawData);
        
      default:
        return rawData;
    }
  }
  
  formatLineChartData(data) {
    return {
      labels: Object.keys(data),
      datasets: [{
        label: 'Value',
        data: Object.values(data).map(d => typeof d === 'object' ? d.value || d.amount : d),
        borderColor: 'rgb(75, 192, 192)',
        tension: 0.1
      }]
    };
  }
  
  formatBarChartData(data) {
    return {
      labels: Object.keys(data),
      datasets: [{
        label: 'Count',
        data: Object.values(data).map(d => typeof d === 'object' ? d.count || d.value : d),
        backgroundColor: 'rgba(54, 162, 235, 0.5)'
      }]
    };
  }
  
  formatPieChartData(data) {
    return {
      labels: Object.keys(data),
      datasets: [{
        data: Object.values(data),
        backgroundColor: [
          '#FF6384', '#36A2EB', '#FFCE56', '#4BC0C0',
          '#9966FF', '#FF9F40', '#FF6384', '#C9CBCF'
        ]
      }]
    };
  }
  
  formatMetricData(data) {
    return {
      value: data.current || data.total || 0,
      previous: data.previous || 0,
      change: data.change || 0,
      trend: data.trend || 'neutral'
    };
  }
}

module.exports = new AnalyticsService();