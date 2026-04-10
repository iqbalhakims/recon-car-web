const fs = require('fs');
const path = require('path');
const VideoModel = require('../models/videoModel');

const UPLOADS_DIR = path.join(__dirname, '../../uploads');

const videoController = {
  async getVideos(req, res) {
    try {
      const videos = await VideoModel.getByCarId(req.params.id);
      res.json({ success: true, data: videos });
    } catch (err) {
      res.status(500).json({ success: false, message: err.message });
    }
  },

  async upload(req, res) {
    try {
      if (!req.file) {
        return res.status(400).json({ success: false, message: 'No file uploaded' });
      }
      const id = await VideoModel.create(req.params.id, req.file.filename);
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
      const filename = await VideoModel.delete(req.params.videoId);
      if (!filename) {
        return res.status(404).json({ success: false, message: 'Video not found' });
      }
      const filePath = path.join(UPLOADS_DIR, filename);
      if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
      res.json({ success: true, message: 'Video deleted' });
    } catch (err) {
      res.status(500).json({ success: false, message: err.message });
    }
  },
};

module.exports = videoController;
