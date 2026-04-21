describe('Admin - Appointments', () => {
  beforeEach(() => {
    cy.loginViaApi();
    cy.visit('/admin');
    cy.contains('nav button', 'Appointments').click();
  });

  it('shows the Appointments page with stat cards and filter tabs', () => {
    cy.contains('Today').should('be.visible');
    cy.contains('Upcoming').should('be.visible');
    cy.contains('Completed').should('be.visible');
    cy.contains('Cancelled').should('be.visible');
    cy.contains('button', 'All').should('be.visible');
    cy.contains('button', 'Scheduled').should('be.visible');
    cy.contains('button', 'Completed').should('be.visible');
    cy.contains('button', 'Cancelled').should('be.visible');
  });

  it('books an appointment via API and sees it in the list', () => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const dateStr = tomorrow.toISOString().slice(0, 10);

    cy.request({
      method: 'POST',
      url: `${Cypress.env('apiUrl')}/api/appointments/book`,
      body: {
        name: 'Cypress Test Customer',
        phone: '0123456789',
        appointment_date: `${dateStr}T10:00:00`,
      },
    }).then((res) => {
      expect(res.body.success).to.be.true;
    });

    cy.reload();
    cy.contains('nav button', 'Appointments').click();
    cy.contains('Cypress Test Customer').should('be.visible');
  });

  it('filters appointments by status tab', () => {
    cy.contains('button', 'Scheduled').click();
    // After clicking Scheduled, only scheduled items should be visible (or empty state)
    cy.get('body').should('not.contain', 'completed').or('contain', 'No appointments found');
  });

  it('marks an appointment as done', () => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const dateStr = tomorrow.toISOString().slice(0, 10);

    cy.request({
      method: 'POST',
      url: `${Cypress.env('apiUrl')}/api/appointments/book`,
      body: {
        name: 'Done Test Customer',
        phone: '0129999999',
        appointment_date: `${dateStr}T11:00:00`,
      },
    });

    cy.reload();
    cy.contains('nav button', 'Appointments').click();
    cy.contains('Done Test Customer')
      .closest('tr')
      .contains('button', 'Done')
      .click();

    cy.contains('Done Test Customer')
      .closest('tr')
      .contains('completed')
      .should('be.visible');
  });

  it('deletes an appointment', () => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const dateStr = tomorrow.toISOString().slice(0, 10);

    cy.request({
      method: 'POST',
      url: `${Cypress.env('apiUrl')}/api/appointments/book`,
      body: {
        name: 'Delete Test Customer',
        phone: '0128888888',
        appointment_date: `${dateStr}T14:00:00`,
      },
    });

    cy.reload();
    cy.contains('nav button', 'Appointments').click();
    cy.contains('Delete Test Customer')
      .closest('tr')
      .contains('button', 'Delete')
      .click();

    cy.contains('Delete Test Customer').should('not.exist');
  });
});
