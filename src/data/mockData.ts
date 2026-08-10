export const trafficData = [
  { time: '00:00', requests: 1240, errors: 28, p95: 142 },
  { time: '02:00', requests: 890, errors: 12, p95: 98 },
  { time: '04:00', requests: 640, errors: 8, p95: 76 },
  { time: '06:00', requests: 1100, errors: 18, p95: 112 },
  { time: '08:00', requests: 2840, errors: 62, p95: 198 },
  { time: '10:00', requests: 4210, errors: 95, p95: 245 },
  { time: '12:00', requests: 5680, errors: 134, p95: 312 },
  { time: '14:00', requests: 6120, errors: 148, p95: 334 },
  { time: '16:00', requests: 5890, errors: 128, p95: 298 },
  { time: '18:00', requests: 4340, errors: 89, p95: 224 },
  { time: '20:00', requests: 3210, errors: 56, p95: 178 },
  { time: '22:00', requests: 2100, errors: 34, p95: 156 },
];

export const responseTimeData = [
  { date: 'Mon', avg: 142, max: 892, min: 45, p95: 312 },
  { date: 'Tue', avg: 138, max: 756, min: 42, p95: 289 },
  { date: 'Wed', avg: 165, max: 1240, min: 48, p95: 398 },
  { date: 'Thu', avg: 151, max: 934, min: 44, p95: 342 },
  { date: 'Fri', avg: 189, max: 1580, min: 52, p95: 456 },
  { date: 'Sat', avg: 124, max: 678, min: 38, p95: 267 },
  { date: 'Sun', avg: 118, max: 612, min: 36, p95: 234 },
];

export const errorDistribution = [
  { name: 'HTTP 400', value: 1240, color: '#F59E0B' },
  { name: 'HTTP 401', value: 890, color: '#EF4444' },
  { name: 'HTTP 403', value: 456, color: '#DC2626' },
  { name: 'HTTP 404', value: 2180, color: '#F97316' },
  { name: 'HTTP 500', value: 678, color: '#991B1B' },
  { name: 'HTTP 503', value: 234, color: '#7C3AED' },
];

export const weeklyTraffic = [
  { week: 'W1', requests: 124000, success: 118200, errors: 5800 },
  { week: 'W2', requests: 138000, success: 131600, errors: 6400 },
  { week: 'W3', requests: 156000, success: 149280, errors: 6720 },
  { week: 'W4', requests: 142000, success: 135660, errors: 6340 },
  { week: 'W5', requests: 168000, success: 161280, errors: 6720 },
  { week: 'W6', requests: 183000, success: 176490, errors: 6510 },
];

export const mlPrediction = [
  { time: 'Now', actual: 5680, predicted: null, lower: null, upper: null },
  { time: '+1h', actual: null, predicted: 5920, lower: 5100, upper: 6740 },
  { time: '+2h', actual: null, predicted: 6240, lower: 5320, upper: 7160 },
  { time: '+3h', actual: null, predicted: 6580, lower: 5540, upper: 7620 },
  { time: '+4h', actual: null, predicted: 7120, lower: 5920, upper: 8320 },
  { time: '+5h', actual: null, predicted: 7680, lower: 6240, upper: 9120 },
  { time: '+6h', actual: null, predicted: 8200, lower: 6560, upper: 9840 },
];

export const heatmapData = Array.from({ length: 7 }, (_, day) =>
  Array.from({ length: 24 }, (_, hour) => ({
    day,
    hour,
    value: Math.floor(Math.random() * 8000 + 500),
  }))
).flat();

