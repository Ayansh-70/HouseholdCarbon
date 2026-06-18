const request = require('supertest');
const app = require('../server');

// Mock the Gemini service
jest.mock('../services/gemini.service', () => ({
  getPersonalizedInsights: jest.fn()
}));

// Mock the rate limiter so tests don't fail with 429 Too Many Requests
jest.mock('express-rate-limit', () => () => (req, res, next) => next());

const { getPersonalizedInsights } = require('../services/gemini.service');

describe('POST /api/footprint', () => {
  
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should return footprint calculation and mocked insights on valid input', async () => {
    getPersonalizedInsights.mockResolvedValue({
      insights: ["Mocked tip 1", "Mocked tip 2", "Mocked tip 3"],
      source: 'ai'
    });

    const payload = {
      electricity: 100,
      naturalGas: 50,
      water: 1000,
      householdSize: 2,
      heatingFuel: 'gas'
    };

    const res = await request(app).post('/api/footprint').send(payload);

    expect(res.statusCode).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.calculation.totalCO2e).toBe(308);
    expect(res.body.data.insights).toEqual(["Mocked tip 1", "Mocked tip 2", "Mocked tip 3"]);
    expect(res.body.data.insightsSource).toBe('ai');
    expect(getPersonalizedInsights).toHaveBeenCalledTimes(1);
  });

  it('should return fallback insights when Gemini fails', async () => {
    getPersonalizedInsights.mockResolvedValue({
      insights: ["Fallback tip 1"],
      source: 'fallback'
    });

    const payload = {
      electricity: 100,
      naturalGas: 50,
      water: 1000,
      householdSize: 2,
      heatingFuel: 'gas'
    };

    const res = await request(app).post('/api/footprint').send(payload);

    expect(res.statusCode).toBe(200);
    expect(res.body.data.insightsSource).toBe('fallback');
    expect(res.body.data.insights).toEqual(["Fallback tip 1"]);
  });

  it('should reject requests with missing fields', async () => {
    const payload = {
      electricity: 100,
      // missing naturalGas
      water: 1000,
      householdSize: 2,
      heatingFuel: 'gas'
    };

    const res = await request(app).post('/api/footprint').send(payload);

    expect(res.statusCode).toBe(400);
    expect(res.body.success).toBe(false);
    expect(res.body.error).toBe("Validation failed");
    expect(res.body.details).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ field: "naturalGas" })
      ])
    );
  });

  it('should reject invalid heatingFuel', async () => {
    const payload = {
      electricity: 100,
      naturalGas: 50,
      water: 1000,
      householdSize: 2,
      heatingFuel: 'wood' // Invalid
    };

    const res = await request(app).post('/api/footprint').send(payload);

    expect(res.statusCode).toBe(400);
    expect(res.body.success).toBe(false);
    expect(res.body.details).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ field: "heatingFuel" })
      ])
    );
  });
  
  it('should reject unknown extra fields (strict validation)', async () => {
    const payload = {
      electricity: 100,
      naturalGas: 50,
      water: 1000,
      householdSize: 2,
      heatingFuel: 'gas',
      extraField: "not allowed"
    };

    const res = await request(app).post('/api/footprint').send(payload);

    expect(res.statusCode).toBe(400);
    expect(res.body.success).toBe(false);
  });

  it('should ACCEPT requests with valid localhost Origin', async () => {
    getPersonalizedInsights.mockResolvedValue({ insights: [], source: 'fallback' });
    const payload = { electricity: 100, naturalGas: 50, water: 1000, householdSize: 2, heatingFuel: 'gas' };
    const res = await request(app)
      .post('/api/footprint')
      .set('Origin', 'http://localhost:5173')
      .set('X-Forwarded-For', '127.0.0.99')
      .send(payload);
    
    expect(res.statusCode).toBe(200);
  });

  it('should REJECT requests from attacker-controlled subdomains imitating localhost', async () => {
    const payload = { electricity: 100, naturalGas: 50, water: 1000, householdSize: 2, heatingFuel: 'gas' };
    const res = await request(app)
      .post('/api/footprint')
      .set('Origin', 'http://localhost.attacker-controlled-domain.com')
      .set('X-Forwarded-For', '127.0.0.100')
      .send(payload);
    
    // CORS throws an error which is caught by the global handler as 500
    expect(res.statusCode).toBe(500);
    expect(res.body.error).toBe("Internal Server Error");
  });

});
