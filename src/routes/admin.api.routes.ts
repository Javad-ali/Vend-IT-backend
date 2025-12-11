import { Router } from 'express';
import { requireAdminToken } from '../middleware/admin-auth-api.js';
import {
  loginApi,
  getMeApi,
  logoutApi,
  changePasswordApi
} from '../modules/admin/admin-auth-api.controller.js';
import {
  getDashboardApi,
  getUsersApi,
  getUserDetailsApi,
  deleteUserApi,
  suspendUserApi,
  getMachinesApi,
  getMachineProductsApi,
  getProductsApi,
  getProductDetailsApi,
  getOrdersApi,
  getOrderDetailsApi,
  getFeedbackApi
} from '../modules/admin/admin.api.controller.js';

import { getChartDataApi } from '../modules/admin/admin-chart-data.api.controller.js';
import { getActivityLogsApi } from '../modules/admin/admin-activity.api.controller.js';
import {
  getNotificationsApi,
  markAsReadApi,
  markAllAsReadApi
} from '../modules/admin/admin-notifications.api.controller.js';

import {
  getCampaignsApi,
  getCampaignByIdApi,
  createCampaignApi,
  updateCampaignApi,
  deleteCampaignApi,
  campaignUploadMiddleware
} from '../modules/campaigns/campaigns.api.controller.js';
import {
  getProfileApi,
  updateProfileApi,
  getCategoriesApi,
  getCategoryByIdApi,
  getCategoryProductsApi,
  createCategoryApi,
  updateCategoryApi,
  avatarUploadMiddleware,
  categoryUploadMiddleware
} from '../modules/admin/admin.profile.api.controller.js';
import { getContentApi, updateContentApi } from '../modules/content/content.api.controller.js';
import { generateImageApi } from '../modules/admin/admin.legacy.api.controller.js';
import { generateMachineQr } from '../modules/machines/machines.qr.service.js';

const router = Router();

// =============================================================================
// Authentication Routes (no token required)
// =============================================================================
router.post('/auth/login', loginApi);

// =============================================================================
// Protected Routes (require JWT token)
// =============================================================================
router.use(requireAdminToken); // All routes below require authentication

// Authentication
router.get('/auth/me', getMeApi);
router.post('/auth/logout', logoutApi);
router.put('/auth/change-password', changePasswordApi);

// Dashboard
router.get('/dashboard', getDashboardApi);
router.get('/dashboard/charts', getChartDataApi);

// Users
router.get('/users', getUsersApi);
router.get('/users/:userId', getUserDetailsApi);
router.delete('/users/:userId', deleteUserApi);
router.post('/users/:userId/suspend', suspendUserApi);

// Machines
router.get('/machines', getMachinesApi);
router.get('/machines/:machineId/products', getMachineProductsApi);
router.post('/machines/:machineId/qr', async (req, res) => {
  try {
    await generateMachineQr(req.params.machineId);
    return res.json({ success: true, message: 'QR code regenerated' });
  } catch (error: any) {
    return res.status(500).json({ success: false, message: error.message });
  }
});

// Products
router.get('/products', getProductsApi);
router.get('/products/:productId', getProductDetailsApi);

// Orders
router.get('/orders', getOrdersApi);
router.get('/orders/:orderId', getOrderDetailsApi);

// Campaigns
router.get('/campaigns', getCampaignsApi);
router.get('/campaigns/:campaignId', getCampaignByIdApi);
router.post('/campaigns', campaignUploadMiddleware, createCampaignApi);
router.put('/campaigns/:campaignId', campaignUploadMiddleware, updateCampaignApi);
router.delete('/campaigns/:campaignId', deleteCampaignApi);

// Categories
router.get('/categories', getCategoriesApi);
router.get('/categories/:categoryId', getCategoryByIdApi);
router.get('/categories/:categoryId/products', getCategoryProductsApi);
router.post('/categories', categoryUploadMiddleware, createCategoryApi);
router.put('/categories/:categoryId', categoryUploadMiddleware, updateCategoryApi);

// Feedback
router.get('/feedback', getFeedbackApi);

// Content
router.get('/content', getContentApi);
router.put('/content', updateContentApi);

// Profile
router.get('/profile', getProfileApi);
router.put('/profile', avatarUploadMiddleware, updateProfileApi);

// Activity Logs
router.get('/activity-logs', getActivityLogsApi);

// Notifications
router.get('/notifications', getNotificationsApi);
router.post('/notifications/:id/read', markAsReadApi);
router.post('/notifications/mark-all-read', markAllAsReadApi);

// Legacy Tools
router.post('/legacy/text-to-image', generateImageApi);

export default router;
