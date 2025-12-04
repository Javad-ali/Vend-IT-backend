import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock supabase
vi.mock('../src/libs/supabase.js', () => ({
  supabase: {
    from: vi.fn().mockReturnValue({
      insert: vi.fn().mockResolvedValue({ error: null })
    })
  }
}));

// Mock logger
vi.mock('../src/config/logger.js', () => ({
  logger: {
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn()
  }
}));

describe('audit logging', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('logs user login event', async () => {
    const { audit } = await import('../src/utils/audit.js');
    const { logger } = await import('../src/config/logger.js');

    await audit.userLogin('user-123');

    expect(logger.info).toHaveBeenCalledWith(
      expect.objectContaining({
        audit: expect.objectContaining({
          action: 'user.login',
          userId: 'user-123'
        })
      }),
      expect.any(String)
    );
  });

  it('logs payment creation with details', async () => {
    const { audit } = await import('../src/utils/audit.js');
    const { logger } = await import('../src/config/logger.js');

    await audit.paymentCreated('user-123', 'payment-456', {
      amount: 10.5,
      method: 'CARD'
    });

    expect(logger.info).toHaveBeenCalledWith(
      expect.objectContaining({
        audit: expect.objectContaining({
          action: 'payment.created',
          resourceType: 'payment',
          resourceId: 'payment-456'
        })
      }),
      expect.any(String)
    );
  });

  it('extracts IP address from request', async () => {
    const { auditLog } = await import('../src/utils/audit.js');
    const { supabase } = await import('../src/libs/supabase.js');

    const mockReq: any = {
      headers: {
        'x-forwarded-for': '203.0.113.195, 70.41.3.18',
        'user-agent': 'Mozilla/5.0'
      },
      socket: {
        remoteAddress: '127.0.0.1'
      }
    };

    await auditLog(
      {
        action: 'user.login',
        userId: 'user-123',
        resourceType: 'user'
      },
      mockReq
    );

    expect(supabase.from).toHaveBeenCalledWith('audit_logs');
    expect(supabase.from('audit_logs').insert).toHaveBeenCalledWith(
      expect.objectContaining({
        ip_address: '203.0.113.195',
        user_agent: 'Mozilla/5.0'
      })
    );
  });

  it('handles missing request gracefully', async () => {
    const { audit } = await import('../src/utils/audit.js');

    // Should not throw
    await expect(
      audit.userLogout('user-123')
    ).resolves.not.toThrow();
  });

  it('logs admin actions', async () => {
    const { audit } = await import('../src/utils/audit.js');
    const { logger } = await import('../src/config/logger.js');

    await audit.adminAction(
      'admin-1',
      'campaign',
      'campaign-123',
      { action: 'deactivate' }
    );

    expect(logger.info).toHaveBeenCalledWith(
      expect.objectContaining({
        audit: expect.objectContaining({
          action: 'admin.action',
          adminId: 'admin-1',
          resourceType: 'campaign',
          resourceId: 'campaign-123'
        })
      }),
      expect.any(String)
    );
  });

  it('logs dispense operations', async () => {
    const { audit } = await import('../src/utils/audit.js');
    const { logger } = await import('../src/config/logger.js');

    await audit.dispenseTriggered('user-123', 'machine-456', 'A1');

    expect(logger.info).toHaveBeenCalledWith(
      expect.objectContaining({
        audit: expect.objectContaining({
          action: 'dispense.triggered',
          userId: 'user-123',
          resourceId: 'machine-456'
        })
      }),
      expect.any(String)
    );
  });

  it('logs wallet operations with amounts', async () => {
    const { audit } = await import('../src/utils/audit.js');
    const { supabase } = await import('../src/libs/supabase.js');

    await audit.walletCharged('user-123', 50, { source: 'card' });

    expect(supabase.from('audit_logs').insert).toHaveBeenCalledWith(
      expect.objectContaining({
        action: 'wallet.charged',
        details: expect.objectContaining({
          amount: 50,
          source: 'card'
        })
      })
    );
  });
});

