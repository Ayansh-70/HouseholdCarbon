const { getPersonalizedInsights } = require('../services/gemini.service');
const { GoogleGenerativeAI } = require('@google/generative-ai');

// Mock the Gemini SDK
jest.mock('@google/generative-ai', () => {
  const mockGenerateContent = jest.fn().mockResolvedValue({
    response: {
      text: () => JSON.stringify({
        summary: "Mock AI Summary",
        severity: "low",
        actions: [
          { priority: 1, category: "behavior", title: "Test Action", detail: "Test Detail", estimated_saving_kg: 5 }
        ],
        encouragement: "Mock encouragement!"
      })
    }
  });

  const mockGetGenerativeModel = jest.fn().mockReturnValue({
    generateContent: mockGenerateContent
  });

  return {
    GoogleGenerativeAI: jest.fn().mockImplementation(() => ({
      getGenerativeModel: mockGetGenerativeModel
    }))
  };
});

describe('gemini.service global rate limiter', () => {
  beforeEach(() => {
    // We clear mocks before each test
    jest.clearAllMocks();
  });

  it('should return fallback insights without calling Gemini when the global limit is exceeded', async () => {
    const dummyData = {
      breakdown: { electricity: 100, naturalGas: 20, water: 50 },
      householdSize: 2,
      electricityCo2: 50,
      gasCo2: 20,
      waterCo2: 10,
      total: 80,
      perCapita: 40,
      fuelType: 'naturalGas'
    };

    const sdkInstance = new GoogleGenerativeAI();
    const mockModel = sdkInstance.getGenerativeModel();

    // The limit is 12 requests per minute.
    // Call it 12 times to exhaust the limit.
    for (let i = 0; i < 12; i++) {
      const result = await getPersonalizedInsights(dummyData);
      // Depending on whether it's the first test run or shared state,
      // it might hit the limit earlier if tests share state.
      // But let's assume isolated tests, so the first 12 calls return AI.
    }

    // Capture the call count
    const initialCallCount = mockModel.generateContent.mock.calls.length;

    // The 13th call should trigger the global rate limiter
    const limitedResult = await getPersonalizedInsights(dummyData);

    // It should return the fallback
    expect(limitedResult.source).toBe('fallback');
    expect(limitedResult.insights).toBeDefined();

    // It MUST NOT have called generateContent again
    expect(mockModel.generateContent.mock.calls.length).toBe(initialCallCount);
  });
});
