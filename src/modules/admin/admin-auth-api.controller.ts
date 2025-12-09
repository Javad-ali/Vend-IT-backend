import jwt from 'jsonwebtoken';
import { getConfig } from '../../config/env.js';
import { authenticateAdmin, changeAdminPassword } from './admin-auth.service.js';
import { apiError, apiSuccess, errorResponse } from '../../utils/response.js';
import type { Request, Response } from 'express';

const config = getConfig();

/**
 * Generate JWT token for admin
 */
const generateAdminToken = (adminId: string, email: string, name: string | null): string => {
  return jwt.sign({ adminId, email, name }, config.jwtAccessSecret, {
    expiresIn: config.accessTokenTtl
  });
};

/**
 * API: Admin login - returns JWT token
 */
export const loginApi = async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      throw new apiError(400, 'Email and password are required');
    }

    const admin = await authenticateAdmin(email, password);
    const token = generateAdminToken(admin.id, admin.email, admin.name);

    return res.json(
      apiSuccess(
        {
          token,
          admin: {
            id: admin.id,
            email: admin.email,
            name: admin.name
          }
        },
        'Login successful'
      )
    );
  } catch (error: any) {
    const statusCode = error.statusCode || 500;
    return res.status(statusCode).json(errorResponse(statusCode, error.message || 'Login failed'));
  }
};

/**
 * API: Get current admin info
 */
export const getMeApi = async (req: Request, res: Response) => {
  try {
    // Admin info is attached by requireAdminToken middleware
    const admin = (req as any).admin;

    if (!admin) {
      throw new apiError(401, 'Not authenticated');
    }

    return res.json(
      apiSuccess({
        admin: {
          id: admin.adminId,
          email: admin.email,
          name: admin.name
        }
      })
    );
  } catch (error: any) {
    const statusCode = error.statusCode || 500;
    return res
      .status(statusCode)
      .json(errorResponse(statusCode, error.message || 'Failed to get admin info'));
  }
};

/**
 * API: Admin logout - client should delete token
 */
export const logoutApi = async (_req: Request, res: Response) => {
  return res.json(apiSuccess(null, 'Logout successful'));
};

/**
 * API: Change admin password
 */
export const changePasswordApi = async (req: Request, res: Response) => {
  try {
    const admin = (req as any).admin;
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      throw new apiError(400, 'Current password and new password are required');
    }

    if (newPassword.length < 8) {
      throw new apiError(400, 'New password must be at least 8 characters');
    }

    await changeAdminPassword(admin.adminId, currentPassword, newPassword);

    return res.json(apiSuccess(null, 'Password changed successfully'));
  } catch (error: any) {
    const statusCode = error.statusCode || 500;
    return res
      .status(statusCode)
      .json(errorResponse(statusCode, error.message || 'Failed to change password'));
  }
};
