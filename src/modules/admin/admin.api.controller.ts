import type { Request, Response } from 'express';
import { apiSuccess, apiError, errorResponse } from '../../utils/response.js';
import {
  getAdminDashboard,
  getAdminUsers,
  deleteAdminUser,
  toggleUserStatus,
  getAdminUserDetails,
  getAdminMachines,
  getAdminMachineProducts,
  getAdminProduct,
  getAdminProducts,
  getAdminOrders,
  getAdminOrder,
  getAdminFeedback
} from './admin.service.js';

/**
 * API: Get dashboard metrics
 */
export const getDashboardApi = async (_req: Request, res: Response) => {
  try {
    const metrics = await getAdminDashboard();
    return res.json(apiSuccess({ metrics }));
  } catch (error: any) {
    const statusCode = error.statusCode || 500;
    return res
      .status(statusCode)
      .json(errorResponse(statusCode, error.message || 'Failed to fetch dashboard'));
  }
};

/**
 * API: Get all users
 */
export const getUsersApi = async (req: Request, res: Response) => {
  try {
    const { page, limit, status, search } = req.query;
    const result = await getAdminUsers({
      page: page ? parseInt(page as string) : undefined,
      limit: limit ? parseInt(limit as string) : undefined,
      status: status ? parseInt(status as string) : undefined,
      search: search as string
    });
    return res.json(apiSuccess(result));
  } catch (error: any) {
    return res.status(500).json(errorResponse(500, error.message));
  }
};

/**
 * API: Get user details by ID
 */
export const getUserDetailsApi = async (req: Request, res: Response) => {
  try {
    const data = await getAdminUserDetails(req.params.userId);
    return res.json(apiSuccess(data));
  } catch (error: any) {
    const statusCode = error.statusCode || 500;
    return res
      .status(statusCode)
      .json(errorResponse(statusCode, error.message || 'Failed to fetch user details'));
  }
};

/**
 * API: Delete user
 */
export const deleteUserApi = async (req: Request, res: Response) => {
  try {
    await deleteAdminUser(req.params.userId);
    return res.json(apiSuccess(null, 'User deleted successfully'));
  } catch (error: any) {
    const statusCode = error.statusCode || 500;
    return res
      .status(statusCode)
      .json(errorResponse(statusCode, error.message || 'Failed to delete user'));
  }
};

/**
 * API: Suspend/Unsuspend user
 */
export const suspendUserApi = async (req: Request, res: Response) => {
  try {
    const status = Number(req.body.status);
    if (isNaN(status) || (status !== 0 && status !== 1)) {
      throw new apiError(400, 'Invalid status value. Must be 0 or 1');
    }

    await toggleUserStatus(req.params.userId, status);
    const message = status === 1 ? 'User unsuspended successfully' : 'User suspended successfully';
    return res.json(apiSuccess(null, message));
  } catch (error: any) {
    const statusCode = error.statusCode || 500;
    return res
      .status(statusCode)
      .json(errorResponse(statusCode, error.message || 'Failed to update user status'));
  }
};

/**
 * API: Get all machines
 */
export const getMachinesApi = async (req: Request, res: Response) => {
  try {
    const { page, limit, status, search } = req.query;
    const result = await getAdminMachines({
      page: page ? parseInt(page as string) : undefined,
      limit: limit ? parseInt(limit as string) : undefined,
      status: status as string,
      search: search as string
    });
    return res.json(apiSuccess(result));
  } catch (error: any) {
    return res.status(500).json(errorResponse(500, error.message));
  }
};

/**
 * API: Get products in a specific machine
 */
export const getMachineProductsApi = async (req: Request, res: Response) => {
  try {
    const products = await getAdminMachineProducts(req.params.machineId);
    return res.json(apiSuccess({ products, machineId: req.params.machineId }));
  } catch (error: any) {
    const statusCode = error.statusCode || 500;
    return res
      .status(statusCode)
      .json(errorResponse(statusCode, error.message || 'Failed to fetch machine products'));
  }
};

/**
 * API: Get all products
 */
export const getProductsApi = async (req: Request, res: Response) => {
  try {
    const { page, limit, search } = req.query;
    const result = await getAdminProducts({
      page: page ? parseInt(page as string) : undefined,
      limit: limit ? parseInt(limit as string) : undefined,
      search: search as string
    });
    return res.json(apiSuccess(result));
  } catch (error: any) {
    return res.status(500).json(errorResponse(500, error.message));
  }
};

/**
 * API: Get product details
 */
export const getProductDetailsApi = async (req: Request, res: Response) => {
  try {
    const product = await getAdminProduct(req.params.productId);
    return res.json(apiSuccess({ product }));
  } catch (error: any) {
    const statusCode = error.statusCode || 500;
    return res
      .status(statusCode)
      .json(errorResponse(statusCode, error.message || 'Failed to fetch product details'));
  }
};

/**
 * API: Get all orders
 */
export const getOrdersApi = async (req: Request, res: Response) => {
  try {
    const { page, limit, status, search } = req.query;
    const result = await getAdminOrders({
      page: page ? parseInt(page as string) : undefined,
      limit: limit ? parseInt(limit as string) : undefined,
      status: status as string,
      search: search as string
    });
    return res.json(apiSuccess(result));
  } catch (error: any) {
    return res.status(500).json(errorResponse(500, error.message));
  }
};

/**
 * API: Get order details
 */
export const getOrderDetailsApi = async (req: Request, res: Response) => {
  try {
    const data = await getAdminOrder(req.params.orderId);
    return res.json(apiSuccess(data));
  } catch (error: any) {
    const statusCode = error.statusCode || 500;
    return res
      .status(statusCode)
      .json(errorResponse(statusCode, error.message || 'Failed to fetch order details'));
  }
};

/**
 * API: Get all feedback
 */
export const getFeedbackApi = async (req: Request, res: Response) => {
  try {
    const { page, limit, search } = req.query;
    const result = await getAdminFeedback({
      page: page ? parseInt(page as string) : undefined,
      limit: limit ? parseInt(limit as string) : undefined,
      search: search as string
    });
    return res.json(apiSuccess(result));
  } catch (error: any) {
    return res.status(500).json(errorResponse(500, error.message));
  }
};
