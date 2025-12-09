import { apiError, ok } from '../../utils/response.js';
import { redis } from '../../libs/redis.js';
import {
  clearCart,
  deleteCartItem,
  findSlot,
  getCart,
  getCartItem,
  updateCartQuantity,
  upsertCartItem
} from './cart.repository.js';
export const addToCart = async (userId, input) => {
  const slot = await findSlot(input.machineId, input.slotNumber);
  if (!slot?.product) {
    throw new apiError(404, 'Product slot not found');
  }
  if ((slot.quantity ?? 0) < input.quantity) {
    throw new apiError(400, 'Requested quantity exceeds availability');
  }
  const unitPrice =
    slot.price ??
    (Array.isArray(slot.product) && slot.product.length > 0 ? slot.product[0].unit_price : 0) ??
    0;
  const cart = await upsertCartItem({
    userId,
    machineId: input.machineId,
    slotNumber: input.slotNumber,
    productId: input.productId,
    quantity: input.quantity,
    unitPrice
  });
  await redis.del(`cart:${userId}`);
  return ok(cart, 'Product added to cart successfully');
};
export const listCart = async (userId) => {
  const cacheKey = `cart:${userId}`;
  const cached = await redis.get(cacheKey);
  if (cached) return JSON.parse(cached);
  const items = await getCart(userId);
  const totals = items.reduce(
    (acc, item) => {
      const line = item.quantity * item.unit_price;
      acc.subtotal += line;
      acc.totalItems += item.quantity;
      return acc;
    },
    { subtotal: 0, totalItems: 0 }
  );
  const response = ok({ items, totals }, 'Cart items found');
  await redis.setex(cacheKey, 30, JSON.stringify(response));
  return response;
};
export const updateCartItemQuantity = async (userId, cartId, quantity) => {
  const item = await getCartItem(userId, cartId);
  if (!item) throw new apiError(404, 'Cart item not found');
  const slot = await findSlot(item.machine_u_id, item.slot_number);
  if (!slot?.quantity || quantity > slot.quantity) {
    throw new apiError(400, 'Requested quantity exceeds availability');
  }
  const updated = await updateCartQuantity(cartId, quantity);
  await redis.del(`cart:${userId}`);
  return ok(updated, 'Cart item updated');
};
export const removeCartItem = async (userId, cartId) => {
  await deleteCartItem(userId, cartId);
  await redis.del(`cart:${userId}`);
  return ok(null, 'Cart item removed');
};
export const emptyCart = async (userId) => {
  await clearCart(userId);
  await redis.del(`cart:${userId}`);
  return ok(null, 'Cart cleared');
};
