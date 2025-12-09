/**
 * Type exports for Vend-IT Backend
 *
 * Import types from this file for better organization:
 * import type { User, Payment, Machine } from '../types/index.js';
 */

// Entity types
export type {
  User,
  UserCreatePayload,
  UserUpdatePayload,
  Machine,
  MachineSlot,
  Product,
  ProductMetadata,
  Category,
  CartItem,
  CartItemPayload,
  Payment,
  PaymentMethod,
  PaymentStatus,
  PaymentProduct,
  PaymentCreatePayload,
  Wallet,
  WalletTransaction,
  LoyaltyEntry,
  LoyaltyReason,
  Notification,
  NotificationType,
  NotificationPayload,
  Campaign,
  Rating,
  ContactMessage,
  Admin,
  AdminRole,
  Referral,
  AuditLog,
  AuditAction
} from './entities.js';

// API types
export type {
  ApiResponse,
  PaginatedResponse,
  ApiErrorResponse,
  AuthenticatedUser
} from './entities.js';

// Service input types
export type {
  RegisterInput,
  LoginInput,
  OtpVerifyInput,
  CardPaymentInput,
  CartProductItem,
  RedemptionResult
} from './entities.js';
