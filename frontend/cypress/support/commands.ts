/// <reference path="./cypress-global.d.ts" />
/// <reference types="cypress" />

// Login command implementation
Cypress.Commands.add('login', (username: string, password: string) => {
  cy.visit('/auth/login');
  cy.get('input[name="username"]').type(username);
  cy.get('input[name="password"]').type(password);
  cy.get('form').submit();
  // Wait for successful login
  cy.url().should('not.include', '/auth/login');
});

// WebSocket check command implementation
Cypress.Commands.add('checkWebSocket', () => {
  cy.window().then((win) => {
    const ws = new win.WebSocket('wss://api.ayphen-hire.com/ws');
    ws.onopen = () => {
      ws.close();
      cy.log('WebSocket connection successful');
    };
    ws.onerror = () => {
      cy.log('WebSocket connection failed');
    };
  });
});

// Get element by test ID command implementation
Cypress.Commands.add('getByTestId', (testId: string) => {
  return cy.get(`[data-testid="${testId}"]`);
});
