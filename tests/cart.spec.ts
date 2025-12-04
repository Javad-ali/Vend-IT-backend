import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock repository functions
const getCart = vi.fn();
const getCartItem = vi.fn();
const upsertCartItem = vi.fn();
const updateCartQuantity = vi.fn();
const deleteCartItem = vi.fn();
const clearCart = vi.fn();
const findSlot = vi.fn();

vi.mock('../src/modules/cart/cart.repository.js', () => ({
  getCart,
  getCartItem,
  upsertCartItem,
  updateCartQuantity,
  deleteCartItem,
  clearCart,
  findSlot
}));

// Mock Redis
vi.mock('../src/libs/redis.js', () => ({
  redis: {
    get: vi.fn().mockResolvedValue(null),
    setex: vi.fn().mockResolvedValue('OK'),
    del: vi.fn().mockResolvedValue(1)
  }
}));

const { addToCart, listCart, updateCartItemQuantity, removeCartItem, emptyCart } = await import(
  '../src/modules/cart/cart.service.js'
);

beforeEach(() => {
  vi.clearAllMocks();
});

describe('cart service', () => {
  describe('addToCart', () => {
    it('adds item to cart when slot has sufficient quantity', async () => {
      findSlot.mockResolvedValue({
        quantity: 10,
        price: 1.5,
        product: { unit_price: 1.5 }
      });
      upsertCartItem.mockResolvedValue({
        id: 'cart-1',
        user_id: 'user-1',
        product_u_id: 'prod-1',
        quantity: 2
      });

      const result = await addToCart('user-1', {
        machineId: 'machine-1',
        slotNumber: 'A1',
        productId: 'prod-1',
        quantity: 2
      });

      expect(result.status).toBe(200);
      expect(result.message).toBe('Product added to cart successfully');
      expect(upsertCartItem).toHaveBeenCalledWith(
        expect.objectContaining({
          userId: 'user-1',
          quantity: 2
        })
      );
    });

    it('throws error when slot not found', async () => {
      findSlot.mockResolvedValue(null);

      await expect(
        addToCart('user-1', {
          machineId: 'machine-1',
          slotNumber: 'A1',
          productId: 'prod-1',
          quantity: 1
        })
      ).rejects.toThrow('Product slot not found');
    });

    it('throws error when requested quantity exceeds availability', async () => {
      findSlot.mockResolvedValue({
        quantity: 2,
        price: 1.0,
        product: { unit_price: 1.0 }
      });

      await expect(
        addToCart('user-1', {
          machineId: 'machine-1',
          slotNumber: 'A1',
          productId: 'prod-1',
          quantity: 5
        })
      ).rejects.toThrow('Requested quantity exceeds availability');
    });

    it('uses slot price over product price when available', async () => {
      findSlot.mockResolvedValue({
        quantity: 10,
        price: 2.0,
        product: { unit_price: 1.5 }
      });
      upsertCartItem.mockResolvedValue({ id: 'cart-1' });

      await addToCart('user-1', {
        machineId: 'machine-1',
        slotNumber: 'A1',
        productId: 'prod-1',
        quantity: 1
      });

      expect(upsertCartItem).toHaveBeenCalledWith(
        expect.objectContaining({
          unitPrice: 2.0
        })
      );
    });
  });

  describe('listCart', () => {
    it('returns cart items with totals', async () => {
      getCart.mockResolvedValue([
        { id: 'item-1', quantity: 2, unit_price: 1.5 },
        { id: 'item-2', quantity: 1, unit_price: 3.0 }
      ]);

      const result = await listCart('user-1');

      expect(result.status).toBe(200);
      expect(result.data.items).toHaveLength(2);
      expect(result.data.totals.subtotal).toBe(6.0); // (2*1.5) + (1*3.0)
      expect(result.data.totals.totalItems).toBe(3);
    });

    it('returns empty cart correctly', async () => {
      getCart.mockResolvedValue([]);

      const result = await listCart('user-1');

      expect(result.data.items).toHaveLength(0);
      expect(result.data.totals.subtotal).toBe(0);
      expect(result.data.totals.totalItems).toBe(0);
    });
  });

  describe('updateCartItemQuantity', () => {
    it('updates quantity when item exists and quantity is available', async () => {
      getCartItem.mockResolvedValue({
        id: 'cart-1',
        machine_u_id: 'machine-1',
        slot_number: 'A1'
      });
      findSlot.mockResolvedValue({ quantity: 10 });
      updateCartQuantity.mockResolvedValue({ id: 'cart-1', quantity: 5 });

      const result = await updateCartItemQuantity('user-1', 'cart-1', 5);

      expect(result.status).toBe(200);
      expect(updateCartQuantity).toHaveBeenCalledWith('cart-1', 5);
    });

    it('throws error when cart item not found', async () => {
      getCartItem.mockResolvedValue(null);

      await expect(
        updateCartItemQuantity('user-1', 'cart-1', 5)
      ).rejects.toThrow('Cart item not found');
    });

    it('throws error when quantity exceeds slot availability', async () => {
      getCartItem.mockResolvedValue({
        id: 'cart-1',
        machine_u_id: 'machine-1',
        slot_number: 'A1'
      });
      findSlot.mockResolvedValue({ quantity: 3 });

      await expect(
        updateCartItemQuantity('user-1', 'cart-1', 10)
      ).rejects.toThrow('Requested quantity exceeds availability');
    });
  });

  describe('removeCartItem', () => {
    it('removes item from cart', async () => {
      deleteCartItem.mockResolvedValue(undefined);

      const result = await removeCartItem('user-1', 'cart-1');

      expect(result.status).toBe(200);
      expect(result.message).toBe('Cart item removed');
      expect(deleteCartItem).toHaveBeenCalledWith('user-1', 'cart-1');
    });
  });

  describe('emptyCart', () => {
    it('clears all items from cart', async () => {
      clearCart.mockResolvedValue(undefined);

      const result = await emptyCart('user-1');

      expect(result.status).toBe(200);
      expect(result.message).toBe('Cart cleared');
      expect(clearCart).toHaveBeenCalledWith('user-1');
    });
  });
});

