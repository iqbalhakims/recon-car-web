describe('Admin - Users Management', () => {
  beforeEach(() => {
    cy.loginViaApi();
    cy.visit('/admin');
    cy.contains('nav button', 'Users').click();
  });

  it('shows the Users page with Create Staff User form', () => {
    cy.contains('Create Staff User').should('be.visible');
    cy.contains('Users (').should('be.visible');
    cy.get('input[placeholder="Username"]').should('be.visible');
    cy.get('input[placeholder*="Password"]').should('be.visible');
  });

  it('shows the admin user as non-editable', () => {
    cy.contains('ADMIN').should('be.visible');
    cy.contains('Full access · cannot be modified').should('be.visible');
  });

  it('creates a new staff user', () => {
    const username = `staff_${Date.now()}`;

    cy.get('input[placeholder="Username"]').type(username);
    cy.get('input[placeholder*="Password"]').type('password123');
    cy.contains('button', 'Create User').click();

    cy.contains(`User "${username}" created.`).should('be.visible');
    cy.contains(username).should('be.visible');
    cy.contains('STAFF').should('be.visible');
  });

  it('shows error when creating user with existing username', () => {
    cy.get('input[placeholder="Username"]').type('admin');
    cy.get('input[placeholder*="Password"]').type('password123');
    cy.contains('button', 'Create User').click();

    cy.get('.alert-error').should('be.visible');
  });

  it('toggles permissions on a staff user and saves', () => {
    const username = `perm_test_${Date.now()}`;

    cy.get('input[placeholder="Username"]').type(username);
    cy.get('input[placeholder*="Password"]').type('password123');
    cy.contains('button', 'Create User').click();
    cy.contains(`User "${username}" created.`).should('be.visible');

    // Toggle Create permission on the newly created user
    cy.contains(username)
      .closest('[style*="border"]')
      .contains('button', /Create/)
      .click();

    // Save button should appear (unsaved changes)
    cy.contains(username)
      .closest('[style*="border"]')
      .contains('button', /Save/)
      .click();

    cy.contains(username)
      .closest('[style*="border"]')
      .contains('Unsaved changes')
      .should('not.exist');
  });

  it('deletes a staff user', () => {
    const username = `delete_me_${Date.now()}`;

    cy.get('input[placeholder="Username"]').type(username);
    cy.get('input[placeholder*="Password"]').type('password123');
    cy.contains('button', 'Create User').click();
    cy.contains(`User "${username}" created.`).should('be.visible');

    cy.contains(username)
      .closest('[style*="border"]')
      .contains('button', /Delete/)
      .click();

    // Confirm the browser dialog
    cy.on('window:confirm', () => true);

    cy.contains(username).should('not.exist');
  });
});
