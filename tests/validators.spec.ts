import { describe, it, expect } from 'vitest';

describe('auth validators', () => {
  let registerSchema: any;
  let loginSchema: any;
  let otpSchema: any;
  let refreshTokenSchema: any;

  beforeAll(async () => {
    const validators = await import('../src/modules/auth/auth.validators.js');
    registerSchema = validators.registerSchema;
    loginSchema = validators.loginSchema;
    otpSchema = validators.otpSchema;
    refreshTokenSchema = validators.refreshTokenSchema;
  });

  describe('registerSchema', () => {
    it('validates valid registration data', () => {
      const result = registerSchema.safeParse({
        countryCode: '+965',
        phoneNumber: '50000000'
      });
      expect(result.success).toBe(true);
    });

    it('accepts optional fields', () => {
      const result = registerSchema.safeParse({
        countryCode: '+965',
        phoneNumber: '50000000',
        firstName: 'John',
        lastName: 'Doe',
        email: 'john@example.com',
        deviceType: 'ios',
        deviceToken: 'fcm_token_123'
      });
      expect(result.success).toBe(true);
    });

    it('rejects missing countryCode', () => {
      const result = registerSchema.safeParse({
        phoneNumber: '50000000'
      });
      expect(result.success).toBe(false);
    });

    it('rejects missing phoneNumber', () => {
      const result = registerSchema.safeParse({
        countryCode: '+965'
      });
      expect(result.success).toBe(false);
    });

    it('rejects short phoneNumber', () => {
      const result = registerSchema.safeParse({
        countryCode: '+965',
        phoneNumber: '123'
      });
      expect(result.success).toBe(false);
    });

    it('validates email format when provided', () => {
      const result = registerSchema.safeParse({
        countryCode: '+965',
        phoneNumber: '50000000',
        email: 'invalid-email'
      });
      expect(result.success).toBe(false);
    });
  });

  describe('loginSchema', () => {
    it('validates valid login data', () => {
      const result = loginSchema.safeParse({
        countryCode: '+965',
        phoneNumber: '50000000'
      });
      expect(result.success).toBe(true);
    });

    it('accepts device info', () => {
      const result = loginSchema.safeParse({
        countryCode: '+965',
        phoneNumber: '50000000',
        deviceType: 'android',
        deviceToken: 'fcm_token'
      });
      expect(result.success).toBe(true);
    });
  });

  describe('otpSchema', () => {
    it('validates valid OTP', () => {
      const result = otpSchema.safeParse({
        otp: '1234'
      });
      expect(result.success).toBe(true);
    });

    it('rejects OTP with wrong length', () => {
      const result = otpSchema.safeParse({
        otp: '123'
      });
      expect(result.success).toBe(false);

      const result2 = otpSchema.safeParse({
        otp: '12345'
      });
      expect(result2.success).toBe(false);
    });

    it('accepts optional referral fields', () => {
      const result = otpSchema.safeParse({
        otp: '1234',
        referralCode: 'VNDABC123',
        referrerId: 'user-123',
        latitude: '29.3759',
        longitude: '47.9774'
      });
      expect(result.success).toBe(true);
    });
  });

  describe('refreshTokenSchema', () => {
    it('validates valid refresh token', () => {
      const result = refreshTokenSchema.safeParse({
        refreshToken: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.test'
      });
      expect(result.success).toBe(true);
    });

    it('rejects short refresh token', () => {
      const result = refreshTokenSchema.safeParse({
        refreshToken: 'short'
      });
      expect(result.success).toBe(false);
    });
  });
});

