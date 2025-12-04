import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock Tap client
const tapCreateCustomer = vi.fn();
const tapCreateCardToken = vi.fn();
const tapCreateSavedCardToken = vi.fn();
const tapListCards = vi.fn();
const tapDeleteCard = vi.fn();

vi.mock('../src/modules/payments/tap.client.js', () => ({
  tapCreateCustomer,
  tapCreateCardToken,
  tapCreateSavedCardToken,
  tapListCards,
  tapDeleteCard
}));

// Mock repository
const getUser = vi.fn();
const updateUserTapId = vi.fn();
const upsertCard = vi.fn();
const listCardsForUser = vi.fn();
const deleteCardByTapId = vi.fn();

vi.mock('../src/modules/payments/payments.repository.js', () => ({
  getUser,
  updateUserTapId,
  upsertCard,
  listCardsForUser,
  deleteCardByTapId,
  getLoyaltyBalance: vi.fn().mockResolvedValue(0),
  getWalletBalance: vi.fn().mockResolvedValue({ balance: 0 })
}));

// Mock config
vi.mock('../src/config/env.js', () => ({
  getConfig: vi.fn().mockReturnValue({
    tapApiBaseUrl: 'https://api.tap.company/v2',
    tapSecretKey: 'sk_test_123',
    tapPublicKey: 'pk_test_123',
    tapDefaultCurrency: 'KWD',
    tapCountryCode: 965,
    nodeEnv: 'test'
  })
}));

const { createCard, listCards, deleteCard } = await import(
  '../src/modules/payments/cards.service.js'
);

beforeEach(() => {
  vi.clearAllMocks();
});

describe('cards service', () => {
  describe('createCard', () => {
    it('creates new customer and saves card', async () => {
      getUser.mockResolvedValue({
        id: 'user-1',
        firstName: 'John',
        lastName: 'Doe',
        email: 'john@example.com',
        phoneNumber: '50000000',
        tapCustomerId: null
      });
      tapCreateCustomer.mockResolvedValue({ id: 'cus_new123' });
      tapCreateCardToken.mockResolvedValue({
        card: {
          id: 'card_123',
          last_four: '4242',
          brand: 'VISA',
          name: 'John Doe',
          exp_month: 12,
          exp_year: 2025
        }
      });
      tapCreateSavedCardToken.mockResolvedValue({ id: 'saved_123' });
      updateUserTapId.mockResolvedValue(undefined);
      upsertCard.mockResolvedValue({ id: 'local_card_1' });

      const result = await createCard('user-1', {
        number: '4242424242424242',
        expMonth: 12,
        expYear: 2025,
        cvc: '123',
        name: 'John Doe'
      });

      expect(result.status).toBe(200);
      expect(tapCreateCustomer).toHaveBeenCalled();
      expect(updateUserTapId).toHaveBeenCalledWith('user-1', 'cus_new123');
    });

    it('uses existing Tap customer ID', async () => {
      getUser.mockResolvedValue({
        id: 'user-1',
        firstName: 'Jane',
        email: 'jane@example.com',
        phoneNumber: '50000001',
        tapCustomerId: 'cus_existing'
      });
      tapCreateCardToken.mockResolvedValue({
        card: { id: 'card_456', last_four: '1234', brand: 'VISA', exp_month: 12, exp_year: 2025 }
      });
      tapCreateSavedCardToken.mockResolvedValue({ id: 'saved_456' });
      upsertCard.mockResolvedValue({ id: 'local_card_2' });

      await createCard('user-1', {
        number: '4242424242424242',
        expMonth: 12,
        expYear: 2025,
        cvc: '123'
      });

      expect(tapCreateCustomer).not.toHaveBeenCalled();
    });

    it('throws error when user not found', async () => {
      getUser.mockResolvedValue(null);

      await expect(
        createCard('invalid', { number: '4242424242424242', expMonth: 12, expYear: 2025, cvc: '123' })
      ).rejects.toThrow('User not found');
    });
  });

  describe('listCards', () => {
    it('returns list of saved cards from Tap', async () => {
      getUser.mockResolvedValue({
        id: 'user-1',
        tapCustomerId: 'cus_123'
      });
      tapListCards.mockResolvedValue([
        { id: 'card_1', last_four: '4242', brand: 'VISA', exp_month: 12, exp_year: 2025, name: 'John' },
        { id: 'card_2', last_four: '5555', brand: 'MASTERCARD', exp_month: 6, exp_year: 2026, name: 'John' }
      ]);
      listCardsForUser.mockResolvedValue([]);

      const result = await listCards('user-1');

      expect(result.status).toBe(200);
      expect(result.data).toHaveLength(2);
      expect(result.data[0].last4).toBe('4242');
    });

    it('returns empty array when user has no Tap ID', async () => {
      getUser.mockResolvedValue({
        id: 'user-1',
        tapCustomerId: null
      });

      const result = await listCards('user-1');

      expect(result.data).toEqual([]);
      expect(tapListCards).not.toHaveBeenCalled();
    });
  });

  describe('deleteCard', () => {
    it('deletes card from Tap', async () => {
      getUser.mockResolvedValue({
        id: 'user-1',
        tapCustomerId: 'cus_123'
      });
      tapDeleteCard.mockResolvedValue(true);
      deleteCardByTapId.mockResolvedValue(undefined);

      const result = await deleteCard('user-1', 'card_123');

      expect(result.status).toBe(200);
      expect(result.message).toBe('Card deleted');
      expect(tapDeleteCard).toHaveBeenCalledWith('cus_123', 'card_123');
    });

    it('throws error when user has no Tap ID', async () => {
      getUser.mockResolvedValue({
        id: 'user-1',
        tapCustomerId: null
      });

      await expect(
        deleteCard('user-1', 'card_123')
      ).rejects.toThrow('Customer ID not set');
    });
  });
});

