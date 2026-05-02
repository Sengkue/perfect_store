import { describe, it, expect } from 'vitest';
import request from 'supertest';
import app from '../server.js';
import { User } from '../models/index.js';

describe('Auth API', () => {
  it('should register a new user', async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .send({
        username: 'testuser',
        password: 'password123',
        role: 'staff'
      });

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data.user.username).toBe('testuser');
    
    // Verify in DB
    const user = await User.findOne({ where: { username: 'testuser' } });
    expect(user).not.toBeNull();
  });

  it('should login successfully', async () => {
    // First, make sure the user exists (created in previous test or here)
    const res = await request(app)
      .post('/api/auth/login')
      .send({
        username: 'testuser',
        password: 'password123'
      });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.token).toBeDefined();
    expect(res.body.data.user.username).toBe('testuser');
  });

  it('should fail with wrong password', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({
        username: 'testuser',
        password: 'wrongpassword'
      });

    expect(res.status).toBe(401);
    expect(res.body.success).toBe(false);
  });
});
