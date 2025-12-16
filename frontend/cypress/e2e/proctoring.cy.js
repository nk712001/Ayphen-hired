// cypress/e2e/proctoring.cy.js
// End-to-end test for proctoring and violation reporting flows

describe('Proctoring & Violation Reporting', () => {
  beforeEach(() => {
    cy.login('proctoruser', 'password123'); // Assume cy.login is a custom command
    cy.visit('/proctor/session/test-session');
  });

  it('should display live video and audio streams', () => {
    cy.get('[data-cy=proctor-video-stream]').should('be.visible');
    cy.get('[data-cy=proctor-audio-stream]').should('be.visible');
  });

  it('should receive and display violation alerts', () => {
    // Simulate backend sending a violation alert via WebSocket
    cy.window().then((win) => {
      win.dispatchEvent(new CustomEvent('proctor-violation', {
        detail: {
          type: 'multiple_faces',
          severity: 'high',
          message: 'Multiple faces detected',
        }
      }));
    });
    cy.get('[data-cy=violation-alert]').should('be.visible').and('contain', 'Multiple faces detected');
  });

  it('should show metrics and session info', () => {
    cy.get('[data-cy=proctor-metrics]').should('be.visible');
    cy.get('[data-cy=session-info]').should('be.visible');
  });

  it('should allow proctor to flag a manual violation', () => {
    cy.get('[data-cy=flag-violation]').click();
    cy.get('[data-cy=violation-modal]').should('be.visible');
    cy.get('[data-cy=violation-reason]').type('Student looking away repeatedly');
    cy.get('[data-cy=submit-violation]').click();
    cy.get('[data-cy=violation-alert]').should('be.visible').and('contain', 'Student looking away repeatedly');
  });

  it('should handle session end and cleanup', () => {
    cy.get('[data-cy=end-session]').click();
    cy.url().should('include', '/proctor/dashboard');
    cy.get('[data-cy=session-ended]').should('be.visible');
  });
});
