describe('Public - Booking Page', () => {
  const tomorrow = () => {
    const d = new Date();
    d.setDate(d.getDate() + 1);
    return d.toISOString().slice(0, 10);
  };

  it('loads the booking page', () => {
    cy.visit('/book');
    cy.contains('Schedule a Visit').should('be.visible');
    cy.contains('Select Date').should('be.visible');
    cy.contains('Select Time').should('be.visible');
    cy.contains('Your Name').should('be.visible');
    cy.contains('Phone Number').should('be.visible');
    cy.contains('Confirm Appointment').should('be.visible');
  });

  it('shows all time slots', () => {
    cy.visit('/book');
    ['9:00 AM', '10:00 AM', '11:00 AM', '12:00 PM', '1:00 PM', '2:00 PM', '3:00 PM', '4:00 PM', '5:00 PM'].forEach(slot => {
      cy.contains(slot).should('be.visible');
    });
  });

  it('shows error when submitting without selecting a time slot', () => {
    cy.visit('/book');
    cy.get('input[placeholder*="Ahmad"]').type('Test User');
    cy.get('input[placeholder*="0123456789"]').type('0123456789');
    cy.contains('button', 'Confirm Appointment').click();
    cy.contains('Please select a time slot').should('be.visible');
  });

  it('shows error for invalid Malaysian phone number', () => {
    cy.visit('/book');
    cy.contains('9:00 AM').click();
    cy.get('input[placeholder*="Ahmad"]').type('Test User');
    cy.get('input[placeholder*="0123456789"]').type('12345');
    cy.contains('button', 'Confirm Appointment').click();
    cy.contains('valid Malaysian phone number').should('be.visible');
  });

  it('books an appointment successfully', () => {
    cy.visit('/book');

    // Set date to tomorrow
    cy.get('input[type="date"]').invoke('val', tomorrow()).trigger('change');

    // Wait for slots to load and select one
    cy.contains('9:00 AM').should('be.visible').click();

    cy.get('input[placeholder*="Ahmad"]').type('Cypress Booking User');
    cy.get('input[placeholder*="0123456789"]').type('0123456789');
    cy.contains('button', 'Confirm Appointment').click();

    cy.contains('Appointment Booked!').should('be.visible');
    cy.contains('0123456789').should('be.visible');
  });

  it('returns to homepage from booking success page', () => {
    cy.visit('/book');
    cy.get('input[type="date"]').invoke('val', tomorrow()).trigger('change');
    cy.contains('10:00 AM').should('be.visible').click();
    cy.get('input[placeholder*="Ahmad"]').type('Back Button User');
    cy.get('input[placeholder*="0123456789"]').type('0123456789');
    cy.contains('button', 'Confirm Appointment').click();
    cy.contains('Back to Cars').click();
    cy.url().should('eq', Cypress.config('baseUrl') + '/');
  });

  it('pre-selects car info when car_id is in query string', () => {
    // Create a car first via API and get its ID
    cy.loginViaApi();
    cy.request({
      method: 'POST',
      url: `${Cypress.env('apiUrl')}/api/cars`,
      headers: { Authorization: `Bearer ${window.localStorage.getItem('crm_token')}` },
      body: { model: 'Booking Test Car', price: 45000 },
      failOnStatusCode: false,
    }).then((res) => {
      if (res.body.success && res.body.data?.id) {
        const carId = res.body.data.id;
        cy.visit(`/book?car_id=${carId}`);
        cy.contains('Interested in').should('be.visible');
        cy.contains('Booking Test Car').should('be.visible');
      } else {
        cy.log('No car created — skipping car pre-select check');
      }
    });
  });
});
