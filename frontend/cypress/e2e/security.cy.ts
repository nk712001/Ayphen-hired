/// <reference path="../support/cypress-global.d.ts" />
/// <reference types="cypress" />
/// <reference types="@testing-library/cypress" />

// Import test utilities
import '@testing-library/cypress/add-commands';
import 'cypress-wait-until';
import 'cypress-websocket-testing';

// Import Cypress commands
import '../support/commands';

describe('Security E2E Tests', () => {
  describe('Authentication Flow', () => {
    beforeEach(() => {
      cy.visit('/auth/login');
    });

    it('should enforce secure login process', () => {
      // Test XSS prevention
      cy.get('input[name="username"]').type('<script>alert("xss")</script>');
      cy.get('input[name="password"]').type('password123');
      cy.get('form').submit();
      
      // Verify XSS content is escaped
      cy.get('input[name="username"]').should('have.value', '<script>alert("xss")</script>');
      cy.contains('script').should('not.exist');
    });

    it('should handle invalid login attempts', () => {
      // Test rate limiting
      for (let i = 0; i < 5; i++) {
        cy.get('input[name="username"]').type('invalid');
        cy.get('input[name="password"]').type('invalid');
        cy.get('form').submit();
      }
      
      // Should be rate limited
      cy.contains('Too many attempts').should('be.visible');
      cy.get('form').should('be.disabled');
    });

    it('should maintain session security', () => {
      // Login successfully
      cy.get('input[name="username"]').type('testuser');
      cy.get('input[name="password"]').type('password123');
      cy.get('form').submit();

      // Verify secure session handling
      cy.getCookie('session').then((cookie) => {
        expect(cookie).to.have.property('httpOnly', true);
      });
      cy.getCookie('csrf').then((cookie) => {
        expect(cookie).to.have.property('secure', true);
        expect(cookie).to.have.property('sameSite', 'strict');
      });
    });
  });

  describe('Proctoring Security', () => {
    beforeEach(() => {
      cy.login('testuser', 'password123');
      cy.visit('/test/123');
    });

    it('should handle secure media permissions', () => {
      // Accept proctoring consent
      cy.get('[data-testid="proctor-consent"]').click();

      // Verify media permissions request
      cy.on('window:before:load', (win: Cypress.Window) => {
        cy.stub(win.navigator.mediaDevices, 'getUserMedia').resolves({
          getTracks: () => [{
            kind: 'video',
            enabled: true,
            stop: () => {}
          }]
        });
      });

      // Should request both video and audio
      cy.get('[data-testid="start-test"]').click();
      cy.window().then((win: Cypress.Window) => {
        expect(win.navigator.mediaDevices.getUserMedia).to.be.calledWith({
          video: true,
          audio: true
        });
      });
    });

    it('should establish secure WebSocket connection', () => {
      cy.get('[data-testid="proctor-consent"]').click();
      cy.get('[data-testid="start-test"]').click();

      // Verify WSS connection
      cy.window().then((win: Cypress.Window) => {
        const ws = win.WebSocket.prototype;
        expect(ws.url).to.include('wss://');
      });
    });

    it('should handle proctoring violations', () => {
      cy.get('[data-testid="proctor-consent"]').click();
      cy.get('[data-testid="start-test"]').click();

      // Simulate violation
      cy.window().then((win: Cypress.Window) => {
        win.postMessage({
          type: 'PROCTOR_VIOLATION',
          violation: {
            type: 'multiple_faces',
            severity: 'high'
          }
        }, '*');
      });

      // Verify violation handling
      cy.get('[data-testid="violation-alert"]').should('be.visible');
      cy.get('[data-testid="violation-type"]').should('contain', 'multiple_faces');
    });
  });

  describe('RBAC Implementation', () => {
    it('should enforce role-based access', () => {
      // Test student role
      cy.login('student', 'password123');
      cy.visit('/admin');
      cy.url().should('not.include', '/admin');
      cy.get('[data-testid="unauthorized"]').should('be.visible');

      // Test admin role
      cy.login('admin', 'password123');
      cy.visit('/admin');
      cy.url().should('include', '/admin');
      cy.get('[data-testid="admin-panel"]').should('be.visible');
    });

    it('should handle role-specific UI elements', () => {
      // Test proctor role
      cy.login('proctor', 'password123');
      cy.visit('/test/123');
      
      // Should see proctor controls
      cy.get('[data-testid="proctor-controls"]').should('be.visible');
      
      // Should not see test editing controls
      cy.get('[data-testid="edit-test"]').should('not.exist');
    });
  });

  describe('Network Security', () => {
    it('should enforce secure headers', () => {
      cy.request('GET', '/').then((response: Cypress.Response<any>) => {
        expect(response.headers).to.include({
          'strict-transport-security': 'max-age=63072000; includeSubDomains; preload',
          'x-frame-options': 'SAMEORIGIN',
          'x-content-type-options': 'nosniff',
          'referrer-policy': 'origin-when-cross-origin'
        });
      });
    });

    it('should handle CSP violations', () => {
      cy.visit('/test/123');
      
      // Attempt inline script execution
      cy.window().then((win: Cypress.Window) => {
        const script = win.document.createElement('script');
        script.innerHTML = 'alert("test")';
        win.document.body.appendChild(script);
      });

      // Should be blocked by CSP
      cy.on('uncaught:exception', (err: Error) => {
        expect(err.message).to.include('Content Security Policy');
        return false;
      });
    });
  });

  describe('Error Handling', () => {
    it('should handle network errors gracefully', () => {
      // Simulate offline state
      cy.intercept('*', (req: Cypress.Request) => {
        req.reply({
          statusCode: 0,
          body: 'Network Error'
        });
      });

      cy.visit('/test/123', { failOnStatusCode: false });
      cy.get('[data-testid="network-error"]').should('be.visible');
    });

    it('should handle API errors securely', () => {
      cy.intercept('POST', '/api/auth/login', (req: Cypress.Request) => {
        req.reply({
          statusCode: 500,
          body: { message: 'Internal Server Error' }
        });
      });

      cy.visit('/test/123');
      cy.get('[data-testid="error-boundary"]').should('be.visible');
      // Ensure no sensitive info is leaked
      cy.get('[data-testid="error-boundary"]').should('not.contain', 'stack');
    });
  });
});
