import { describe, it, expect, vi, afterEach } from 'vitest';
import { requireAuth } from '../src/middleware/auth.js';
import * as jwtUtils from '../src/utils/jwt.js';
import { apiError } from '../src/utils/response.js';

type MockRequest = {
  headers: Record<string, string | undefined>;
  user?: unknown;
};

const createReq = (authorization?: string): MockRequest => ({
  headers: { authorization }
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe('requireAuth middleware', () => {
  it('throws when the Authorization header is missing', () => {
    const req = createReq();
    const next = vi.fn();

    expect(() => requireAuth(req as any, {} as any, next)).toThrow(apiError);
    expect(next).not.toHaveBeenCalled();
  });

  it('attaches the decoded payload and calls next for a valid token', () => {
    const payload = { id: 'user-123', email: 'test@example.com' };
    const verifySpy = vi
      .spyOn(jwtUtils, 'verifyAccessToken')
      .mockReturnValue(payload as any);
    const req = createReq('Bearer valid-token');
    const next = vi.fn();

    requireAuth(req as any, {} as any, next);

    expect(verifySpy).toHaveBeenCalledWith('valid-token');
    expect(req.user).toEqual(payload);
    expect(next).toHaveBeenCalledTimes(1);
  });

  it('converts TokenExpiredError into an apiError', () => {
    vi.spyOn(jwtUtils, 'verifyAccessToken').mockImplementation(() => {
      const error = new Error('jwt expired');
      (error as any).name = 'TokenExpiredError';
      throw error;
    });
    const req = createReq('Bearer expired');

    expect(() => requireAuth(req as any, {} as any, vi.fn())).toThrow(apiError);
  });
});
