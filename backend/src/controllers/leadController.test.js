const LeadModel = require('../models/leadModel');
const leadController = require('./leadController');

jest.mock('../models/leadModel');

function mockRes() {
  const res = {};
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  return res;
}

afterEach(() => jest.clearAllMocks());

describe('leadController.getAll', () => {
  it('returns all leads', async () => {
    const leads = [{ id: 1, name: 'Ali', phone: '0123456789' }];
    LeadModel.getAll.mockResolvedValue(leads);

    const res = mockRes();
    await leadController.getAll({}, res);

    expect(res.json).toHaveBeenCalledWith({ success: true, data: leads });
  });

  it('returns 500 on error', async () => {
    LeadModel.getAll.mockRejectedValue(new Error('DB error'));

    const res = mockRes();
    await leadController.getAll({}, res);

    expect(res.status).toHaveBeenCalledWith(500);
  });
});

describe('leadController.create', () => {
  it('returns 400 if name or phone is missing', async () => {
    const req = { body: { name: '', phone: '' } };
    const res = mockRes();

    await leadController.create(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({ success: false })
    );
  });

  it('creates a lead and returns 201', async () => {
    const fakeLead = { id: 1, name: 'Ali', phone: '0123456789' };
    LeadModel.create.mockResolvedValue(1);
    LeadModel.getById.mockResolvedValue(fakeLead);

    const req = { body: { name: 'Ali', phone: '0123456789', car_id: 2 } };
    const res = mockRes();

    await leadController.create(req, res);

    expect(res.status).toHaveBeenCalledWith(201);
    expect(res.json).toHaveBeenCalledWith({ success: true, data: fakeLead });
  });

  it('returns 500 on unexpected error', async () => {
    LeadModel.create.mockRejectedValue(new Error('DB down'));

    const req = { body: { name: 'Ali', phone: '0123456789' } };
    const res = mockRes();

    await leadController.create(req, res);

    expect(res.status).toHaveBeenCalledWith(500);
  });
});

describe('leadController.update', () => {
  it('returns 404 if lead not found', async () => {
    LeadModel.update.mockResolvedValue(0);

    const req = { params: { id: '99' }, body: { status: 'closed' } };
    const res = mockRes();

    await leadController.update(req, res);

    expect(res.status).toHaveBeenCalledWith(404);
  });

  it('updates lead successfully', async () => {
    LeadModel.update.mockResolvedValue(1);

    const req = { params: { id: '1' }, body: { status: 'closed' } };
    const res = mockRes();

    await leadController.update(req, res);

    expect(res.json).toHaveBeenCalledWith({ success: true, message: 'Lead updated' });
  });

  it('returns 500 on error', async () => {
    LeadModel.update.mockRejectedValue(new Error('DB error'));

    const req = { params: { id: '1' }, body: { status: 'closed' } };
    const res = mockRes();

    await leadController.update(req, res);

    expect(res.status).toHaveBeenCalledWith(500);
  });
});
