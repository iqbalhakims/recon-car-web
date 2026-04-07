const fs = require('fs');
const path = require('path');
const ImageModel = require('../models/imageModel');

const UPLOADS_DIR = path.join(__dirname, '../../uploads');

const imageController = {
  async getImages(req, res) {
    try {
      const images = await ImageModel.getByCarId(req.params.id);
      res.json({ success: true, data: images });
    } catch (err) {
      res.status(500).json({ success: false, message: err.message });
    }
  },

  async upload(req, res) {
    try {
      if (!req.file) {
        return res.status(400).json({ success: false, message: 'No file uploaded' });
      }
      const id = await ImageModel.create(req.params.id, req.file.filename);
      res.status(201).json({
        success: true,
        data: { id, filename: req.file.filename, url: `/uploads/${req.file.filename}` },
      });
    } catch (err) {
      res.status(500).json({ success: false, message: err.message });
    }
  },

  async delete(req, res) {
    try {
      const filename = await ImageModel.delete(req.params.imageId);
      if (!filename) {
        return res.status(404).json({ success: false, message: 'Image not found' });
      }
      const filePath = path.join(UPLOADS_DIR, filename);
      if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
      res.json({ success: true, message: 'Image deleted' });
    } catch (err) {
      res.status(500).json({ success: false, message: err.message });
    }
  },
};

module.exports = imageController;
