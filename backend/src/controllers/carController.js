const CarModel = require('../models/carModel');

const carController = {
  async getAll(req, res) {
    try {
      const cars = await CarModel.getAll();
      res.json({ success: true, data: cars });
    } catch (err) {
      res.status(500).json({ success: false, message: err.message });
    }
  },

  async create(req, res) {
    try {
      const { model, price, mileage, condition } = req.body;
      if (!model || !price) {
        return res.status(400).json({ success: false, message: 'model and price are required' });
      }
      const id = await CarModel.create({ model, price, mileage, condition });
      const car = await CarModel.getById(id);
      res.status(201).json({ success: true, data: car });
    } catch (err) {
      res.status(500).json({ success: false, message: err.message });
    }
  },

  async updateStatus(req, res) {
    try {
      const { id } = req.params;
      const { status } = req.body;
      if (!status) {
        return res.status(400).json({ success: false, message: 'status is required' });
      }
      const affected = await CarModel.updateStatus(id, status);
      if (!affected) {
        return res.status(404).json({ success: false, message: 'Car not found' });
      }
      res.json({ success: true, message: 'Status updated' });
    } catch (err) {
      res.status(500).json({ success: false, message: err.message });
    }
  },
};

module.exports = carController;
