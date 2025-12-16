// cypress/e2e/auth_login.cy.js
// End-to-end test for user login flow

describe('User Login Flow', () => {
  it('should allow a user to log in and see the dashboard', () => {
    cy.visit('/auth/login');
    cy.get('input[name="username"], input[type="email"]').type('testuser');
    cy.get('input[name="password"]').type('password123');
    cy.get('button[type="submit"]').click();
    cy.url().should('include', '/dashboard');
    cy.get('h1').should('contain', 'Dashboard');
  });

  it('should show an error for invalid credentials', () => {
    cy.visit('/auth/login');
    cy.get('input[name="username"], input[type="email"]').type('invaliduser');
    cy.get('input[name="password"]').type('wrongpassword');
    cy.get('button[type="submit"]').click();
    cy.get('.error, [role="alert"]').should('be.visible');
  });
});
