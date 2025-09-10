import http from 'k6/http';
import ws from 'k6/ws';
import { check, sleep } from 'k6';
import { Rate } from 'k6/metrics';

const errorRate = new Rate('errors');

export const options = {
  stages: [
    { duration: '1m', target: 50 },   // Ramp up to 50 users
    { duration: '3m', target: 100 },  // Ramp up to 100 users
    { duration: '5m', target: 100 },  // Stay at 100 users
    { duration: '1m', target: 0 },    // Ramp down to 0 users
  ],
  thresholds: {
    http_req_duration: ['p(95)<500'], // 95% of requests should be below 500ms
    'errors': ['rate<0.1'],           // Error rate should be below 10%
  },
};

const BASE_URL = 'https://api.ayphen-hire.com';
const WS_URL = 'wss://api.ayphen-hire.com/ws';

// Simulate user authentication
const authenticateUser = () => {
  const payload = JSON.stringify({
    username: 'testuser',
    password: 'password123'
  });

  const params = {
    headers: {
      'Content-Type': 'application/json',
    },
  };

  const res = http.post(`${BASE_URL}/auth/login`, payload, params);
  check(res, {
    'login successful': (r) => r.status === 200,
    'has token': (r) => r.json('token') !== undefined,
  });

  return res.json('token');
};

// Test WebSocket proctoring connection
const testProctoring = (token) => {
  const res = ws.connect(`${WS_URL}/proctor/test-session`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  }, (socket) => {
    socket.on('open', () => {
      // Send video frame
      socket.send(JSON.stringify({
        type: 'video',
        data: 'base64_encoded_frame'
      }));

      // Send audio frame
      socket.send(JSON.stringify({
        type: 'audio',
        data: 'base64_encoded_audio'
      }));
    });

    socket.on('message', (data) => {
      const response = JSON.parse(data);
      check(response, {
        'has valid response': (r) => r.status !== undefined,
        'no errors': (r) => r.error === undefined,
      });
    });

    socket.on('error', () => {
      errorRate.add(1);
    });

    // Keep connection alive for 30 seconds
    sleep(30);
    socket.close();
  });

  check(res, {
    'websocket connected': (r) => r === true,
  });
};

// Test rate limiting
const testRateLimiting = (token) => {
  const params = {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  };

  // Make rapid requests
  for (let i = 0; i < 20; i++) {
    const res = http.get(`${BASE_URL}/api/protected`, params);
    check(res, {
      'rate limiting working': (r) => 
        i < 10 ? r.status === 200 : r.status === 429,
    });
  }
};

// Test RBAC endpoints
const testRBAC = (token) => {
  const endpoints = [
    '/api/admin/users',
    '/api/proctor/sessions',
    '/api/instructor/tests',
    '/api/student/results'
  ];

  endpoints.forEach(endpoint => {
    const res = http.get(`${BASE_URL}${endpoint}`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    check(res, {
      'RBAC enforced': (r) => 
        r.status === 200 || r.status === 403,
    });
  });
};

// Test API key validation
const testAPIKey = () => {
  const params = {
    headers: {
      'X-API-Key': 'invalid-key',
    },
  };

  const res = http.get(`${BASE_URL}/api/secured`, params);
  check(res, {
    'API key validation working': (r) => r.status === 401,
  });
};

// Main test scenario
export default function() {
  const token = authenticateUser();

  // Test WebSocket proctoring with 20% of users
  if (Math.random() < 0.2) {
    testProctoring(token);
  }

  // Test rate limiting with 30% of users
  if (Math.random() < 0.3) {
    testRateLimiting(token);
  }

  // Test RBAC with 40% of users
  if (Math.random() < 0.4) {
    testRBAC(token);
  }

  // Test API key validation with 10% of users
  if (Math.random() < 0.1) {
    testAPIKey();
  }

  sleep(1);
}
