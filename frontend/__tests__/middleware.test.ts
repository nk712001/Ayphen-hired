// Mock NextRequest for test environment
const NextRequest = function(url: URL, init: any = {}) {
  this.url = url;
  this.method = init.method || 'GET';
  this.headers = init.headers || new Headers();
  this.ip = init.ip || '127.0.0.1';
  this.body = init.body;
  this.nextUrl = { pathname: url.pathname, search: url.search };
};
import { middleware } from '../middleware';
import '@testing-library/jest-dom';
import { expect, jest } from '@jest/globals';

describe('WAF Middleware', () => {
  const mockHeaders = new Headers();
  const mockUrl = new URL('http://localhost:3000');

  const createMockRequest = (options: {
    path?: string;
    method?: string;
    userAgent?: string;
    ip?: string;
    query?: string;
    body?: string;
  }) => {
    const url = new URL(options.path || '/', 'http://localhost:3000');
    if (options.query) {
      url.search = options.query;
    }

    const headers = new Headers();
    if (options.userAgent) {
      headers.set('user-agent', options.userAgent);
    }
    if (options.body) {
      headers.set('content-type', 'application/json');
      // Create a Request object with the body
      const init = {
        method: options.method || 'GET',
        headers,
        ip: options.ip || '127.0.0.1',
      };
      if (options.body) {
        Object.assign(init, { body: options.body });
      }
      return new NextRequest(url, init);
    }

    return new NextRequest(url, {
      method: options.method || 'GET',
      headers,
      ip: options.ip || '127.0.0.1',
    });
  };

  describe('Rate Limiting', () => {
    beforeEach(() => {
      jest.useFakeTimers();
      // Clear rate limit data between tests
      (global as any).requestCounts = new Map();
    });

    afterEach(() => {
      jest.useRealTimers();
    });

    it('should allow requests within rate limit', async () => {
      const request = createMockRequest({ ip: '127.0.0.1' });
      const response = await middleware(request);
      expect(response).toBeDefined();
    expect(response!.status).not.toBe(429);
    });

    it('should block excessive requests', async () => {
      const request = createMockRequest({ ip: '127.0.0.1' });
      
      // Make 100 requests within limit
      const responses = await Promise.all(
        Array.from({ length: 100 }, () => middleware(request))
      );
      const lastResponse = responses[99];
      expect(lastResponse).toBeDefined();
      expect(lastResponse!.status).not.toBe(429);

      // 101st request should be blocked
      const blockedResponse = await middleware(request);
      expect(blockedResponse).toBeDefined();
      expect(blockedResponse!.status).toBe(429);
      expect(blockedResponse!.headers.get('Retry-After')).toBe('60');
    });

    it('should reset rate limit after window expires', async () => {
      const request = createMockRequest({ ip: '127.0.0.1' });
      
      // Make 100 requests
      for (let i = 0; i < 100; i++) {
        await middleware(request);
      }

      // Advance time by 1 minute
      jest.advanceTimersByTime(60 * 1000);

      // Next request should succeed
      const response = await middleware(request);
      expect(response).toBeDefined();
    expect(response!.status).not.toBe(429);
    });
  });

  describe('User Agent Blocking', () => {
    it('should block suspicious user agents', async () => {
      const suspiciousAgents = ['sqlmap', 'nikto', 'nmap', 'burpsuite'];
      
      for (const agent of suspiciousAgents) {
        const request = createMockRequest({ userAgent: agent });
        const response = await middleware(request);
        expect(response).toBeDefined();
        expect(response!.status).toBe(403);
      }
    });

    it('should allow legitimate user agents', async () => {
      const request = createMockRequest({
        userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/91.0.4472.124'
      });
      const response = await middleware(request);
      expect(response).toBeDefined();
      expect(response!.status).not.toBe(403);
    });
  });

  describe('Path Protection', () => {
    it('should block access to sensitive paths', async () => {
      const sensitivePaths = [
        '/wp-admin',
        '/wp-login',
        '/admin',
        '/.env',
      ];

      for (const path of sensitivePaths) {
        const request = createMockRequest({ path });
        const response = await middleware(request);
        expect(response).toBeDefined();
        expect(response!.status).toBe(404);
      }
    });

    it('should allow access to legitimate paths', async () => {
      const request = createMockRequest({ path: '/api/auth/login' });
      const response = await middleware(request);
      expect(response).toBeDefined();
      expect(response!.status).not.toBe(404);
    });
  });

  describe('SQL Injection Protection', () => {
    it('should block SQL injection attempts', async () => {
      const sqlInjections = [
        '?id=1 OR 1=1',
        '?query=UNION SELECT password FROM users',
        '?input=1; DROP TABLE users',
      ];

      for (const query of sqlInjections) {
        const request = createMockRequest({ query });
        const response = await middleware(request);
        expect(response).toBeDefined();
        expect(response!.status).toBe(403);
      }
    });

    it('should allow legitimate queries', async () => {
      const request = createMockRequest({ query: '?page=1&limit=10' });
      const response = await middleware(request);
      expect(response).toBeDefined();
      expect(response!.status).not.toBe(403);
    });
  });

  describe('XSS Protection', () => {
    it('should block XSS attempts', async () => {
      const xssPayloads = [
        '<script>alert("xss")</script>',
        'javascript:alert(1)',
        'onload=alert(1)',
      ];

      for (const payload of xssPayloads) {
        const request = createMockRequest({ query: `?input=${payload}` });
        const response = await middleware(request);
        expect(response).toBeDefined();
        expect(response!.status).toBe(403);
      }
    });

    it('should allow legitimate content', async () => {
      const request = createMockRequest({ query: '?input=Hello World' });
      const response = await middleware(request);
      expect(response).toBeDefined();
      expect(response!.status).not.toBe(403);
    });
  });

  describe('Security Headers', () => {
    it('should add security headers to response', async () => {
      const request = createMockRequest({});
      const response = await middleware(request);

      expect(response).toBeDefined();
      const headers = response!.headers;
      expect(headers.get('X-XSS-Protection')).toBe('1; mode=block');
      expect(headers.get('X-Content-Type-Options')).toBe('nosniff');
      expect(headers.get('X-Frame-Options')).toBe('DENY');
    });
  });

  describe('HTTP Method Validation', () => {
    it('should allow valid HTTP methods', async () => {
      const validMethods = ['GET', 'POST', 'PUT', 'DELETE'];

      for (const method of validMethods) {
        const request = createMockRequest({ method });
        const response = await middleware(request);
        expect(response).toBeDefined();
        expect(response!.status).not.toBe(403);
      }
    });

    it('should block invalid HTTP methods', async () => {
      const request = createMockRequest({ method: 'TRACE' });
      const response = await middleware(request);
      expect(response).toBeDefined();
      expect(response!.status).toBe(405);
    });
  });
});
