const CarModel = require('../models/carModel');
const carController = require('./carController');

jest.mock('../models/carModel');

function mockRes() {
  const res = {};
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  return res;
}

afterEach(() => jest.clearAllMocks());

describe('carController.getAll', () => {
  it('returns all cars', async () => {
    const cars = [{ id: 1, model: 'Toyota' }];
    CarModel.getAll.mockResolvedValue(cars);

    const req = {};
    const res = mockRes();

    await carController.getAll(req, res);

    expect(res.json).toHaveBeenCalledWith({ success: true, data: cars });
  });

  it('returns 500 on error', async () => {
    CarModel.getAll.mockRejectedValue(new Error('DB error'));

    const res = mockRes();
    await carController.getAll({}, res);

    expect(res.status).toHaveBeenCalledWith(500);
  });
});

describe('carController.create', () => {
  it('returns 400 if model or price is missing', async () => {
    const req = { body: { model: '', price: '' } };
    const res = mockRes();

    await carController.create(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({ success: false })
    );
  });

  it('creates a car and returns 201', async () => {
    const fakeCar = { id: 1, model: 'Toyota', price: 50000 };
    CarModel.create.mockResolvedValue(1);
    CarModel.getById.mockResolvedValue(fakeCar);

    const req = { body: { model: 'Toyota', price: 50000, mileage: '' } };
    const res = mockRes();

    await carController.create(req, res);

    expect(res.status).toHaveBeenCalledWith(201);
    expect(res.json).toHaveBeenCalledWith({ success: true, data: fakeCar });
  });

  it('returns 500 on unexpected error', async () => {
    CarModel.create.mockRejectedValue(new Error('DB down'));

    const req = { body: { model: 'Honda', price: 30000, mileage: '' } };
    const res = mockRes();

    await carController.create(req, res);

    expect(res.status).toHaveBeenCalledWith(500);
  });
});

describe('carController.update', () => {
  it('returns 400 if model or price is missing', async () => {
    const req = { params: { id: '1' }, body: { model: '', price: '' } };
    const res = mockRes();

    await carController.update(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
  });

  it('returns 404 if car not found', async () => {
    CarModel.update.mockResolvedValue(0);

    const req = { params: { id: '99' }, body: { model: 'Honda', price: 30000 } };
    const res = mockRes();

    await carController.update(req, res);

    expect(res.status).toHaveBeenCalledWith(404);
  });

  it('updates and returns the car', async () => {
    const updatedCar = { id: 1, model: 'Honda', price: 30000 };
    CarModel.update.mockResolvedValue(1);
    CarModel.getById.mockResolvedValue(updatedCar);

    const req = { params: { id: '1' }, body: { model: 'Honda', price: 30000 } };
    const res = mockRes();

    await carController.update(req, res);

    expect(res.json).toHaveBeenCalledWith({ success: true, data: updatedCar });
  });
});

describe('carController.updateStatus', () => {
  it('returns 400 if status is missing', async () => {
    const req = { params: { id: '1' }, body: { status: '' } };
    const res = mockRes();

    await carController.updateStatus(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
  });

  it('returns 404 if car not found', async () => {
    CarModel.updateStatus.mockResolvedValue(0);

    const req = { params: { id: '99' }, body: { status: 'sold' } };
    const res = mockRes();

    await carController.updateStatus(req, res);

    expect(res.status).toHaveBeenCalledWith(404);
  });

  it('updates status successfully', async () => {
    CarModel.updateStatus.mockResolvedValue(1);

    const req = { params: { id: '1' }, body: { status: 'sold' } };
    const res = mockRes();

    await carController.updateStatus(req, res);

    expect(res.json).toHaveBeenCalledWith({ success: true, message: 'Status updated' });
  });
});

describe('carController.delete', () => {
  it('returns 404 if car not found', async () => {
    CarModel.delete.mockResolvedValue(0);

    const req = { params: { id: '99' } };
    const res = mockRes();

    await carController.delete(req, res);

    expect(res.status).toHaveBeenCalledWith(404);
  });

  it('deletes successfully', async () => {
    CarModel.delete.mockResolvedValue(1);

    const req = { params: { id: '1' } };
    const res = mockRes();

    await carController.delete(req, res);

    expect(res.json).toHaveBeenCalledWith({ success: true, message: 'Car deleted' });
  });
});
