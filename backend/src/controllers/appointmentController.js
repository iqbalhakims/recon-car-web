const crypto = require('crypto');
const AppointmentModel = require('../models/appointmentModel');
const LeadModel = require('../models/leadModel');
const pool = require('../config/database');
const { sendCustomerConfirmation, sendAppointmentNotification } = require('../services/emailService');

const SLOTS = ['09:00', '10:00', '11:00', '12:00', '13:00', '14:00', '15:00', '16:00', '17:00'];

const appointmentController = {
  async getAll(req, res) {
    try {
      const data = await AppointmentModel.getAll();
      res.json({ success: true, data });
    } catch (err) {
      res.status(500).json({ success: false, message: err.message });
    }
  },

  // Public: returns available hour slots for a given date (?date=YYYY-MM-DD)
  async getAvailableSlots(req, res) {
    try {
      const { date } = req.query;
      if (!date || !/^\d{4}-\d{2}-\d{2}$/.test(date)) {
        return res.status(400).json({ success: false, message: 'date query param required (YYYY-MM-DD)' });
      }
      const booked = await AppointmentModel.getBookedSlots(date);
      const available = SLOTS.filter(s => !booked.includes(s));
      res.json({ success: true, data: { date, available, booked } });
    } catch (err) {
      res.status(500).json({ success: false, message: err.message });
    }
  },

  // Public: customer self-books — finds or creates lead, then books if slot is free
  async publicBook(req, res) {
    try {
      const { name, phone, email, car_id, appointment_date, notes } = req.body;
      if (!name || !phone || !appointment_date) {
        return res.status(400).json({ success: false, message: 'name, phone, and appointment_date are required' });
      }

      // Slot conflict check
      const conflict = await AppointmentModel.hasConflict(appointment_date);
      if (conflict) {
        return res.status(409).json({ success: false, message: 'That time slot is already taken. Please choose another.' });
      }

      // Find existing lead by phone, or create a new one
      const [existing] = await pool.query(
        'SELECT id, profile_token FROM leads WHERE phone = ? LIMIT 1', [phone]
      );

      let lead_id;
      let profile_token;

      if (existing.length > 0) {
        lead_id = existing[0].id;
        profile_token = existing[0].profile_token;
        // Backfill token or email if missing
        if (!profile_token) {
          profile_token = crypto.randomBytes(32).toString('hex');
          await pool.query('UPDATE leads SET profile_token = ?, email = COALESCE(email, ?) WHERE id = ?', [profile_token, email || null, lead_id]);
        } else if (email) {
          await pool.query('UPDATE leads SET email = COALESCE(email, ?) WHERE id = ?', [email, lead_id]);
        }
      } else {
        profile_token = crypto.randomBytes(32).toString('hex');
        lead_id = await LeadModel.create({ name, phone, car_id: car_id || null, next_follow_up_date: null });
        await pool.query('UPDATE leads SET email = ?, profile_token = ? WHERE id = ?', [email || null, profile_token, lead_id]);
      }

      const id = await AppointmentModel.create({ lead_id, appointment_date, notes });
      const appointment = await AppointmentModel.getById(id);

      const profileUrl = `${process.env.FRONTEND_URL || 'http://localhost:3001'}/profile/${profile_token}`;
      res.status(201).json({ success: true, data: { ...appointment, profile_token, profile_url: profileUrl } });

      sendAppointmentNotification({ ...appointment, name, phone }).catch(e => console.error('[Email] staff notify error:', e.message));
      if (email) {
        sendCustomerConfirmation({ ...appointment, name }, email, profileUrl).catch(e => console.error('[Email] customer confirm error:', e.message));
      }
    } catch (err) {
      res.status(500).json({ success: false, message: err.message });
    }
  },


  async getByLead(req, res) {
    try {
      const data = await AppointmentModel.getByLead(req.params.leadId);
      res.json({ success: true, data });
    } catch (err) {
      res.status(500).json({ success: false, message: err.message });
    }
  },

  async create(req, res) {
    try {
      const { lead_id, appointment_date, notes } = req.body;
      if (!lead_id || !appointment_date) {
        return res.status(400).json({ success: false, message: 'lead_id and appointment_date are required' });
      }
      const id = await AppointmentModel.create({ lead_id, appointment_date, notes });
      const appointment = await AppointmentModel.getById(id);
      res.status(201).json({ success: true, data: appointment });
      sendAppointmentNotification(appointment).catch(e => console.error('[Email] appointment error:', e.message));
    } catch (err) {
      res.status(500).json({ success: false, message: err.message });
    }
  },

  async updateStatus(req, res) {
    try {
      const { id } = req.params;
      const { status } = req.body;
      const validStatuses = ['scheduled', 'completed', 'cancelled'];
      if (!validStatuses.includes(status)) {
        return res.status(400).json({ success: false, message: `status must be one of: ${validStatuses.join(', ')}` });
      }
      const affected = await AppointmentModel.updateStatus(id, status);
      if (!affected) return res.status(404).json({ success: false, message: 'Appointment not found' });
      res.json({ success: true, message: 'Appointment updated' });
    } catch (err) {
      res.status(500).json({ success: false, message: err.message });
    }
  },

  async delete(req, res) {
    try {
      const affected = await AppointmentModel.delete(req.params.id);
      if (!affected) return res.status(404).json({ success: false, message: 'Appointment not found' });
      res.json({ success: true, message: 'Appointment deleted' });
    } catch (err) {
      res.status(500).json({ success: false, message: err.message });
    }
  },
};

module.exports = appointmentController;
