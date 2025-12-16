// cypress/e2e/test_taking.cy.js
// End-to-end test for test-taking flow

describe('Test-Taking Flow', () => {
  beforeEach(() => {
    cy.login('testuser', 'password123'); // Assume cy.login is a custom command
    cy.visit('/test/start');
  });

  it('should display multiple choice questions and allow selection', () => {
    cy.get('[data-cy=question-mc]').should('exist');
    cy.get('[data-cy=option]').first().click().should('have.class', 'selected');
  });

  it('should allow short answer input', () => {
    cy.get('[data-cy=question-short]').should('exist');
    cy.get('textarea[data-cy=short-answer]').type('Short answer response');
  });

  it('should allow essay input and show word count', () => {
    cy.get('[data-cy=question-essay]').should('exist');
    cy.get('textarea[data-cy=essay-answer]').type('This is a longer essay answer for testing.');
    cy.get('[data-cy=word-count]').should('be.visible');
  });

  it('should allow file upload', () => {
    cy.get('[data-cy=question-file]').should('exist');
    cy.get('input[type=file][data-cy=file-upload]').attachFile('testfile.pdf');
    cy.get('[data-cy=file-name]').should('contain', 'testfile.pdf');
  });

  it('should display and update countdown timer', () => {
    cy.get('[data-cy=countdown-timer]').should('be.visible');
  });

  it('should submit the test and show confirmation', () => {
    cy.get('button[type=submit][data-cy=submit-test]').click();
    cy.get('[data-cy=submit-confirmation]').should('be.visible');
  });
});