describe('cart validators', () => {
  let addCartSchema: any;
  let updateCartSchema: any;

  beforeAll(async () => {
    const validators = await import('../src/modules/cart/cart.validators.js');
    addCartSchema = validators.addCartSchema;
    updateCartSchema = validators.updateCartSchema;
  });

  describe('addCartSchema', () => {
    it('validates valid cart item', () => {
      const result = addCartSchema.safeParse({
        machineId: 'machine-1',
        slotNumber: 'A1',
        productId: 'prod-1',
        quantity: 2
      });
      expect(result.success).toBe(true);
    });

    it('rejects zero quantity', () => {
      const result = addCartSchema.safeParse({
        machineId: 'machine-1',
        slotNumber: 'A1',
        productId: 'prod-1',
        quantity: 0
      });
      expect(result.success).toBe(false);
    });

    it('rejects negative quantity', () => {
      const result = addCartSchema.safeParse({
        machineId: 'machine-1',
        slotNumber: 'A1',
        productId: 'prod-1',
        quantity: -1
      });
      expect(result.success).toBe(false);
    });

    it('rejects missing machineId', () => {
      const result = addCartSchema.safeParse({
        slotNumber: 'A1',
        productId: 'prod-1',
        quantity: 1
      });
      expect(result.success).toBe(false);
    });

    it('rejects missing productId', () => {
      const result = addCartSchema.safeParse({
        machineId: 'machine-1',
        slotNumber: 'A1',
        quantity: 1
      });
      expect(result.success).toBe(false);
    });
  });

  describe('updateCartSchema', () => {
    it('validates valid quantity update', () => {
      const result = updateCartSchema.safeParse({
        quantity: 5
      });
      expect(result.success).toBe(true);
    });

    it('rejects zero quantity', () => {
      const result = updateCartSchema.safeParse({
        quantity: 0
      });
      expect(result.success).toBe(false);
    });
  });
});

describe('feedback validators', () => {
  let ratingSchema: any;

  beforeAll(async () => {
    const validators = await import('../src/modules/feedback/feedback.validators.js');
    ratingSchema = validators.ratingSchema;
  });

  describe('ratingSchema', () => {
    it('validates valid rating', () => {
      const result = ratingSchema.safeParse({
        rating: 5
      });
      expect(result.success).toBe(true);
    });

    it('accepts rating with comment', () => {
      const result = ratingSchema.safeParse({
        rating: 4,
        comment: 'Great service!'
      });
      expect(result.success).toBe(true);
    });

    it('accepts zero rating (minimum)', () => {
      const result = ratingSchema.safeParse({
        rating: 0
      });
      expect(result.success).toBe(true);
    });

    it('rejects rating above maximum', () => {
      const result = ratingSchema.safeParse({
        rating: 6
      });
      expect(result.success).toBe(false);
    });

    it('accepts rating with emoji', () => {
      const result = ratingSchema.safeParse({
        rating: 5,
        emoji: '😊'
      });
      expect(result.success).toBe(true);
    });

    it('accepts rating with orderId', () => {
      const result = ratingSchema.safeParse({
        rating: 4,
        orderId: 'order-123'
      });
      expect(result.success).toBe(true);
    });
  });
});

describe('content validators', () => {
  let contactSchema: any;

  beforeAll(async () => {
    const validators = await import('../src/modules/content/content.validators.js');
    contactSchema = validators.contactSchema;
  });

  describe('contactSchema', () => {
    it('validates valid contact form', () => {
      const result = contactSchema.safeParse({
        email: 'user@example.com',
        subject: 'Help Request',
        message: 'I need assistance with my order'
      });
      expect(result.success).toBe(true);
    });

    it('rejects invalid email', () => {
      const result = contactSchema.safeParse({
        email: 'invalid',
        subject: 'Test',
        message: 'Test message'
      });
      expect(result.success).toBe(false);
    });

    it('rejects empty subject', () => {
      const result = contactSchema.safeParse({
        email: 'user@example.com',
        subject: '',
        message: 'Test message'
      });
      expect(result.success).toBe(false);
    });

    it('rejects empty message', () => {
      const result = contactSchema.safeParse({
        email: 'user@example.com',
        subject: 'Test',
        message: ''
      });
      expect(result.success).toBe(false);
    });
  });
});

