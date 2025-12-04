import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock repository
const getWalletBalance = vi.fn();
const ensureWallet = vi.fn();
const incrementWallet = vi.fn();
const decrementWallet = vi.fn();
const recordWalletTransaction = vi.fn();
const createPayment = vi.fn();
const attachPaymentProducts = vi.fn();
const updateUserTapId = vi.fn();

vi.mock('../src/modules/payments/payments.repository.js', () => ({
  getWalletBalance,
  ensureWallet,
  incrementWallet,
  decrementWallet,
  recordWalletTransaction,
  createPayment,
  attachPaymentProducts,
  updateUserTapId,
  getLoyaltyBalance: vi.fn().mockResolvedValue(0),
  createLoyaltyEntry: vi.fn(),
  incrementLoyaltyBalance: vi.fn(),
  setPaymentEarnedPoints: vi.fn(),
  setPaymentRedemption: vi.fn(),
  listPaymentProductQuantities: vi.fn().mockResolvedValue([])
}));

// Mock Tap client
vi.mock('../src/modules/payments/tap.client.js', () => ({
  tapCreateCharge: vi.fn().mockResolvedValue({
    id: 'chg_123',
    status: 'CAPTURED',
    transaction: { authorization_id: 'auth_123' }
  }),
  tapCreateSavedCardToken: vi.fn().mockResolvedValue({ id: 'tok_123' })
}));

// Mock cart service
vi.mock('../src/modules/cart/cart.service.js', () => ({
  emptyCart: vi.fn()
}));

// Mock notifications
vi.mock('../src/modules/notifications/notifications.service.js', () => ({
  sendNotification: vi.fn()
}));

// Mock machines repository
vi.mock('../src/modules/machines/machines.repository.js', () => ({
  getMachineById: vi.fn().mockResolvedValue({ machine_tag: 'Test Machine' })
}));

// Mock products repository
vi.mock('../src/modules/products/products.repository.js', () => ({
  getProductsByIds: vi.fn().mockResolvedValue([])
}));

// Mock payments service functions
vi.mock('../src/modules/payments/payments.service.js', () => ({
  calculatePurchasePoints: vi.fn().mockResolvedValue(10),
  calculateRedemption: vi.fn().mockResolvedValue({
    requestedPoints: 0,
    pointsRedeemed: 0,
    redeemValue: 0,
    payableAmount: 10
  }),
  applyRedemption: vi.fn()
}));

// Mock config
vi.mock('../src/config/env.js', () => ({
  getConfig: vi.fn().mockReturnValue({
    tapApiBaseUrl: 'https://api.tap.company/v2',
    tapSecretKey: 'sk_test_123',
    loyaltyBaseRate: 10,
    loyaltyHealthyMultiplier: 1.5,
    loyaltyLowHealthMultiplier: 1,
    loyaltyPointValue: 0.001,
    nodeEnv: 'test'
  })
}));

const { chargeWallet, payWithWallet } = await import(
  '../src/modules/payments/wallet.service.js'
);

beforeEach(() => {
  vi.clearAllMocks();
});

describe('wallet service', () => {
  describe('chargeWallet', () => {
    it('charges wallet with card', async () => {
      ensureWallet.mockResolvedValue(undefined);
      incrementWallet.mockResolvedValue({ balance: 10 });
      createPayment.mockResolvedValue({ id: 'payment_1' });
      recordWalletTransaction.mockResolvedValue(undefined);

      const result = await chargeWallet('user-1', {
        amount: 10,
        tapCustomerId: 'cus_123',
        tapCardId: 'card_123'
      });

      expect(result.status).toBe(200);
      expect(incrementWallet).toHaveBeenCalledWith('user-1', 10);
    });

    it('charges wallet without card (direct charge)', async () => {
      ensureWallet.mockResolvedValue(undefined);
      incrementWallet.mockResolvedValue({ balance: 25 });
      createPayment.mockResolvedValue({ id: 'payment_2' });
      recordWalletTransaction.mockResolvedValue(undefined);

      const result = await chargeWallet('user-1', {
        amount: 25
      });

      expect(result.status).toBe(200);
      expect(result.data.balance).toBe(25);
    });
  });

  describe('payWithWallet', () => {
    it('pays from wallet when sufficient balance', async () => {
      decrementWallet.mockResolvedValue({ balance: 40 });
      createPayment.mockResolvedValue({ id: 'payment_1', amount: 10, status: 'DEBIT' });
      attachPaymentProducts.mockResolvedValue(undefined);
      recordWalletTransaction.mockResolvedValue(undefined);

      const result = await payWithWallet('user-1', {
        amount: 10,
        machineId: 'machine-1',
        products: [{ productId: 'prod-1', quantity: 2 }]
      });

      expect(result.status).toBe(200);
      expect(decrementWallet).toHaveBeenCalledWith('user-1', 10);
    });

    it('throws error when insufficient balance', async () => {
      decrementWallet.mockResolvedValue({ balance: -5 });

      await expect(
        payWithWallet('user-1', {
          amount: 10,
          machineId: 'machine-1',
          products: []
        })
      ).rejects.toThrow('Insufficient wallet balance');
    });

    it('handles null wallet after decrement', async () => {
      decrementWallet.mockResolvedValue(null);

      await expect(
        payWithWallet('user-1', {
          amount: 1,
          machineId: 'machine-1',
          products: []
        })
      ).rejects.toThrow('Insufficient wallet balance');
    });
  });
});

