import { describe, it, expect, beforeAll } from 'vitest';
import request from 'supertest';
import app from '../../src/app.js';
import { createTestUser, verifyTestUser, testData } from './setup.js';

describe('Health Check Integration Tests', () => {
  it('should return healthy status with all services', async () => {
    const response = await request(app)
      .get('/api/health')
      .expect(200);

    expect(response.body).toHaveProperty('status', 'ok');
    expect(response.body).toHaveProperty('uptime');
    expect(response.body).toHaveProperty('services');
    expect(response.body.services).toHaveProperty('database');
    expect(response.body.services).toHaveProperty('redis');
    expect(response.body.services.database).toHaveProperty('status', 'ok');
    expect(response.body.services.redis).toHaveProperty('status', 'ok');
  });
});

describe('Machine API Integration Tests', () => {
  let authToken: string;

  beforeAll(async () => {
    // Create and verify user for authenticated requests
    const user = await createTestUser({ is_otp_verify: 1 });
    await verifyTestUser(user.id);

    const loginResponse = await request(app)
      .post('/api/auth/login')
      .send({
        countryCode: user.country_code,
        phoneNumber: user.phone_number.replace(user.country_code, ''),
      });

    const verifyResponse = await request(app)
      .post('/api/auth/verify')
      .set('Authorization', `Bearer ${loginResponse.body.data.token}`)
      .send({ otp: loginResponse.body.data.otp });

    authToken = verifyResponse.body.data.token;
  });

  describe('GET /api/machines', () => {
    it('should return machines near coordinates', async () => {
      const response = await request(app)
        .get('/api/machines')
        .query({ lat: 29.3759, lng: 47.9774 }) // Kuwait coordinates
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body).toHaveProperty('data');
      expect(Array.isArray(response.body.data)).toBe(true);
    });

    it('should reject request without auth token', async () => {
      await request(app)
        .get('/api/machines')
        .query({ lat: 29.3759, lng: 47.9774 })
        .expect(401);
    });

    it('should reject request without coordinates', async () => {
      await request(app)
        .get('/api/machines')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(400);
    });
  });

  describe('GET /api/machines/:machineId', () => {
    it('should return machine details for valid ID', async () => {
      // First get list of machines
      const listResponse = await request(app)
        .get('/api/machines')
        .query({ lat: 29.3759, lng: 47.9774 })
        .set('Authorization', `Bearer ${authToken}`);

      if (listResponse.body.data && listResponse.body.data.length > 0) {
        const machineId = listResponse.body.data[0].u_id;

        const response = await request(app)
          .get(`/api/machines/${machineId}`)
          .set('Authorization', `Bearer ${authToken}`)
          .expect(200);

        expect(response.body.data).toHaveProperty('u_id', machineId);
      }
    });

    it('should return 404 for non-existent machine', async () => {
      await request(app)
        .get('/api/machines/non-existent-id')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(404);
    });
  });
});

describe('Product API Integration Tests', () => {
  let authToken: string;

  beforeAll(async () => {
    const user = await createTestUser({ is_otp_verify: 1 });
    await verifyTestUser(user.id);

    const loginResponse = await request(app)
      .post('/api/auth/login')
      .send({
        countryCode: user.country_code,
        phoneNumber: user.phone_number.replace(user.country_code, ''),
      });

    const verifyResponse = await request(app)
      .post('/api/auth/verify')
        .set('Authorization', `Bearer ${loginResponse.body.data.token}`)
        .send({ otp: loginResponse.body.data.otp });

    authToken = verifyResponse.body.data.token;
  });

  describe('GET /api/products/categories', () => {
    it('should return product categories', async () => {
      const response = await request(app)
        .get('/api/products/categories')
        .query({ machineId: 'test-machine' })
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body).toHaveProperty('data');
      expect(Array.isArray(response.body.data)).toBe(true);
    });
  });

  describe('GET /api/products', () => {
    it('should return products for a machine', async () => {
      const response = await request(app)
        .get('/api/products')
        .query({ machineId: 'test-machine' })
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body).toHaveProperty('data');
      expect(Array.isArray(response.body.data)).toBe(true);
    });

    it('should filter products by category', async () => {
      const response = await request(app)
        .get('/api/products')
        .query({ machineId: 'test-machine', categoryId: '1' })
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body).toHaveProperty('data');
    });
  });
});
