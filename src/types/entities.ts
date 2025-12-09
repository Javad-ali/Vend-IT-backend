/**
 * Database entity type definitions for Vend-IT
 * These types match the Supabase database schema
 */

// ============================================================================
// User Types
// ============================================================================

export interface User {
  id: string;
  email: string | null;
  first_name: string | null;
  last_name: string | null;
  phone_number: string;
  country_code: string | null;
  country: string | null;
  dob: string | null;
  age: number | null;
  address: string | null;
  latitude: number | null;
  longitude: number | null;
  user_profile: string | null;
  device_token: string | null;
  device_type: string | null;
  is_otp_verify: number;
  is_notification: number;
  is_online: number;
  status: number;
  otp: string | null;
  tap_customer_id: string | null;
  referral_code: string | null;
  referrer_user_id: string | null;
  referral_rewarded_at: string | null;
  user_socket_token: string | null;
  user_chat_token: string | null;
  video_url: string | null;
  created_at: string;
  updated_at: string;
}

export interface UserCreatePayload {
  email?: string | null;
  first_name?: string | null;
  last_name?: string | null;
  phone_number: string;
  country_code?: string | null;
  country?: string | null;
  device_token?: string | null;
  device_type?: string | null;
  is_otp_verify?: boolean | number;
  is_notification?: boolean | number;
  status?: number;
  otp?: string | null;
}

export interface UserUpdatePayload {
  email?: string | null;
  first_name?: string | null;
  last_name?: string | null;
  country_code?: string | null;
  country?: string | null;
  dob?: string | null;
  address?: string | null;
  latitude?: number | null;
  longitude?: number | null;
  user_profile?: string | null;
  device_token?: string | null;
  device_type?: string | null;
  is_otp_verify?: boolean | number;
  is_notification?: boolean | number;
  is_online?: boolean | number;
  status?: number;
  otp?: string | null;
  tap_customer_id?: string | null;
  referral_code?: string | null;
  referrer_user_id?: string | null;
  referral_rewarded_at?: string | null;
  updated_at?: string;
}

// ============================================================================
// Machine Types
// ============================================================================

export interface Machine {
  id: number;
  u_id: string;
  machine_tag: string;
  serial_number: string | null;
  location_latitude: number | null;
  location_longitude: number | null;
  location_address: string | null;
  machine_image_url: string | null;
  status: string | null;
  distance?: number;
  created_at: string;
  updated_at: string;
}

export interface MachineSlot {
  id: number;
  machine_u_id: string;
  slot_number: string;
  product_u_id: string | null;
  quantity: number;
  max_quantity: number;
  price: number | null;
  product?: Product | null;
  created_at: string;
  updated_at: string;
}

// ============================================================================
// Product Types
// ============================================================================

export interface Product {
  id: number;
  product_u_id: string;
  vendor_part_no: string | null;
  category_id: string | null;
  brand_name: string | null;
  description: string | null;
  unit_price: number | null;
  product_image_url: string | null;
  metadata: ProductMetadata | null;
  created_at: string;
  updated_at: string;
}

export interface ProductMetadata {
  health_rating?: number;
  healthRating?: number;
  calories?: number;
  ingredients?: string[];
  allergens?: string[];
  [key: string]: unknown;
}

export interface Category {
  id: string;
  category_name: string;
  description: string | null;
  image_url: string | null;
  created_at: string;
}

// ============================================================================
// Cart Types
// ============================================================================

export interface CartItem {
  id: string;
  user_id: string;
  machine_u_id: string;
  slot_number: string;
  product_u_id: string | null;
  quantity: number;
  created_at: string;
  updated_at: string;
}

export interface CartItemPayload {
  machineId: string;
  slotNumber: string;
  quantity: number;
}

// ============================================================================
// Payment Types
// ============================================================================

export interface Payment {
  id: string;
  user_id: string;
  machine_u_id: string | null;
  transaction_id: string;
  charge_id: string | null;
  tap_customer_id: string | null;
  payment_method: PaymentMethod;
  status: PaymentStatus;
  amount: number;
  earned_points: number | null;
  redeemed_points: number | null;
  redeemed_amount: number | null;
  created_at: string;
  updated_at: string;
}

export type PaymentMethod = 'CARD' | 'WALLET' | 'GPay' | 'ApplePay' | 'LOYALTY';
export type PaymentStatus = 'PENDING' | 'PAID' | 'CAPTURED' | 'FAILED' | 'REFUNDED';

export interface PaymentProduct {
  id: string;
  payment_id: string;
  product_u_id: string;
  quantity: number;
  dispensed_quantity: number;
  created_at: string;
}

export interface PaymentCreatePayload {
  userId: string;
  machineUId?: string | null;
  transactionId: string;
  paymentMethod: PaymentMethod;
  status: PaymentStatus;
  amount: number;
  chargeId?: string | null;
  tapCustomerId?: string | null;
}

// ============================================================================
// Wallet & Loyalty Types
// ============================================================================

export interface Wallet {
  id: string;
  user_id: string;
  balance: number;
  created_at: string;
  updated_at: string;
}

