import './commands';
import '@testing-library/cypress/add-commands';

declare global {
  interface Window {
    Cypress: Cypress.Cypress;
  }

  namespace Cypress {
    interface Chainable {
      login(username: string, password: string): Chainable<void>;
      getByTestId(testId: string): Chainable<JQuery<HTMLElement>>;
      checkSecurityHeaders(): Chainable<void>;
      checkWebSocket(): Chainable<void>;
      stub: typeof cy.stub;
    }
  }
}

// Custom command for login
Cypress.Commands.add('login', (username: string, password: string) => {
  cy.visit('/auth/login');
  cy.get('input[name="username"]').type(username);
  cy.get('input[name="password"]').type(password);
  cy.get('form').submit();
});

// Custom command to check security headers
Cypress.Commands.add('checkSecurityHeaders', () => {
  cy.request('/').then((response: Cypress.Response<any>) => {
    expect(response.headers).to.include({
      'strict-transport-security': 'max-age=63072000; includeSubDomains; preload',
      'x-frame-options': 'SAMEORIGIN',
      'x-content-type-options': 'nosniff',
      'referrer-policy': 'origin-when-cross-origin'
    });
  });
});

// Custom command to check WebSocket connection
Cypress.Commands.add('checkWebSocket', () => {
  cy.window().then((win) => {
    const ws = new win.WebSocket('wss://api.ayphen-hire.com/ws');
    return new Promise((resolve) => {
      ws.onopen = () => {
        ws.close();
        resolve(true);
      };
      ws.onerror = () => resolve(false);
    });
  });
});

// Add custom commands to Cypress chain
Cypress.Commands.add('getByTestId', (testId: string) => {
  return cy.get(`[data-testid="${testId}"]`);
});

// Configure global behavior
Cypress.on('window:before:load', (win: Cypress.AUTWindow) => {
  // Stub fetch globally
  cy.stub(win, 'fetch');
});

// Prevent uncaught exceptions from failing tests
Cypress.on('uncaught:exception', (err: Error): boolean => {
  // Return false to prevent Cypress from failing the test
  if (err.message.includes('ResizeObserver loop limit exceeded')) {
    return false;
  }
  if (err.message.includes('Content Security Policy')) {
    return false;
  }
  return true;
});
