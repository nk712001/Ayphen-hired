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
     * Custom command to type text into an input field
     * @example cy.get('input').typeText('Hello')
     */
    typeText(text: string): Chainable<Element>;

    /**
     * Custom command to click an element
     * @example cy.get('button').clickElement()
     */
    clickElement(): Chainable<Element>;

    /**
     * Custom command to submit a form
     * @example cy.get('form').submitForm()
     */
    submitForm(): Chainable<Element>;

    /**
     * Custom command to check if an element contains text
     * @example cy.get('div').containsText('Hello')
     */
    containsText(text: string): Chainable<Element>;

    /**
     * Custom command to wait for an element to be visible
     * @example cy.get('div').waitForVisible()
     */
    waitForVisible(): Chainable<Element>;
  }
}
