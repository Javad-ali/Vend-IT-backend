import { Router } from 'express';
import {
  handleAddToCart,
  handleClearCart,
  handleGetCart,
  handleRemoveCart,
  handleUpdateCart
} from '../modules/cart/cart.controller.js';
import { requireAuth } from '../middleware/auth.js';
const router = Router();
router.use(requireAuth);
router.get('/', handleGetCart);
router.post('/', handleAddToCart);
router.put('/:cartId', handleUpdateCart);
router.delete('/:cartId', handleRemoveCart);
router.delete('/', handleClearCart);
export default router;
