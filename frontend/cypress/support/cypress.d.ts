/// <reference types="cypress" />
/// <reference types="@testing-library/cypress" />

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
    request<T = any>(url: string): Chainable<Response<T>>;
    request<T = any>(method: string, url: string, body?: any): Chainable<Response<T>>;
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

  interface Response<T = any> {
    headers: { [key: string]: string };
    status: number;
    body: T;
    statusText?: string;
    ok: boolean;
    redirected: boolean;
    type: string;
    url: string;
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
  }
}
