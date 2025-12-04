import { describe, it, expect, beforeAll } from 'vitest';
import request from 'supertest';
import app from '../../src/app.js';
import { createTestUser, verifyTestUser, cleanupUser, TEST_PHONE } from './setup.js';

describe('Authentication Flow Integration Tests', () => {
  let testUserId: string;
  let accessToken: string;

  describe('POST /api/auth/register', () => {
    it('should register a new user and send OTP', async () => {
      const response = await request(app)
        .post('/api/auth/register')
        .send({
          countryCode: '+965',
          phoneNumber: '50123456',
          deviceType: 'ios',
        })
        .expect(200);

      expect(response.body).toHaveProperty('data');
      expect(response.body.data).toHaveProperty('id');
      expect(response.body.data).toHaveProperty('token');
      expect(response.body.data).toHaveProperty('otp'); // In development

      testUserId = response.body.data.id;
      accessToken = response.body.data.token;
    });

    it('should reject registration with existing verified phone', async () => {
      // Create and verify a user first
      const user = await createTestUser({ phone_number: '+96550999999', is_otp_verify: 1 });

      const response = await request(app)
        .post('/api/auth/register')
        .send({
          countryCode: '+965',
          phoneNumber: '50999999',
        })
        .expect(409);

      expect(response.body.message).toContain('already registered');

      await cleanupUser(user.id);
    });
  });

  describe('POST /api/auth/login', () => {
    beforeAll(async () => {
      // Create a verified user for login tests
      const user = await createTestUser({
        phone_number: TEST_PHONE,
        is_otp_verify: 1,
      });
      testUserId = user.id;
    });

    it('should login existing user and send OTP', async () => {
      const phone = TEST_PHONE.replace('+965', '');

      const response = await request(app)
        .post('/api/auth/login')
        .send({
          countryCode: '+965',
          phoneNumber: phone,
        })
        .expect(200);

      expect(response.body.data).toHaveProperty('id', testUserId);
      expect(response.body.data).toHaveProperty('token');
      expect(response.body.data).toHaveProperty('otp');

      accessToken = response.body.data.token;
    });

    it('should return 404 for non-existent user', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          countryCode: '+965',
          phoneNumber: '50000001', // Non-existent
        })
        .expect(404);

      expect(response.body.message).toContain('not found');
    });
  });

  describe('POST /api/auth/verify', () => {
    let otp: string;

    beforeAll(async () => {
      // Login to get OTP
      const loginResponse = await request(app)
        .post('/api/auth/login')
        .send({
          countryCode: '+965',
          phoneNumber: TEST_PHONE.replace('+965', ''),
        });

      otp = loginResponse.body.data.otp;
      accessToken = loginResponse.body.data.token;
    });

    it('should verify correct OTP', async () => {
      const response = await request(app)
        .post('/api/auth/verify')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          otp: otp,
        })
        .expect(200);

      expect(response.body.data).toHaveProperty('token');
      expect(response.body.data).toHaveProperty('refreshToken');
    });

    it('should reject invalid OTP', async () => {
      const response = await request(app)
        .post('/api/auth/verify')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          otp: '0000', // Wrong OTP
        })
        .expect(400);

      expect(response.body.message).toContain('Invalid');
    });

    it('should reject request without token', async () => {
      await request(app)
        .post('/api/auth/verify')
        .send({ otp: '1234' })
        .expect(401);
    });
  });

  describe('POST /api/auth/refresh', () => {
    let refreshToken: string;

    beforeAll(async () => {
      // Get a verified session
      const user = await createTestUser({ is_otp_verify: 1 });
      await verifyTestUser(user.id);

      const loginResponse = await request(app)
        .post('/api/auth/login')
        .send({
          countryCode: '+965',
          phoneNumber: user.phone_number.replace('+965', ''),
        });

      const verifyResponse = await request(app)
        .post('/api/auth/verify')
        .set('Authorization', `Bearer ${loginResponse.body.data.token}`)
        .send({ otp: loginResponse.body.data.otp });

      refreshToken = verifyResponse.body.data.refreshToken;
    });

    it('should refresh access token with valid refresh token', async () => {
      const response = await request(app)
        .post('/api/auth/refresh')
        .send({ refreshToken })
        .expect(200);

      expect(response.body.data).toHaveProperty('token');
      expect(response.body.data).toHaveProperty('refreshToken');
    });

    it('should reject invalid refresh token', async () => {
      const response = await request(app)
        .post('/api/auth/refresh')
        .send({ refreshToken: 'invalid-token' })
        .expect(401);

      expect(response.body.message).toContain('Invalid');
    });
  });

  describe('Protected Endpoint Access', () => {
    let validToken: string;

    beforeAll(async () => {
      // Create verified user and get token
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

      validToken = verifyResponse.body.data.token;
    });

    it('should access protected endpoint with valid token', async () => {
      await request(app)
        .get('/api/users/profile')
        .set('Authorization', `Bearer ${validToken}`)
        .expect(200);
    });

    it('should reject access without token', async () => {
      await request(app)
        .get('/api/users/profile')
        .expect(401);
    });

    it('should reject access with invalid token', async () => {
      await request(app)
        .get('/api/users/profile')
        .set('Authorization', 'Bearer invalid-token')
        .expect(401);
    });
  });
});
