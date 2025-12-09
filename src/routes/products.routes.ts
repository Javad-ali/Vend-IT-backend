import { Router } from 'express';
import {
  handleCategories,
  handleProductDetail,
  handleProducts,
  handleSearchProducts
} from '../modules/products/products.controller.js';
import { requireAuth } from '../middleware/auth.js';
const router = Router();
router.use(requireAuth);
router.get('/categories', handleCategories);
router.get('/', handleProducts);
router.get('/search', handleSearchProducts);
router.get('/:productId', handleProductDetail);
export default router;
