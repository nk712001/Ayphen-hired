/// <reference types="cypress" />
/// <reference types="@testing-library/cypress" />
/// <reference types="cypress-wait-until" />
/// <reference types="mocha" />
/// <reference types="chai" />
/// <reference types="sinon" />
/// <reference types="sinon-chai" />

interface CyEventEmitter {
  on: (eventName: string, callback: Function) => void;
  emit: (eventName: string, ...args: any[]) => void;
}

declare global {
  namespace Mocha {
    interface Context {
      test?: Test;
    }
  }

  interface Window {
    Cypress: Cypress.Cypress;
  }

  const cy: Cypress.cy & CyEventEmitter;
  const expect: Chai.ExpectStatic;
  const assert: Chai.AssertStatic;
  const should: Chai.Should;
}

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
    stub: typeof cy.stub;
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
      containsChainables: boolean;
    }

    interface ChainableAssertion extends Assertion {
      and: Assertion;
      but: Assertion;
      with: Assertion;
    }

    interface Include {
      (value: string): Assertion;
      (value: number): Assertion;
      (value: object): Assertion;
      keys: (...keys: string[]) => Assertion;
      members: (set: any[]) => Assertion;
      deep: Include;
      nested: Include;
      own: Include;
    }

    interface TypeComparison {
      (type: string): void;
      instanceof: (constructor: Function) => void;
      instanceOf: (constructor: Function) => void;
    }
  }
}
