import 'dotenv/config';
import { createClient } from '@supabase/supabase-js';
import { getConfig } from '../src/config/env.js';
import { logger } from '../src/config/logger.js';

const env = getConfig();

/**
 * Seed essential data for Vend-IT application
 * This script populates:
 * - Default categories
 * - Default admin (if not exists)
 * - Static content (privacy policy, terms, etc.)
 */
const seedData = async () => {
  const supabase = createClient(env.supabaseUrl, env.supabaseServiceRoleKey);

  logger.info('Starting database seeding...');

  try {
    // Seed categories
    logger.info('Seeding categories...');
    const { error: categoryError } = await supabase
      .from('category')
      .upsert(
        [
          { category_name: 'All', description: 'All Products' },
          { category_name: 'Snacks', description: 'Snack items' },
          { category_name: 'Drinks', description: 'Beverages' },
          { category_name: 'Healthy', description: 'Healthy options' }
        ],
        { onConflict: 'category_name', ignoreDuplicates: true }
      );

    if (categoryError) {
      logger.error({ error: categoryError }, 'Failed to seed categories');
    } else {
      logger.info('Categories seeded successfully');
    }

    // Seed static content
    logger.info('Seeding static content...');
    const { error: contentError } = await supabase
      .from('static_content')
      .upsert(
        [
          {
            privacy_policy: 'Your privacy is important to us...',
            terms_and_conditions: 'By using Vend-IT, you agree to...',
            faq: 'Frequently Asked Questions...'
          }
        ],
        { onConflict: 'id', ignoreDuplicates: true }
      );

    if (contentError) {
      logger.error({ error: contentError }, 'Failed to seed static content');
    } else {
      logger.info('Static content seeded successfully');
    }

    logger.info('✅ Database seeding completed successfully!');
    logger.info('');
    logger.info('Next steps:');
    logger.info('1. Start your server: npm run dev');
    logger.info('2. Sync products from remote API: POST /api/machines/sync');
  } catch (error) {
    logger.error({ error }, 'Seeding failed');
    process.exit(1);
  }
};

seedData();
