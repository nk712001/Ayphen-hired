/// <reference types="cypress" />
/// <reference types="@testing-library/cypress" />

declare global {
  // Add any custom global types here
}

declare namespace Cypress {
    interface Chainable<Subject = any> {
      // Navigation
      visit(url: string, options?: Partial<VisitOptions>): Chainable<void>;

      // Queries
      get<E extends Node = HTMLElement>(selector: string, options?: Partial<Loggable & Timeoutable & Withinable & Shadow>): Chainable<JQuery<E>>;
      contains(content: string | number | RegExp): Chainable<JQuery<HTMLElement>>;
      contains(selector: string, content: string | number | RegExp): Chainable<JQuery<HTMLElement>>;

      // Actions
      click(options?: Partial<ClickOptions>): Chainable<Subject>;
      type(text: string, options?: Partial<TypeOptions>): Chainable<Subject>;
      submit(options?: Partial<Loggable>): Chainable<Subject>;

      // Window
      window(): Chainable<Window>;

      // Network
      request(url: string): Chainable<Response>;
      request(method: string, url: string, body?: any): Chainable<Response>;
      intercept(url: string | RegExp, response?: any): Chainable<null>;
      intercept(method: string, url: string | RegExp, response?: any): Chainable<null>;
      getCookie(name: string): Chainable<null | Cookie>;

      // Events
      on(eventName: string, callback: Function): Chainable<void>;

      // Custom Commands
      login(username: string, password: string): Chainable<void>;
      getByTestId(testId: string): Chainable<JQuery<HTMLElement>>;
      checkSecurityHeaders(): Chainable<void>;

      // Chain Methods
      then<S = Subject>(callback: (this: Object, currentSubject: Subject) => S): Chainable<S>;
      should(chainers: string | string[], value?: any): Chainable<Subject>;
      and: Chainable<Subject>;
    }

    interface Cookie {
      name: string;
      value: string;
      path: string;
      domain: string;
      secure: boolean;
      httpOnly: boolean;
      expiry: number;
    }

    interface Response {
      headers: { [key: string]: string };
      status: number;
      body: any;
    }

    interface VisitOptions {
      failOnStatusCode?: boolean;
      timeout?: number;
    }

    interface ClickOptions extends Loggable, Timeoutable {
      force?: boolean;
      multiple?: boolean;
    }

    interface TypeOptions extends Loggable, Timeoutable {
      delay?: number;
      force?: boolean;
    }

    interface Loggable {
      log?: boolean;
    }

    interface Timeoutable {
      timeout?: number;
    }

    interface Withinable {
      withinSubject?: JQuery<HTMLElement>;
    }

    interface Shadow {
      includeShadowDom?: boolean;
  
    get(selector: string, options?: Partial<Cypress.Loggable & Cypress.Timeoutable & Cypress.Withinable & Cypress.Shadow>): Chainable<JQuery<HTMLElement>>;
    contains(content: string | number | RegExp): Chainable<JQuery<HTMLElement>>;
    contains(selector: string, content: string | number | RegExp): Chainable<JQuery<HTMLElement>>;
    window(): Chainable<Window>;
    request(url: string): Chainable<Response>;
    request(method: string, url: string, body?: any): Chainable<Response>;
    getCookie(name: string): Chainable<null | Cypress.Cookie>;
    intercept(url: string | RegExp, response?: any): Chainable<null>;
    intercept(method: string, url: string | RegExp, response?: any): Chainable<null>;
    on(eventName: string, callback: Function): Chainable<void>;
    url(): Chainable<string>;
    
    visit(url: string, options?: Partial<Cypress.VisitOptions>): Chainable<void>;
    get(selector: string, options?: Partial<Cypress.Loggable & Cypress.Timeoutable & Cypress.Withinable & Cypress.Shadow>): Chainable<JQuery<HTMLElement>>;
    contains(content: string | number | RegExp): Chainable<JQuery<HTMLElement>>;
    contains(selector: string, content: string | number | RegExp): Chainable<JQuery<HTMLElement>>;
    window(): Chainable<Window>;
    request(url: string): Chainable<Response>;
    request(method: string, url: string, body?: any): Chainable<Response>;
    getCookie(name: string): Chainable<null | Cypress.Cookie>;
    intercept(url: string | RegExp, response?: any): Chainable<null>;
    intercept(method: string, url: string | RegExp, response?: any): Chainable<null>;
    on(eventName: string, callback: Function): Chainable<void>;
    url(): Chainable<string>;
    
    login(username: string, password: string): Chainable<void>;
    checkWebSocket(): Chainable<void>;
    getByTestId(testId: string): Chainable<JQuery<HTMLElement>>;
    checkSecurityHeaders(): Chainable<void>;
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

declare namespace Mocha {
  interface Context {
    test?: Test;
  }
  interface SuiteFunction {
    (description: string, callback: (this: Suite) => void): Suite;
    only(description: string, callback: (this: Suite) => void): Suite;
    skip(description: string, callback: (this: Suite) => void): Suite;
  }
  interface TestFunction {
    (description: string, callback: (this: Context) => void | Promise<void>): Test;
    only(description: string, callback: (this: Context) => void | Promise<void>): Test;
    skip(description: string, callback: (this: Context) => void | Promise<void>): Test;
  }
  interface HookFunction {
    (callback: (this: Context) => void | Promise<void>): void;
    (description: string, callback: (this: Context) => void | Promise<void>): void;
  }
}

declare const describe: Mocha.SuiteFunction;
declare const it: Mocha.TestFunction;
declare const beforeEach: Mocha.HookFunction;
declare const cy: Cypress.Chainable & CyEventEmitter;

declare namespace Cypress {
  interface Chainer<Subject> {
    should(chainers: string | string[], value?: any): Chainable<Subject>;
    and: Chainable<Subject>;
  }

  interface Cookie {
    name: string;
    value: string;
    path: string;
    domain: string;
    secure: boolean;
    httpOnly: boolean;
    expiry: number;
  }

  interface VisitOptions {
    failOnStatusCode: boolean;
  }

  interface Loggable {
    log: boolean;
  }

  interface Timeoutable {
    timeout: number;
  }

  interface Withinable {
    withinSubject: JQuery<HTMLElement>;
  }

  interface Shadow {
    includeShadowDom: boolean;
  }

  interface PluginEvents {
    (action: 'file:preprocessor', callback: Function): void;
  }

  interface PluginConfigOptions {
    [key: string]: any;
  }

  interface Request {
    reply(response: { statusCode: number; body: any }): void;
    body?: any;
  }

  interface Chainable<Subject> {
    should(chainers: string | string[], value?: any): Chainable<Subject>;
    and: Chainable<Subject>;
  }

  interface Request {
    reply(response: { statusCode: number; body: any }): void;
  }
}
declare const expect: Chai.ExpectStatic;
declare const assert: Chai.AssertStatic;

interface CyEventEmitter {
  on: (eventName: string, callback: Function) => void;
  emit: (eventName: string, ...args: any[]) => void;
}

interface Response {
  headers: Record<string, string>;
  status: number;
  body: any;
}
