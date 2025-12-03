import 'dotenv/config';
import { readFile, readdir } from 'node:fs/promises';
import { join } from 'node:path';
import type { PostgrestError, SupabaseClient } from '@supabase/supabase-js';
import { createClient } from '@supabase/supabase-js';
import { getConfig } from '@config/env.js';
import { logger } from '@config/logger.js';

const env = getConfig();
const MIGRATIONS_DIR = join(process.cwd(), 'supabase/migrations');

const isMissingRpc = (error: PostgrestError | null, fnName: string) =>
  Boolean(
    error &&
      (error.code === 'PGRST202' ||
        error.message?.toLowerCase().includes(`could not find the function public.${fnName}`))
  );

const sanitizeMigrationSql = (sql: string) =>
  sql
    .replace(
      /SELECT\s+pg_catalog\.set_config\('search_path'\s*,\s*''\s*,\s*false\);/gi,
      "SELECT pg_catalog.set_config('search_path', 'public', false);"
    )
    .replace(/CREATE TABLE/gi, 'CREATE TABLE IF NOT EXISTS');

const runWithPostgresClient = async (sql: string) => {
  const databaseUrl = process.env.SUPABASE_DB_URL;
  if (!databaseUrl) {
    logger.warn(
      'SUPABASE_DB_URL not set. Skipping direct Postgres migration fallback. You can add it to your .env to enable this path.'
    );
    return false;
  }

  let Client: typeof import('pg')['Client'];
  try {
    ({ Client } = await import('pg'));
  } catch (error) {
    logger.error(
      { error },
      'Failed to load "pg". Install it with `npm install pg` to run migrations via SUPABASE_DB_URL.'
    );
    throw new Error('Missing dependency "pg" required for SUPABASE_DB_URL migrations.');
  }

  const client = new Client({
    connectionString: databaseUrl,
    ssl: { rejectUnauthorized: false }
  });

  await client.connect();
  const safeSql = sanitizeMigrationSql(sql);
  try {
    await client.query(safeSql);
    return true;
  } finally {
    await client.end().catch(() => undefined);
  }
};

const readMigrationFiles = async () => {
  const entries = await readdir(MIGRATIONS_DIR, { withFileTypes: true }).catch((error) => {
    throw new Error(`Unable to read migrations directory: ${error.message}`);
  });

  return entries
    .filter((entry) => entry.isFile() && entry.name.endsWith('.sql') && !entry.name.endsWith('.backup'))
    .map((entry) => ({
      name: entry.name,
      path: join(MIGRATIONS_DIR, entry.name)
    }))
    .sort((a, b) => a.name.localeCompare(b.name));
};

type ExecuteSqlPayload = { sql_text: string };

const runSingleMigration = async (
  supabase: SupabaseClient<any, 'public', any>,
  filePath: string,
  name: string
) => {
  const sql = sanitizeMigrationSql(await readFile(filePath, 'utf8'));

  logger.info({ migration: name }, 'Running Supabase migration...');
  const { error } = await supabase.rpc('execute_sql', { sql_text: sql } as ExecuteSqlPayload);
  if (!error) {
    logger.info({ migration: name }, 'Supabase migration completed (execute_sql)');
    return;
  }

  if (!isMissingRpc(error, 'execute_sql')) {
    throw error;
  }

  logger.warn(
    { migration: name },
    'Supabase RPC execute_sql not available. Falling back to direct Postgres connection via SUPABASE_DB_URL.'
  );

  const ranWithPg = await runWithPostgresClient(sql);
  if (!ranWithPg) {
    throw new Error(
      `Supabase RPC execute_sql is unavailable and SUPABASE_DB_URL fallback could not run for ${name}. ` +
        'Set SUPABASE_DB_URL and install "pg" to enable migrations.'
    );
  }

  logger.info({ migration: name }, 'Supabase migration completed via direct Postgres connection.');
};

const run = async () => {
  const files = await readMigrationFiles();
  if (!files.length) {
    logger.info('No migration files found. Nothing to run.');
    return;
  }

  logger.info({ count: files.length }, 'Found migration files');
  
  const supabase = createClient(env.supabaseUrl, env.supabaseServiceRoleKey) as SupabaseClient<any, 'public', any>;

  let successCount = 0;
  let failedCount = 0;

  for (const file of files) {
    try {
      await runSingleMigration(supabase, file.path, file.name);
      successCount++;
    } catch (error) {
      failedCount++;
      logger.error({ migration: file.name, error }, 'Migration failed');
      throw error; // Stop on first failure
    }
  }

  logger.info(
    { successCount, failedCount, total: files.length },
    '✅ All migrations completed successfully!'
  );
  logger.info('');
  logger.info('Next steps:');
  logger.info('1. Run seed script: npm run seed');
  logger.info('2. Sync products: POST /api/machines/sync');
};

run().catch((error) => {
  logger.error({ error }, 'Migration failed');
  process.exit(1);
});
