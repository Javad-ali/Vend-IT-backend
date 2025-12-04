import { afterAll, beforeAll, beforeEach } from 'vitest';
import { supabase } from '../../src/libs/supabase.js';
import { nanoid } from 'nanoid';

/**
 * Test database cleanup and setup
 */
export const TEST_USER_EMAIL = `test-${nanoid()}@example.com`;
export const TEST_PHONE = `+96550${Math.floor(Math.random() * 1000000).toString().padStart(6, '0')}`;

// Store created test data for cleanup
export const testData = {
  userIds: [] as string[],
  machineIds: [] as string[],
  paymentIds: [] as string[],
};

/**
 * Clean up test data before each test
 */
beforeEach(async () => {
  // Reset test data
  testData.userIds = [];
  testData.machineIds = [];
  testData.paymentIds = [];
});

/**
 * Clean up all test data after all tests
 */
afterAll(async () => {
  // Clean up users
  if (testData.userIds.length > 0) {
    await supabase.from('users').delete().in('id', testData.userIds);
  }

  // Clean up payments
  if (testData.paymentIds.length > 0) {
    await supabase.from('payments').delete().in('id', testData.paymentIds);
  }

  // Clean up machines (if any test data)
  if (testData.machineIds.length > 0) {
    await supabase.from('machine').delete().in('id', testData.machineIds);
  }
});

/**
 * Create a test user
 */
export const createTestUser = async (overrides?: any) => {
  const phone = overrides?.phone || TEST_PHONE;
  const email = overrides?.email || TEST_USER_EMAIL;

  const { data, error } = await supabase
    .from('users')
    .insert({
      phone_number: phone,
      email: email,
      country_code: '+965',
      password_hash: 'test-hash',
      is_otp_verify: 0,
      ...overrides,
    })
    .select()
    .single();

  if (error) throw error;
  if (data) testData.userIds.push(data.id);

  return data;
};

/**
 * Verify a test user's OTP
 */
export const verifyTestUser = async (userId: string) => {
  const { error } = await supabase
    .from('users')
    .update({ is_otp_verify: 1, otp: null })
    .eq('id', userId);

  if (error) throw error;
};

/**
 * Clean up specific user
 */
export const cleanupUser = async (userId: string) => {
  await supabase.from('users').delete().eq('id', userId);
};

/**
 * Wait for async operations
 */
export const wait = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));
