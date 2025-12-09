import {
  getCategories,
  getProductDetail,
  getProductImage,
  getProducts,
  searchProducts
} from './products.service.js';
import { logger } from '../../config/logger.js';

export const handleCategories = async (req, res) => {
  const machineId = String(req.query.machineId ?? req.query.machine_id ?? '');
  logger.info({ machineId, query: req.query }, 'handleCategories called');
  if (!machineId)
    return res.status(400).json({ status: 400, message: 'machine_id query param is required' });
  const response = await getCategories(machineId);
  logger.info({ machineId, dataLength: response?.data?.length }, 'handleCategories response');
  return res.json(response);
};

export const handleProducts = async (req, res) => {
  const machineId = String(req.query.machineId ?? req.query.machine_id ?? '');
  const categoryId =
    (req.query.categoryId ?? req.query.category_id)
      ? String(req.query.categoryId ?? req.query.category_id)
      : undefined;
  logger.info({ machineId, categoryId, query: req.query }, 'handleProducts called');
  if (!machineId)
    return res.status(400).json({ status: 400, message: 'machine_id query param is required' });
  const response = await getProducts(machineId, categoryId);
  logger.info({ machineId, dataLength: response?.data?.length }, 'handleProducts response');
  return res.json(response);
};

export const handleSearchProducts = async (req, res) => {
  const machineId = String(req.query.machineId ?? req.query.machine_id ?? '');
  const searchTerm = req.query.q ? String(req.query.q) : '';
  if (!machineId || !searchTerm) {
    return res
      .status(400)
      .json({ status: 400, message: 'machine_id and q query params are required' });
  }
  const response = await searchProducts(machineId, searchTerm);
  return res.json(response);
};

export const handleProductDetail = async (req, res) => {
  const { productId } = req.params;
  const response = await getProductDetail(productId);
  return res.json(response);
};

export const handleLegacyProductImage = async (req, res) => {
  const productId =
    (req.body?.p_uid && String(req.body.p_uid)) ||
    (req.body?.productId && String(req.body.productId)) ||
    (req.body?.id && String(req.body.id)) ||
    (req.query?.productId && String(req.query.productId)) ||
    (req.params?.productId && String(req.params.productId)) ||
    '';
  if (!productId) {
    return res.status(400).json({ status: 400, message: 'p_uid is required' });
  }
  const response = await getProductImage(productId);
  return res.json(response);
};
