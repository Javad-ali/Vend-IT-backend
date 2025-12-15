import type { Request, Response } from 'express';
import multer from 'multer';
import { apiSuccess, apiError, errorResponse } from '../../utils/response.js';
import { audit } from '../../utils/audit.js';
import {
  createAdminCategory,
  getAdminCategories,
  getAdminCategoryById,
  getAdminCategoryProducts,
  getAdminProfile,
  updateAdminCategory,
  updateAdminProfile
} from '../admin/admin.profile.service.js';

const upload = multer({ storage: multer.memoryStorage() });
export const avatarUploadMiddleware = upload.single('avatar');
export const categoryUploadMiddleware = upload.single('icon');

/**
 * API: Get admin profile
 */
export const getProfileApi = async (req: Request, res: Response) => {
  try {
    const admin = (req as any).admin;
    const profile = await getAdminProfile(admin.adminId);
    return res.json(apiSuccess(profile));
  } catch (error: any) {
    const statusCode = error.statusCode || 500;
    return res
      .status(statusCode)
      .json(errorResponse(statusCode, error.message || 'Failed to fetch profile'));
  }
};

/**
 * API: Update admin profile
 */
export const updateProfileApi = async (req: Request, res: Response) => {
  try {
    const admin = (req as any).admin;
    const profile = await updateAdminProfile(admin.adminId, {
      name: req.body.name,
      file: req.file ?? undefined
    });
    return res.json(apiSuccess(profile, 'Profile updated successfully'));
  } catch (error: any) {
    const statusCode = error.statusCode || 500;
    return res
      .status(statusCode)
      .json(errorResponse(statusCode, error.message || 'Failed to update profile'));
  }
};

/**
 * API: Get all categories
 */
export const getCategoriesApi = async (_req: Request, res: Response) => {
  try {
    const categories = await getAdminCategories();
    return res.json(apiSuccess({ categories }));
  } catch (error: any) {
    const statusCode = error.statusCode || 500;
    return res
      .status(statusCode)
      .json(errorResponse(statusCode, error.message || 'Failed to fetch categories'));
  }
};

/**
 * API: Get category by ID
 */
export const getCategoryByIdApi = async (req: Request, res: Response) => {
  try {
    const category = await getAdminCategoryById(req.params.categoryId);
    return res.json(apiSuccess(category));
  } catch (error: any) {
    const statusCode = error.statusCode || 500;
    return res
      .status(statusCode)
      .json(errorResponse(statusCode, error.message || 'Failed to fetch category'));
  }
};

/**
 * API: Get products by category
 */
export const getCategoryProductsApi = async (req: Request, res: Response) => {
  try {
    const products = await getAdminCategoryProducts(req.params.categoryId);
    return res.json(apiSuccess(products));
  } catch (error: any) {
    const statusCode = error.statusCode || 500;
    return res
      .status(statusCode)
      .json(errorResponse(statusCode, error.message || 'Failed to fetch products'));
  }
};

/**
 * API: Create category
 */
export const createCategoryApi = async (req: Request, res: Response) => {
  try {
    const admin = (req as any).admin;
    const category = await createAdminCategory({
      name: req.body.name,
      description: req.body.description,
      file: req.file ?? undefined
    });
    
    // Log category creation
    await audit.adminAction(
      admin?.adminId,
      'category',
      category?.data?.id || 'new',
      { action: 'created', name: req.body.name, adminName: admin?.name },
      req
    );
    
    return res.status(201).json(apiSuccess({ category }, 'Category created successfully'));
  } catch (error: any) {
    const statusCode = error.statusCode || 500;
    return res
      .status(statusCode)
      .json(errorResponse(statusCode, error.message || 'Failed to create category'));
  }
};

/**
 * API: Update category
 */
export const updateCategoryApi = async (req: Request, res: Response) => {
  try {
    const admin = (req as any).admin;
    const category = await updateAdminCategory(req.params.categoryId, {
      name: req.body.name,
      description: req.body.description,
      file: req.file ?? undefined
    });
    
    // Log category update
    await audit.adminAction(
      admin?.adminId,
      'category',
      req.params.categoryId,
      { action: 'updated', name: req.body.name, adminName: admin?.name },
      req
    );
    
    return res.json(apiSuccess({ category }, 'Category updated successfully'));
  } catch (error: any) {
    const statusCode = error.statusCode || 500;
    return res
      .status(statusCode)
      .json(errorResponse(statusCode, error.message || 'Failed to update category'));
  }
};
