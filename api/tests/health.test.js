import { describe, it, expect } from 'vitest';
import request from 'supertest';
import app from '../server.js';

describe('Health API', () => {
  it('should return 200 OK for health check', async () => {
    const res = await request(app).get('/api/health');
    
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.message).toBe('Perfect Store API is running');
  });

  it('should return 404 for unknown routes', async () => {
    const res = await request(app).get('/api/unknown-route');
    
    expect(res.status).toBe(404);
    expect(res.body.success).toBe(false);
  });
});