export const apis = [
  { id: 1, name: 'User Authentication API', endpoint: '/api/v2/auth', method: 'POST', version: 'v2.4.1', owner: 'Platform Team', status: 'healthy', category: 'Security', description: 'JWT-based authentication and token management', requests: 4280000, errorRate: 0.8, avgResponse: 124, uptime: 99.98 },
  { id: 2, name: 'Payment Processing API', endpoint: '/api/v1/payments', method: 'POST', version: 'v1.8.3', owner: 'Payments Team', status: 'warning', category: 'Finance', description: 'Stripe-integrated payment processing and refunds', requests: 2140000, errorRate: 2.3, avgResponse: 456, uptime: 99.72 },
  { id: 3, name: 'Product Catalog API', endpoint: '/api/v3/products', method: 'GET', version: 'v3.1.0', owner: 'Commerce Team', status: 'healthy', category: 'Commerce', description: 'Product listing, search, and inventory management', requests: 8920000, errorRate: 0.4, avgResponse: 89, uptime: 99.99 },
  { id: 4, name: 'Analytics Ingestion API', endpoint: '/api/v2/events', method: 'POST', version: 'v2.0.7', owner: 'Data Team', status: 'healthy', category: 'Analytics', description: 'Real-time event ingestion and stream processing', requests: 12450000, errorRate: 0.2, avgResponse: 67, uptime: 99.97 },
  { id: 5, name: 'Notification Service API', endpoint: '/api/v1/notify', method: 'POST', version: 'v1.5.2', owner: 'Comms Team', status: 'slow', category: 'Messaging', description: 'Multi-channel push, email, and SMS notifications', requests: 1890000, errorRate: 1.8, avgResponse: 678, uptime: 99.45 },
  { id: 6, name: 'User Profile API', endpoint: '/api/v2/users', method: 'GET', version: 'v2.3.4', owner: 'Platform Team', status: 'healthy', category: 'Users', description: 'User profile management and preference storage', requests: 6340000, errorRate: 0.6, avgResponse: 112, uptime: 99.96 },
  { id: 7, name: 'Search API', endpoint: '/api/v3/search', method: 'GET', version: 'v3.0.2', owner: 'Search Team', status: 'healthy', category: 'Search', description: 'Full-text search powered by Elasticsearch', requests: 9870000, errorRate: 0.3, avgResponse: 134, uptime: 99.98 },
  { id: 8, name: 'Order Management API', endpoint: '/api/v2/orders', method: 'POST', version: 'v2.1.5', owner: 'Commerce Team', status: 'down', category: 'Commerce', description: 'Order lifecycle management and fulfillment', requests: 3120000, errorRate: 8.4, avgResponse: 1240, uptime: 97.82 },
  { id: 9, name: 'Inventory API', endpoint: '/api/v1/inventory', method: 'GET', version: 'v1.9.1', owner: 'Ops Team', status: 'healthy', category: 'Operations', description: 'Real-time inventory tracking and warehouse sync', requests: 4560000, errorRate: 0.5, avgResponse: 98, uptime: 99.94 },
  { id: 10, name: 'Reporting API', endpoint: '/api/v2/reports', method: 'GET', version: 'v2.2.0', owner: 'BI Team', status: 'warning', category: 'Analytics', description: 'Scheduled and on-demand business intelligence reports', requests: 890000, errorRate: 3.1, avgResponse: 2340, uptime: 99.12 },
];

export const users = [
  { id: 1, name: 'Alexandra Chen', email: 'alex.chen@acme.com', username: 'alex.chen', password: 'Admin@2026', role: 'Admin', department: 'Platform', status: 'active', lastLogin: '2026-08-04 09:42', apis: 24 },
  { id: 2, name: 'Marcus Johnson', email: 'm.johnson@acme.com', username: 'marcus.j', password: 'Dev@2026!', role: 'Developer', department: 'Payments', status: 'active', lastLogin: '2026-08-04 08:15', apis: 12 },
  { id: 3, name: 'Sarah Williams', email: 's.williams@acme.com', username: 'sarah.w', password: 'Dev@2026!', role: 'Developer', department: 'Commerce', status: 'active', lastLogin: '2026-08-03 17:33', apis: 8 },
  { id: 4, name: 'David Park', email: 'd.park@acme.com', username: 'david.park', password: 'View@2026!', role: 'Viewer', department: 'Analytics', status: 'active', lastLogin: '2026-08-04 10:01', apis: 0 },
  { id: 5, name: 'Emma Rodriguez', email: 'e.rodriguez@acme.com', username: 'emma.rod', password: 'Dev@2026!', role: 'Developer', department: 'Data', status: 'inactive', lastLogin: '2026-07-28 14:22', apis: 6 },
  { id: 6, name: 'James Wilson', email: 'j.wilson@acme.com', username: 'james.w', password: 'Admin@2026', role: 'Admin', department: 'Security', status: 'active', lastLogin: '2026-08-04 07:58', apis: 31 },
  { id: 7, name: 'Priya Patel', email: 'p.patel@acme.com', username: 'priya.p', password: 'Dev@2026!', role: 'Developer', department: 'Search', status: 'active', lastLogin: '2026-08-04 09:17', apis: 15 },
];

export const anomalies = [
  { id: 1, time: '14:32', type: 'Traffic Spike', api: 'Product Catalog API', severity: 'warning', description: '340% above normal traffic baseline detected', resolved: false },
  { id: 2, time: '13:58', type: 'Slow Response', api: 'Notification Service API', severity: 'warning', description: 'P95 latency exceeds 1200ms threshold for 8 minutes', resolved: false },
  { id: 3, time: '13:12', type: 'High Error Rate', api: 'Order Management API', severity: 'error', description: 'Error rate spiked to 8.4% — 5x above SLA threshold', resolved: false },
  { id: 4, time: '12:45', type: 'Suspicious Activity', api: 'User Authentication API', severity: 'error', description: 'Brute-force pattern: 1,240 failed logins from 3 IPs', resolved: true },
  { id: 5, time: '11:23', type: 'Traffic Spike', api: 'Search API', severity: 'info', description: '180% traffic increase — within automated scaling capacity', resolved: true },
];
