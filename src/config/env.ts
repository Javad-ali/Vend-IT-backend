/**
 * Environment Configuration
 *
 * Validates and provides typed access to environment variables.
 * Uses Zod for runtime validation with sensible defaults for development/test.
 */
import { readFileSync } from 'node:fs';
import { z } from 'zod';
const normalizeRedisUrl = (url, nodeEnv) => {
  if (!url) return url;
  if (!nodeEnv || nodeEnv === 'development' || nodeEnv === 'test') {
    try {
      const parsed = new URL(url);
      if (parsed.hostname === 'redis') {
        parsed.hostname = '127.0.0.1';
        return parsed.toString();
      }
    } catch {
      // ignore malformed URLs and keep original
    }
  }
  return url;
};
const parseServiceAccount = (value) => {
  if (!value) return null;
  let raw = value.trim();
  if (!raw) return null;
  // Allow referencing a JSON file by path prefixed with "@/path/to/file.json"
  if (raw.startsWith('@/')) {
    try {
      const filePath = raw.slice(1);
      raw = readFileSync(filePath, 'utf8');
    } catch {
      return null;
    }
  }
  if (!raw.startsWith('{')) {
    return null;
  }
  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
};
const extractFirebasePrivateKey = (value) => {
  if (!value) return value;
  let raw = value.trim();
  // If entire service-account JSON provided, parse and extract field
  if (raw.startsWith('{')) {
    try {
      const parsed = JSON.parse(raw);
      if (typeof parsed?.private_key === 'string') {
        raw = parsed.private_key;
      }
    } catch {
      // ignore malformed JSON, fall back to raw string
    }
  } else {
    // Handle values copied as `"private_key": "-----BEGIN ...`
    const match = raw.match(/"?private_key"?\s*:\s*"([^"]+)"/i);
    if (match) {
      raw = match[1];
    }
  }
  const beginIndex = raw.indexOf('-----BEGIN');
  if (beginIndex > 0) {
    raw = raw.slice(beginIndex);
  }
  return raw.replace(/\\n/g, '\n').replace(/\\r/g, '\r');
};
const sanitizeNumberEnv = (value) => {
  if (value === undefined || value === null) return undefined;
  const trimmed = value.trim();
  return trimmed.length ? trimmed : undefined;
};
const schema = z.object({
  nodeEnv: z.enum(['development', 'test', 'production']).default('development'),
  host: z.string().default('0.0.0.0'),
  port: z.coerce.number().default(3000),
  supabaseUrl: z.string().url(),
  supabaseServiceRoleKey: z.string(),
  supabaseAnonKey: z.string(),
  redisUrl: z.string(),
  jwtAccessSecret: z.string(),
  jwtRefreshSecret: z.string(),
  accessTokenTtl: z.string().default('15m'),
  refreshTokenTtl: z.string().default('30d'),
  firebaseProjectId: z.string(),
  firebaseClientEmail: z.string(),
  firebasePrivateKey: z.string(),
  tapApiBaseUrl: z.string().url(),
  tapSecretKey: z.string(),
  tapPublicKey: z.string(),
  tapDefaultCurrency: z.string().min(1),
  tapCountryCode: z.coerce.number().default(965),
  tapWebhookSecret: z.string().optional(),
  silkronWebhookSecret: z.string().optional(),
  vyroApiUrl: z.string().url().default('https://api.vyro.ai/v1/imagine/api/generations'),
  vyroApiKey: z.string().optional(),
  loyaltyBaseRate: z.coerce.number().default(10),
  loyaltyHealthyMultiplier: z.coerce.number().default(1.5),
  loyaltyLowHealthMultiplier: z.coerce.number().default(1),
  loyaltyPointValue: z.coerce.number().default(0.001),
  referralInviterPoints: z.coerce.number().default(250),
  referralInviteePoints: z.coerce.number().default(250),
  referralShareBaseUrl: z.string().url().optional(),
  referralShareMessage: z.string().optional(),
  cookieSecret: z.string(),
  // silkronBaseUrl: z.string().url(),
  // silkronApiKey: z.string(),
  // stripeSecretKey: z.string(),
  // stripeWebhookSecret: z.string(),
  emailFrom: z.string().email(),
  // supportEmail: z.string().email(),
  remoteMachineBaseUrl: z.string().url(),
  remoteMachineApiKey: z.string(),
  remoteMachinePageSize: z.coerce.number().default(100),
  dispenseSocketUrl: z.string().url().default('wss://central-6vfl.onrender.com')
});
let cachedConfig = null;
export const getConfig = () => {
  if (cachedConfig) return cachedConfig;
  const runtimeNodeEnv = process.env.VITEST ? 'test' : process.env.NODE_ENV;
  const isTest = runtimeNodeEnv === 'test';
  const isDev = !runtimeNodeEnv || runtimeNodeEnv === 'development';
  const normalizedRedisUrl = normalizeRedisUrl(process.env.REDIS_URL, runtimeNodeEnv);
  const serviceAccount = parseServiceAccount(process.env.FIREBASE_SERVICE_ACCOUNT);
  const firebaseProjectId = process.env.FIREBASE_PROJECT_ID ?? serviceAccount?.project_id;
  const firebaseClientEmail = process.env.FIREBASE_CLIENT_EMAIL ?? serviceAccount?.client_email;
  const firebasePrivateKey = extractFirebasePrivateKey(
    process.env.FIREBASE_PRIVATE_KEY ?? serviceAccount?.private_key
  );
  const parsed = schema.safeParse({
    nodeEnv: runtimeNodeEnv,
    host: process.env.HOST,
    port: sanitizeNumberEnv(process.env.PORT),
    supabaseUrl: process.env.SUPABASE_URL ?? (isTest ? 'https://stub.supabase.co' : undefined),
    supabaseServiceRoleKey:
      process.env.SUPABASE_SERVICE_ROLE_KEY ?? (isTest ? 'stub-service-role-key' : undefined),
    supabaseAnonKey: process.env.SUPABASE_ANON_KEY ?? (isTest ? 'stub-anon-key' : undefined),
    redisUrl: normalizedRedisUrl ?? (isTest || isDev ? 'memory://local' : undefined),
    jwtAccessSecret: process.env.JWT_ACCESS_SECRET ?? (isTest ? 'access-secret' : undefined),
    jwtRefreshSecret: process.env.JWT_REFRESH_SECRET ?? (isTest ? 'refresh-secret' : undefined),
    accessTokenTtl: process.env.ACCESS_TOKEN_TTL,
    refreshTokenTtl: process.env.REFRESH_TOKEN_TTL,
    firebaseProjectId: firebaseProjectId ?? (isTest ? 'test-project' : undefined),
    firebaseClientEmail: firebaseClientEmail ?? (isTest ? 'firebase@test.local' : undefined),
    firebasePrivateKey:
      firebasePrivateKey ??
      (isTest ? '-----BEGIN PRIVATE KEY-----\nTEST\n-----END PRIVATE KEY-----\n' : undefined),
    tapApiBaseUrl:
      process.env.TAP_API_BASE_URL ?? (isTest || isDev ? 'https://api.tap.company/v2' : undefined),
    tapSecretKey: process.env.TAP_SECRET_KEY ?? (isTest ? 'sk_test_REPLACE_ME' : undefined),
    tapPublicKey: process.env.TAP_PUBLIC_KEY ?? (isTest ? 'pk_test_REPLACE_ME' : undefined),
    tapDefaultCurrency: process.env.TAP_DEFAULT_CURRENCY ?? (isTest || isDev ? 'KWD' : undefined),
    tapCountryCode:
      sanitizeNumberEnv(process.env.TAP_COUNTRY_CODE) ?? (isTest || isDev ? 965 : undefined),
    tapWebhookSecret: process.env.TAP_WEBHOOK_SECRET,
    silkronWebhookSecret: process.env.SILKRON_WEBHOOK_SECRET,
    vyroApiUrl: process.env.VYRO_API_URL,
    vyroApiKey: process.env.VYRO_API_KEY ?? (isTest ? 'vyro-test-key' : undefined),
    loyaltyBaseRate: sanitizeNumberEnv(process.env.LOYALTY_BASE_RATE),
    loyaltyHealthyMultiplier: sanitizeNumberEnv(process.env.LOYALTY_HEALTHY_MULTIPLIER),
    loyaltyLowHealthMultiplier: sanitizeNumberEnv(process.env.LOYALTY_LOW_HEALTH_MULTIPLIER),
    loyaltyPointValue: sanitizeNumberEnv(process.env.LOYALTY_POINT_VALUE),
    referralInviterPoints: sanitizeNumberEnv(process.env.REFERRAL_INVITER_POINTS),
    referralInviteePoints: sanitizeNumberEnv(process.env.REFERRAL_INVITEE_POINTS),
    referralShareBaseUrl: process.env.REFERRAL_SHARE_BASE_URL,
    referralShareMessage: process.env.REFERRAL_SHARE_MESSAGE,
    emailFrom: process.env.EMAIL_FROM ?? (isTest ? 'no-reply@test.local' : undefined),
    remoteMachineBaseUrl:
      process.env.REMOTE_MACHINE_BASE_URL ?? (isTest ? 'https://example.com/rest' : undefined),
    remoteMachineApiKey:
      process.env.REMOTE_MACHINE_API_KEY ?? (isTest ? 'stub-remote-api-key' : undefined),
    remoteMachinePageSize: sanitizeNumberEnv(process.env.REMOTE_MACHINE_PAGE_SIZE),
    dispenseSocketUrl: process.env.DISPENSE_SOCKET_URL,
    cookieSecret: process.env.COOKIE_SECRET ?? (isTest ? 'test-session-secret' : undefined)
  });
  if (!parsed.success) {
    throw new Error(`Invalid environment configuration: ${parsed.error.message}`);
  }
  cachedConfig = parsed.data;
  return cachedConfig;
};
