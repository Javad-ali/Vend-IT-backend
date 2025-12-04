import { describe, it, expect, vi, beforeEach } from 'vitest';

// Test error handler
describe('error-handler middleware', () => {
  const mockRes = () => {
    const res: any = {};
    res.status = vi.fn().mockReturnValue(res);
    res.json = vi.fn().mockReturnValue(res);
    return res;
  };

  const mockReq = (overrides = {}) => ({
    method: 'POST',
    url: '/api/test',
    originalUrl: '/api/test',
    path: '/test',
    query: {},
    ip: '127.0.0.1',
    socket: { remoteAddress: '127.0.0.1' },
    headers: {
      'user-agent': 'test-agent',
      'content-type': 'application/json'
    },
    user: undefined,
    ...overrides
  });

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('handles apiError with correct status code', async () => {
    const { apiError } = await import('../src/utils/response.js');
    const { errorHandler } = await import('../src/middleware/error-handler.js');

    const req = mockReq();
    const res = mockRes();
    const next = vi.fn();
    const error = new apiError(404, 'Resource not found');

    errorHandler(error, req as any, res, next);

    expect(res.status).toHaveBeenCalledWith(404);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({
        status: 404,
        message: 'Resource not found'
      })
    );
  });

  it('handles ZodError with validation details', async () => {
    const { ZodError, z } = await import('zod');
    const { errorHandler } = await import('../src/middleware/error-handler.js');

    const schema = z.object({
      email: z.string().email()
    });

    let zodError: InstanceType<typeof ZodError> | null = null;
    try {
      schema.parse({ email: 'invalid' });
    } catch (e) {
      zodError = e as InstanceType<typeof ZodError>;
    }

    const req = mockReq();
    const res = mockRes();
    const next = vi.fn();

    errorHandler(zodError!, req as any, res, next);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({
        status: 400,
        message: 'Validation failed',
        errors: expect.arrayContaining([
          expect.objectContaining({
            path: 'email'
          })
        ])
      })
    );
  });

  it('handles generic errors with 500 status', async () => {
    const { errorHandler } = await import('../src/middleware/error-handler.js');

    const req = mockReq();
    const res = mockRes();
    const next = vi.fn();
    const error = new Error('Something went wrong');

    errorHandler(error, req as any, res, next);

    expect(res.status).toHaveBeenCalledWith(500);
  });

  it('handles JWT token errors', async () => {
    const { errorHandler } = await import('../src/middleware/error-handler.js');

    const req = mockReq();
    const res = mockRes();
    const next = vi.fn();
    const error = new Error('invalid token');
    error.name = 'JsonWebTokenError';

    errorHandler(error, req as any, res, next);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({
        status: 401,
        message: 'Invalid token'
      })
    );
  });

  it('handles expired JWT tokens', async () => {
    const { errorHandler } = await import('../src/middleware/error-handler.js');

    const req = mockReq();
    const res = mockRes();
    const next = vi.fn();
    const error = new Error('jwt expired');
    error.name = 'TokenExpiredError';

    errorHandler(error, req as any, res, next);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({
        status: 401,
        message: 'Token expired'
      })
    );
  });
});

// Test CSRF middleware
describe('csrf middleware', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('generates CSRF token for GET requests', async () => {
    const { setCsrfToken } = await import('../src/middleware/csrf.js');

    const req: any = {
      method: 'GET',
      cookies: {}
    };
    const res: any = {
      cookie: vi.fn(),
      locals: {}
    };
    const next = vi.fn();

    setCsrfToken(req, res, next);

    expect(res.cookie).toHaveBeenCalledWith(
      '_csrf',
      expect.any(String),
      expect.objectContaining({
        httpOnly: false
      })
    );
    expect(res.locals.csrfToken).toBeDefined();
    expect(next).toHaveBeenCalled();
  });

  it('reuses existing CSRF token from cookie', async () => {
    const { setCsrfToken } = await import('../src/middleware/csrf.js');

    const existingToken = 'existing-token-123';
    const req: any = {
      method: 'GET',
      cookies: { _csrf: existingToken }
    };
    const res: any = {
      cookie: vi.fn(),
      locals: {}
    };
    const next = vi.fn();

    setCsrfToken(req, res, next);

    expect(res.cookie).not.toHaveBeenCalled();
    expect(res.locals.csrfToken).toBe(existingToken);
    expect(next).toHaveBeenCalled();
  });
});

// Test rate limiters exist and have correct configuration
describe('rate-limiters', () => {
  it('exports all required limiters', async () => {
    const limiters = await import('../src/middleware/rate-limiters.js');

    expect(limiters.defaultLimiter).toBeDefined();
    expect(limiters.authLimiter).toBeDefined();
    expect(limiters.otpResendLimiter).toBeDefined();
    expect(limiters.paymentLimiter).toBeDefined();
    expect(limiters.walletLimiter).toBeDefined();
    expect(limiters.cardLimiter).toBeDefined();
    expect(limiters.dispenseLimiter).toBeDefined();
    expect(limiters.contactLimiter).toBeDefined();
    expect(limiters.feedbackLimiter).toBeDefined();
    expect(limiters.searchLimiter).toBeDefined();
    expect(limiters.adminLimiter).toBeDefined();
    expect(limiters.adminAuthLimiter).toBeDefined();
    expect(limiters.webhookLimiter).toBeDefined();
  });
});

