import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock repository functions
const getUser = vi.fn();
const getLoyaltyBalance = vi.fn();
const getProductsByIds = vi.fn();
const createPayment = vi.fn();
const createLoyaltyEntry = vi.fn();
const incrementLoyaltyBalance = vi.fn();
const attachPaymentProducts = vi.fn();
const setPaymentEarnedPoints = vi.fn();
const setPaymentRedemption = vi.fn();

vi.mock('../src/modules/payments/payments.repository.js', () => ({
  getUser,
  getLoyaltyBalance,
  createPayment,
  createLoyaltyEntry,
  incrementLoyaltyBalance,
  attachPaymentProducts,
  setPaymentEarnedPoints,
  setPaymentRedemption,
  getWalletBalance: vi.fn().mockResolvedValue({ balance: 100 }),
  listPaymentHistory: vi.fn().mockResolvedValue([]),
  listOrderHistory: vi.fn().mockResolvedValue([]),
  listLoyaltyHistory: vi.fn().mockResolvedValue([]),
  listWalletHistory: vi.fn().mockResolvedValue([]),
  updateUserTapId: vi.fn(),
  listPaymentProductQuantities: vi.fn().mockResolvedValue([]),
  setDispensedQuantity: vi.fn(),
  getPaymentById: vi.fn().mockResolvedValue(null)
}));

vi.mock('../src/modules/products/products.repository.js', () => ({
  getProductsByIds
}));

vi.mock('../src/modules/notifications/notifications.service.js', () => ({
  sendNotification: vi.fn()
}));

vi.mock('../src/modules/cart/cart.service.js', () => ({
  emptyCart: vi.fn()
}));

vi.mock('../src/modules/machines/machines.repository.js', () => ({
  getMachineById: vi.fn().mockResolvedValue({ machine_tag: 'Test Machine' })
}));

vi.mock('../src/modules/payments/tap.client.js', () => ({
  tapCreateCustomer: vi.fn().mockResolvedValue({ id: 'cus_123' }),
  tapCreateSavedCardToken: vi.fn().mockResolvedValue({ id: 'tok_123' }),
  tapCreateCharge: vi.fn().mockResolvedValue({
    id: 'chg_123',
    status: 'CAPTURED',
    transaction: { authorization_id: 'auth_123' }
  }),
  tapCreateChargeWithToken: vi.fn().mockResolvedValue({
    id: 'chg_456',
    status: 'CAPTURED',
    transaction: { authorization_id: 'auth_456' },
    source: { payment_method: 'GOOGLE_PAY' }
  }),
  tapCreateGPayToken: vi.fn().mockResolvedValue({ id: 'gpay_tok_123' })
}));

const { calculateRedemption, calculatePurchasePoints, getLoyaltyConversionQuote } = await import(
  '../src/modules/payments/payments.service.js'
);

beforeEach(() => {
  vi.clearAllMocks();
});

describe('payments service', () => {
  describe('calculateRedemption', () => {
    it('returns zero redemption when no points requested', async () => {
      getLoyaltyBalance.mockResolvedValue(1000);

      const result = await calculateRedemption('user-1', 0, 10, []);

      expect(result).toEqual({
        requestedPoints: 0,
        pointsRedeemed: 0,
        redeemValue: 0,
        payableAmount: 10
      });
    });

    it('redeems points up to the purchase amount', async () => {
      getLoyaltyBalance.mockResolvedValue(5000);

      const result = await calculateRedemption('user-1', 3000, 2, []);

      // 2 KWD = 2000 points max (at 0.001 per point)
      expect(result.pointsRedeemed).toBe(2000);
      expect(result.payableAmount).toBe(0);
    });

    it('throws error when insufficient loyalty points', async () => {
      getLoyaltyBalance.mockResolvedValue(100);

      await expect(
        calculateRedemption('user-1', 500, 10, [])
      ).rejects.toThrow('Insufficient loyalty points');
    });

    it('caps redemption at available balance', async () => {
      getLoyaltyBalance.mockResolvedValue(500);

      const result = await calculateRedemption('user-1', 500, 10, []);

      expect(result.pointsRedeemed).toBe(500);
      expect(result.redeemValue).toBe(0.5); // 500 * 0.001
      expect(result.payableAmount).toBe(9.5);
    });
  });

  describe('calculatePurchasePoints', () => {
    it('calculates base points from amount when no products', async () => {
      getProductsByIds.mockResolvedValue([]);

      const points = await calculatePurchasePoints([], 5);

      // 5 KWD * 10 (base rate) = 50 points
      expect(points).toBe(50);
    });

    it('applies healthy multiplier for high health rating products', async () => {
      getProductsByIds.mockResolvedValue([
        {
          product_u_id: 'prod-1',
          unit_price: 1,
          metadata: { health_rating: 4 }
        }
      ]);

      const points = await calculatePurchasePoints(
        [{ productId: 'prod-1', quantity: 2 }],
        2
      );

      // 2 items * 1 KWD * 10 (rate) * 1.5 (healthy multiplier) = 30
      expect(points).toBe(30);
    });

    it('applies low health multiplier for unhealthy products', async () => {
      getProductsByIds.mockResolvedValue([
        {
          product_u_id: 'prod-2',
          unit_price: 2,
          metadata: { health_rating: 1 }
        }
      ]);

      const points = await calculatePurchasePoints(
        [{ productId: 'prod-2', quantity: 1 }],
        2
      );

      // 1 item * 2 KWD * 10 (rate) * 1 (low health multiplier) = 20
      expect(points).toBe(20);
    });

    it('handles mixed health ratings', async () => {
      getProductsByIds.mockResolvedValue([
        {
          product_u_id: 'healthy',
          unit_price: 1,
          metadata: { health_rating: 5 }
        },
        {
          product_u_id: 'unhealthy',
          unit_price: 1,
          metadata: { health_rating: 1 }
        }
      ]);

      const points = await calculatePurchasePoints(
        [
          { productId: 'healthy', quantity: 1 },
          { productId: 'unhealthy', quantity: 1 }
        ],
        2
      );

      // healthy: 1 * 10 * 1.5 = 15
      // unhealthy: 1 * 10 * 1 = 10
      // total = 25
      expect(points).toBe(25);
    });
  });

  describe('getLoyaltyConversionQuote', () => {
    it('converts points to KWD amount', async () => {
      const result = await getLoyaltyConversionQuote(1000);

      expect(result.data).toEqual({
        points: 1000,
        rate: 0.001,
        amount: 1
      });
    });

    it('handles zero points', async () => {
      const result = await getLoyaltyConversionQuote(0);

      expect(result.data).toEqual({
        points: 0,
        rate: 0.001,
        amount: 0
      });
    });

    it('handles negative points as zero', async () => {
      const result = await getLoyaltyConversionQuote(-100);

      expect(result.data?.points).toBe(0);
    });
  });
});

