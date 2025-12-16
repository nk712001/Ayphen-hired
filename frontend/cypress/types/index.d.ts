/// <reference types="cypress" />
/// <reference types="@testing-library/cypress" />
/// <reference types="cypress-wait-until" />
/// <reference types="mocha" />
/// <reference types="chai" />

declare namespace Cypress {
  interface Chainable<Subject = any> {
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
     * Custom command to get element by test id
     * @example cy.getByTestId('my-element')
     */
    getByTestId(testId: string): Chainable<JQuery<HTMLElement>>;

    /**
     * Custom command to check security headers
     * @example cy.checkSecurityHeaders()
     */
    checkSecurityHeaders(): Chainable<void>;

    /**
     * Stub function type
     */
    stub: typeof Cypress['cy']['stub'];
  }

  interface Window {
    WebSocket: typeof WebSocket;
    navigator: Navigator & {
      mediaDevices: {
        getUserMedia: (constraints: MediaStreamConstraints) => Promise<MediaStream>;
      };
    };
    document: Document;
    postMessage: typeof postMessage;
    fetch: typeof fetch;
  }
}

declare global {
  namespace Chai {
    interface Assertion {
      (value: any): Assertion;
    }
  }
}
