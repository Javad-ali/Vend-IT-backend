import { describe, it, expect, vi, beforeEach } from 'vitest';
import { requireAdmin, attachAdmin } from '../src/middleware/admin-auth.js';

type MockAdmin = { id: string };
type MockRequest = { session?: { admin?: MockAdmin } };
type MockResponse = {
  redirect: ReturnType<typeof vi.fn>;
  locals: { admin?: MockAdmin | null };
  flash: ReturnType<typeof vi.fn>;
};

const next = vi.fn();

beforeEach(() => {
  next.mockReset();
});

const createRequest = (session: MockRequest['session'] = {}): MockRequest => ({ session });
const createResponse = (): MockResponse => {
  const redirect = vi.fn();
  return {
    redirect,
    locals: {},
    flash: vi.fn()
  };
};

describe('requireAdmin middleware', () => {
  it('redirects to the login page when session admin is missing', () => {
    const req = createRequest({});
    const res = createResponse();

    requireAdmin(req as any, res as any, next);

    expect(res.redirect).toHaveBeenCalledWith('/admin/login');
    expect(next).not.toHaveBeenCalled();
  });

  it('calls next when an admin session exists', () => {
    const req = createRequest({ admin: { id: 'admin-1' } });
    const res = createResponse();

    requireAdmin(req as any, res as any, next);

    expect(res.redirect).not.toHaveBeenCalled();
    expect(next).toHaveBeenCalledTimes(1);
  });
});

describe('attachAdmin middleware', () => {
  it('stores the admin on res.locals for downstream handlers', () => {
    const admin = { id: 'admin-99', email: 'ops@vendit.app' };
    const req = createRequest({ admin });
    const res = createResponse();

    attachAdmin(req as any, res as any, next);

    expect(res.locals.admin).toEqual(admin);
    expect(next).toHaveBeenCalled();
  });

  it('falls back to null when session is absent', () => {
    const req = createRequest(undefined);
    const res = createResponse();

    attachAdmin(req as any, res as any, next);

    expect(res.locals.admin).toBeNull();
  });
});
