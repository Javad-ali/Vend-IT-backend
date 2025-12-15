/**
 * Audit logging utility for tracking sensitive operations
 */
import type { Request } from 'express';
import { supabase } from '../libs/supabase.js';
import { logger } from '../config/logger.js';
import type { AuditAction } from '../types/entities.js';

interface AuditLogEntry {
  action: AuditAction;
  userId?: string | null;
  adminId?: string | null;
  resourceType: string;
  resourceId?: string | null;
  details?: Record<string, unknown> | null;
  ipAddress?: string | null;
  userAgent?: string | null;
}

/**
 * Extract client information from Express request
 */
const getClientInfo = (req?: Request) => {
  if (!req) {
    return { ipAddress: null, userAgent: null };
  }

  // Handle proxied requests (X-Forwarded-For)
  const forwardedFor = req.headers['x-forwarded-for'];
  const ipAddress = Array.isArray(forwardedFor)
    ? forwardedFor[0]
    : typeof forwardedFor === 'string'
      ? forwardedFor.split(',')[0].trim()
      : (req.socket?.remoteAddress ?? null);

  const userAgent = req.headers['user-agent'] ?? null;

  return { ipAddress, userAgent };
};

/**
 * Create an audit log entry
 */
export const auditLog = async (entry: AuditLogEntry, req?: Request): Promise<void> => {
  const { ipAddress, userAgent } = getClientInfo(req);

  // Convert adminId to number for BIGINT column
  let adminIdNum: number | null = null;
  if (entry.adminId) {
    const parsed = parseInt(entry.adminId, 10);
    adminIdNum = isNaN(parsed) ? null : parsed;
  }

  const logEntry = {
    action: entry.action,
    user_id: entry.userId ?? null,
    admin_id: adminIdNum,
    resource_type: entry.resourceType,
    resource_id: entry.resourceId ?? null,
    details: entry.details ?? null,
    ip_address: entry.ipAddress ?? ipAddress,
    user_agent: entry.userAgent ?? userAgent,
    created_at: new Date().toISOString()
  };

  // Log to structured logger first (always succeeds)
  logger.info(
    {
      audit: {
        action: entry.action,
        resourceType: entry.resourceType,
        resourceId: entry.resourceId,
        userId: entry.userId,
        adminId: entry.adminId
      }
    },
    `Audit: ${entry.action}`
  );

  // Attempt to persist to database (non-blocking)
  try {
    const { error } = await supabase.from('audit_logs').insert(logEntry);
    if (error) {
      logger.error({ error, entry: logEntry }, 'Failed to persist audit log');
    } else {
      logger.debug({ entry: logEntry }, 'Audit log persisted successfully');
    }
  } catch (err) {
    logger.error({ err, entry: logEntry }, 'Audit log database error');
  }
};

/**
 * Convenience methods for common audit actions
 */
export const audit = {
  // User actions
  userCreated: (userId: string, details?: Record<string, unknown>, req?: Request) =>
    auditLog(
      { action: 'user.created', userId, resourceType: 'user', resourceId: userId, details },
      req
    ),

  userUpdated: (userId: string, details?: Record<string, unknown>, req?: Request) =>
    auditLog(
      { action: 'user.updated', userId, resourceType: 'user', resourceId: userId, details },
      req
    ),

  userDeleted: (userId: string, details?: Record<string, unknown>, req?: Request) =>
    auditLog(
      { action: 'user.deleted', userId, resourceType: 'user', resourceId: userId, details },
      req
    ),

  userLogin: (userId: string, req?: Request) =>
    auditLog({ action: 'user.login', userId, resourceType: 'user', resourceId: userId }, req),

  userLogout: (userId: string, req?: Request) =>
    auditLog({ action: 'user.logout', userId, resourceType: 'user', resourceId: userId }, req),

  // Payment actions
  paymentCreated: (
    userId: string,
    paymentId: string,
    details?: Record<string, unknown>,
    req?: Request
  ) =>
    auditLog(
      {
        action: 'payment.created',
        userId,
        resourceType: 'payment',
        resourceId: paymentId,
        details
      },
      req
    ),

  paymentRefunded: (
    userId: string,
    paymentId: string,
    details?: Record<string, unknown>,
    req?: Request
  ) =>
    auditLog(
      {
        action: 'payment.refunded',
        userId,
        resourceType: 'payment',
        resourceId: paymentId,
        details
      },
      req
    ),

  // Card actions
  cardAdded: (userId: string, cardId: string, req?: Request) =>
    auditLog({ action: 'card.added', userId, resourceType: 'card', resourceId: cardId }, req),

  cardDeleted: (userId: string, cardId: string, req?: Request) =>
    auditLog({ action: 'card.deleted', userId, resourceType: 'card', resourceId: cardId }, req),

  // Wallet actions
  walletCharged: (
    userId: string,
    amount: number,
    details?: Record<string, unknown>,
    req?: Request
  ) =>
    auditLog(
      { action: 'wallet.charged', userId, resourceType: 'wallet', details: { amount, ...details } },
      req
    ),

  walletPaid: (userId: string, amount: number, paymentId: string, req?: Request) =>
    auditLog(
      {
        action: 'wallet.paid',
        userId,
        resourceType: 'wallet',
        resourceId: paymentId,
        details: { amount }
      },
      req
    ),

  // Admin actions
  adminLogin: (adminId: string, email: string, req?: Request) =>
    auditLog(
      {
        action: 'admin.login',
        adminId,
        resourceType: 'admin',
        resourceId: adminId,
        details: { email, admin_name: email.split('@')[0] } // Use email prefix as fallback name
      },
      req
    ),

  adminLogout: (adminId: string, req?: Request) =>
    auditLog({ action: 'admin.logout', adminId, resourceType: 'admin', resourceId: adminId, details: { admin_name: 'Admin' } }, req),

  adminAction: (
    adminId: string,
    resourceType: string,
    resourceId: string,
    details?: Record<string, unknown>,
    req?: Request
  ) => auditLog({ action: 'admin.action', adminId, resourceType, resourceId, details: { admin_name: 'Admin', ...details } }, req),

  // Machine actions
  machineSynced: (count: number, req?: Request) =>
    auditLog({ action: 'machine.synced', resourceType: 'machine', details: { count } }, req),

  dispenseTriggered: (userId: string, machineId: string, slotNumber: string, req?: Request) =>
    auditLog(
      {
        action: 'dispense.triggered',
        userId,
        resourceType: 'dispense',
        resourceId: machineId,
        details: { slotNumber }
      },
      req
    ),

  dispenseCompleted: (
    userId: string,
    machineId: string,
    paymentId: string,
    details?: Record<string, unknown>,
    req?: Request
  ) =>
    auditLog(
      {
        action: 'dispense.completed',
        userId,
        resourceType: 'dispense',
        resourceId: paymentId,
        details: { machineId, ...details }
      },
      req
    )
};

export default audit;
