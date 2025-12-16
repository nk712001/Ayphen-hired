/// <reference types="cypress" />

declare namespace Cypress {
  interface Chainable {
    /**
     * Custom command to login with username and password
     * @example cy.login('username', 'password')
     */
    login(username: string, password: string): Chainable<void>;

    /**
     * Custom command to check WebSocket connection
     * @example cy.checkWebSocket()
     */
    checkWebSocket(): Chainable<void>;

    /**
     * Get element by test id
     * @example cy.getByTestId('my-element')
     */
    getByTestId(testId: string): Chainable<JQuery<HTMLElement>>;

    /**
     * Custom command to check security headers
     * @example cy.checkSecurityHeaders()
     */
    checkSecurityHeaders(): Chainable<void>;
  }
}

// Extend Window interface for WebSocket testing
interface Window {
  WebSocket: typeof WebSocket;
}
