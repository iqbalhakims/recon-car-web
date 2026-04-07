const CarModel = require('../models/carModel');
const { generateMessage } = require('../services/messageService');

const messageController = {
  async generate(req, res) {
    try {
      const { car_id } = req.body;
      if (!car_id) {
        return res.status(400).json({ success: false, message: 'car_id is required' });
      }
      const car = await CarModel.getById(car_id);
      if (!car) {
        return res.status(404).json({ success: false, message: 'Car not found' });
      }
      const message = generateMessage(car);
      res.json({ success: true, message });
    } catch (err) {
      res.status(500).json({ success: false, message: err.message });
    }
  },
};

module.exports = messageController;
