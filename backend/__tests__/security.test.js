const request = require('supertest');
const express = require('express');

describe('Security Config', () => {
  let app;
  
  beforeAll(() => {
    // Import server only during test execution so env vars can be mocked if needed
    app = require('../server');
  });

  it('should reject payloads larger than 10kb', async () => {
    // Create a payload larger than 10kb
    // A string of 1024 chars is ~1kb, so 15000 chars is ~15kb
    const oversizedString = 'a'.repeat(15000);
    const oversizedPayload = { data: oversizedString };

    const response = await request(app)
      .post('/api/footprint')
      .send(oversizedPayload)
      .set('Content-Type', 'application/json');

    // Express body-parser returns 413 Payload Too Large
    expect(response.status).toBe(413);
  });
});
