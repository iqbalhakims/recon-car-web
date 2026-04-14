const fs = require('fs');
const path = require('path');
const DentModel = require('../models/dentModel');

const UPLOADS_DIR = path.join(__dirname, '../../uploads');

const dentController = {
  async getDents(req, res) {
    try {
      const dents = await DentModel.getByCarId(req.params.id);
      res.json({ success: true, data: dents });
    } catch (err) {
      res.status(500).json({ success: false, message: err.message });
    }
  },

  async upload(req, res) {
    try {
      const { note } = req.body;
      const filename = req.file ? req.file.filename : null;
      if (!filename && !note) {
        return res.status(400).json({ success: false, message: 'Photo or note required' });
      }
      const id = await DentModel.create(req.params.id, filename, note);
      res.status(201).json({ success: true, data: { id, filename, note } });
    } catch (err) {
      res.status(500).json({ success: false, message: err.message });
    }
  },

  async delete(req, res) {
    try {
      const filename = await DentModel.delete(req.params.dentId);
      if (filename === undefined) {
        return res.status(404).json({ success: false, message: 'Dent not found' });
      }
      if (filename) {
        const filePath = path.join(UPLOADS_DIR, filename);
        if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
      }
      res.json({ success: true, message: 'Dent deleted' });
    } catch (err) {
      res.status(500).json({ success: false, message: err.message });
    }
  },
};

module.exports = dentController;
