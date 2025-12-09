import {
  addToCart,
  emptyCart,
  listCart,
  removeCartItem,
  updateCartItemQuantity
} from './cart.service.js';
import { addCartSchema, updateCartSchema } from './cart.validators.js';
export const handleAddToCart = async (req, res) => {
  const input = addCartSchema.parse(req.body);
  const response = await addToCart(req.user.id, input);
  return res.json(response);
};
export const handleGetCart = async (req, res) => {
  const response = await listCart(req.user.id);
  return res.json(response);
};
export const handleUpdateCart = async (req, res) => {
  const { cartId } = req.params;
  const input = updateCartSchema.parse(req.body);
  const response = await updateCartItemQuantity(req.user.id, cartId, input.quantity);
  return res.json(response);
};
export const handleRemoveCart = async (req, res) => {
  const { cartId } = req.params;
  const response = await removeCartItem(req.user.id, cartId);
  return res.json(response);
};
export const handleClearCart = async (req, res) => {
  const response = await emptyCart(req.user.id);
  return res.json(response);
};
