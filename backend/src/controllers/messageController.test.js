const CarModel = require('../models/carModel');
const { generateMessage } = require('../services/messageService');
const messageController = require('./messageController');

jest.mock('../models/carModel');
jest.mock('../services/messageService');

function mockRes() {
  const res = {};
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  return res;
}

afterEach(() => jest.clearAllMocks());

describe('messageController.generate', () => {
  it('returns 400 if car_id is missing', async () => {
    const req = { body: {} };
    const res = mockRes();

    await messageController.generate(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({ success: false })
    );
  });

  it('returns 404 if car is not found', async () => {
    CarModel.getById.mockResolvedValue(null);

    const req = { body: { car_id: 99 } };
    const res = mockRes();

    await messageController.generate(req, res);

    expect(res.status).toHaveBeenCalledWith(404);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({ success: false, message: 'Car not found' })
    );
  });

  it('generates and returns a message', async () => {
    const fakeCar = { id: 1, model: 'Toyota', price: 50000 };
    CarModel.getById.mockResolvedValue(fakeCar);
    generateMessage.mockReturnValue('Check out this Toyota for RM50,000!');

    const req = { body: { car_id: 1 } };
    const res = mockRes();

    await messageController.generate(req, res);

    expect(generateMessage).toHaveBeenCalledWith(fakeCar);
    expect(res.json).toHaveBeenCalledWith({
      success: true,
      message: 'Check out this Toyota for RM50,000!',
    });
  });

  it('returns 500 on unexpected error', async () => {
    CarModel.getById.mockRejectedValue(new Error('DB down'));

    const req = { body: { car_id: 1 } };
    const res = mockRes();

    await messageController.generate(req, res);

    expect(res.status).toHaveBeenCalledWith(500);
  });
});