export interface WalletTransaction {
  id: string;
  wallet_id: string;
  user_id: string;
  payment_id: string | null;
  type: 'Credit' | 'Debit';
  amount: number;
  created_at: string;
}

export interface LoyaltyEntry {
  id: string;
  user_id: string;
  payment_id: string | null;
  points: number;
  type: 'Credit' | 'Debit';
  reason: LoyaltyReason;
  metadata: Record<string, unknown> | null;
  created_at: string;
}

export type LoyaltyReason = 'purchase' | 'redeem' | 'referral' | 'bonus' | 'adjustment';

// ============================================================================
// Notification Types
// ============================================================================

export interface Notification {
  id: string;
  user_id: string;
  title: string;
  body: string;
  type: NotificationType;
  data: Record<string, unknown> | null;
  is_read: boolean;
  created_at: string;
}

export type NotificationType =
  | 'PaymentSuccess'
  | 'PaymentFailed'
  | 'DispenseUpdate'
  | 'Refund'
  | 'Promotion'
  | 'System'
  | 'Referral';

export interface NotificationPayload {
  receiverId: string;
  title: string;
  body: string;
  type: NotificationType;
  data?: Record<string, unknown>;
}

// ============================================================================
// Campaign Types
// ============================================================================

export interface Campaign {
  id: string;
  title: string;
  description: string | null;
  image_url: string | null;
  start_date: string;
  end_date: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

// ============================================================================
// Feedback Types
// ============================================================================

export interface Rating {
  id: string;
  user_id: string;
  payment_id: string | null;
  machine_u_id: string | null;
  rating: number;
  comment: string | null;
  created_at: string;
}

export interface ContactMessage {
  id: string;
  user_id: string;
  email: string;
  subject: string;
  message: string;
  created_at: string;
}

// ============================================================================
// Admin Types
// ============================================================================

export interface Admin {
  id: string;
  email: string;
  password_hash: string;
  name: string | null;
  role: AdminRole;
  is_active: boolean;
  last_login_at: string | null;
  created_at: string;
  updated_at: string;
}

export type AdminRole = 'super_admin' | 'admin' | 'operator' | 'viewer';

// ============================================================================
// Referral Types
// ============================================================================

export interface Referral {
  id: string;
  inviter_user_id: string;
  invitee_user_id: string;
  inviter_points: number;
  invitee_points: number;
  rewarded_at: string;
  created_at: string;
}

// ============================================================================
// Audit Log Types
// ============================================================================

export interface AuditLog {
  id: string;
  action: AuditAction;
  user_id: string | null;
  admin_id: string | null;
  resource_type: string;
  resource_id: string | null;
  details: Record<string, unknown> | null;
  ip_address: string | null;
  user_agent: string | null;
  created_at: string;
}

export type AuditAction =
  | 'user.created'
  | 'user.updated'
  | 'user.deleted'
  | 'user.login'
  | 'user.logout'
  | 'payment.created'
  | 'payment.refunded'
  | 'card.added'
  | 'card.deleted'
  | 'wallet.charged'
  | 'wallet.paid'
  | 'admin.login'
  | 'admin.logout'
  | 'admin.action'
  | 'machine.synced'
  | 'dispense.triggered'
  | 'dispense.completed';

// ============================================================================
// API Response Types
// ============================================================================

export interface ApiResponse<T = unknown> {
  status: number;
  message: string;
  data?: T;
  meta?: Record<string, unknown>;
}

export interface PaginatedResponse<T> extends ApiResponse<T[]> {
  meta: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export interface ApiErrorResponse {
  status: number;
  message: string;
  details?: unknown;
  errors?: Array<{
    path: string[];
    message: string;
  }>;
}

// ============================================================================
// Request Types (Express extensions)
// ============================================================================

export interface AuthenticatedUser {
  id: string;
  email: string | null;
}

declare global {
  namespace Express {
    interface Request {
      user?: AuthenticatedUser;
      rawBody?: Buffer;
    }
    interface Session {
      admin?: {
        id: string;
        email: string;
        name: string | null;
        role: AdminRole;
      };
    }
  }
}

// ============================================================================
// Service Input Types
// ============================================================================

export interface RegisterInput {
  firstName?: string;
  lastName?: string;
  email?: string;
  country?: string;
  countryCode: string;
  phoneNumber: string;
  deviceType?: string;
  deviceToken?: string;
}

export interface LoginInput {
  countryCode: string;
  phoneNumber: string;
  deviceType?: string;
  deviceToken?: string;
}

export interface OtpVerifyInput {
  otp: string;
  deviceType?: string;
  deviceToken?: string;
  latitude?: string;
  longitude?: string;
  referralCode?: string;
  referrerId?: string;
  branchIdentity?: string;
  branchInstallId?: string;
}

export interface CardPaymentInput {
  cardId: string;
  customerId?: string;
  amount: number;
  machineId: string;
  products: CartProductItem[];
  pointsToRedeem?: number;
}

export interface CartProductItem {
  productId: string;
  quantity: number;
}

export interface RedemptionResult {
  requestedPoints: number;
  pointsRedeemed: number;
  redeemValue: number;
  payableAmount: number;
}
