const nodemailer = require('nodemailer');

const NOTIFY_TO = process.env.NOTIFY_EMAIL || 'recondalorstar@gmail.com';

function createTransporter() {
  return nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  });
}

async function sendCustomerConfirmation(appointment, email, profileUrl) {
  if (!process.env.SMTP_USER || !process.env.SMTP_PASS) return;
  if (!email) return;

  const date = new Date(appointment.appointment_date).toLocaleString('en-MY', {
    dateStyle: 'full', timeStyle: 'short', timeZone: 'Asia/Kuala_Lumpur',
  });

  const html = `
    <div style="font-family:sans-serif;max-width:520px;margin:0 auto">
      <div style="background:#1e2d3d;padding:24px 28px;border-radius:12px 12px 0 0">
        <h2 style="color:#c9a84c;margin:0;font-size:1.3rem">Appointment Confirmed!</h2>
        <p style="color:rgba(255,255,255,0.7);margin:6px 0 0;font-size:0.9rem">Thank you for booking with us</p>
      </div>
      <div style="background:#fff;padding:24px 28px;border:1px solid #e5e7eb;border-top:none">
        <p style="color:#333;margin:0 0 16px">Hi <strong>${appointment.lead_name || appointment.name}</strong>,</p>
        <p style="color:#555;margin:0 0 20px">Your appointment is confirmed. Here are your details:</p>
        <table cellpadding="10" style="width:100%;border-collapse:collapse;background:#f7f8fa;border-radius:8px;overflow:hidden">
          <tr><td style="color:#777;font-size:0.85rem">Date & Time</td><td style="font-weight:700;color:#1e2d3d">${date}</td></tr>
          ${appointment.car_model ? `<tr><td style="color:#777;font-size:0.85rem">Car</td><td style="font-weight:700;color:#1e2d3d">${appointment.car_model}</td></tr>` : ''}
          <tr><td style="color:#777;font-size:0.85rem">Status</td><td style="font-weight:700;color:#22c55e">Scheduled</td></tr>
        </table>
        <div style="margin-top:24px;text-align:center">
          <a href="${profileUrl}" style="background:#1e2d3d;color:white;padding:12px 28px;border-radius:8px;text-decoration:none;font-weight:700;display:inline-block">
            View My Profile & Appointments
          </a>
        </div>
        <p style="color:#aaa;font-size:0.78rem;margin:20px 0 0;text-align:center">We'll contact you to confirm. Save the link above to track your appointment.</p>
      </div>
    </div>
  `;

  await createTransporter().sendMail({
    from: `"Car Sales CRM" <${process.env.SMTP_USER}>`,
    to: email,
    subject: `Your Appointment is Confirmed — ${date}`,
    html,
  });

  console.log(`[Email] Customer confirmation sent to ${email}`);
}

async function sendAppointmentNotification(appointment) {
  if (!process.env.SMTP_USER || !process.env.SMTP_PASS) {
    console.warn('[Email] SMTP_USER or SMTP_PASS not set — skipping appointment email');
    return;
  }

  const date = new Date(appointment.appointment_date).toLocaleString('en-MY', {
    dateStyle: 'full',
    timeStyle: 'short',
    timeZone: 'Asia/Kuala_Lumpur',
  });

  const html = `
    <h2>New Appointment Booked</h2>
    <table cellpadding="8" style="border-collapse:collapse;font-family:sans-serif">
      <tr><td><strong>Customer</strong></td><td>${appointment.lead_name || appointment.name || 'N/A'}</td></tr>
      <tr><td><strong>Phone</strong></td><td>${appointment.lead_phone || appointment.phone || 'N/A'}</td></tr>
      <tr><td><strong>Date & Time</strong></td><td>${date}</td></tr>
      <tr><td><strong>Car</strong></td><td>${appointment.car_model || 'Not specified'}</td></tr>
      <tr><td><strong>Notes</strong></td><td>${appointment.notes || '—'}</td></tr>
      <tr><td><strong>Status</strong></td><td>${appointment.status || 'scheduled'}</td></tr>
    </table>
  `;

  await createTransporter().sendMail({
    from: `"Car Sales CRM" <${process.env.SMTP_USER}>`,
    to: NOTIFY_TO,
    subject: `New Appointment — ${appointment.lead_name || appointment.name || 'Customer'} on ${date}`,
    html,
  });

  console.log(`[Email] Appointment notification sent to ${NOTIFY_TO}`);
}

async function sendMessageNotification(car, message) {
  if (!process.env.SMTP_USER || !process.env.SMTP_PASS) {
    console.warn('[Email] SMTP_USER or SMTP_PASS not set — skipping message email');
    return;
  }

  const html = `
    <h2>New Car Message Generated</h2>
    <table cellpadding="8" style="border-collapse:collapse;font-family:sans-serif">
      <tr><td><strong>Car Model</strong></td><td>${car.model}</td></tr>
      <tr><td><strong>Ref No</strong></td><td>${car.ref_no || `REF-${String(car.id).padStart(4, '0')}`}</td></tr>
      <tr><td><strong>Price</strong></td><td>RM${car.price?.toLocaleString()}</td></tr>
      <tr><td><strong>Mileage</strong></td><td>${car.mileage?.toLocaleString()} km</td></tr>
    </table>
    <h3>Message Content</h3>
    <pre style="background:#f5f5f5;padding:16px;border-radius:6px;white-space:pre-wrap">${message}</pre>
  `;

  await createTransporter().sendMail({
    from: `"Car Sales CRM" <${process.env.SMTP_USER}>`,
    to: NOTIFY_TO,
    subject: `Car Message Generated — ${car.model}`,
    html,
  });

  console.log(`[Email] Message notification sent to ${NOTIFY_TO}`);
}

module.exports = { sendCustomerConfirmation, sendAppointmentNotification, sendMessageNotification };
