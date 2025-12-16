# Supabase Migrations

This directory contains database migrations for the Vend-IT application.

## Migration Files (Chronological Order)

### 📦 Core Schema Migrations

#### `20251120210528_users_int_flags.sql`
- Converts boolean flags to integers (0/1) for mobile API compatibility
- Affects: is_notification, is_online, is_otp_verify
- Safe to run multiple times

#### `20251121153802_add_machine_distance.sql`
- Adds optional distance column to machine table
- Used for API responses with nearby machines
- Safe to run multiple times

#### `20251121160217_add_ratings_payments_fk.sql`
- Adds foreign key constraint linking ratings to payments
- Safe to run multiple times

#### `20251122151256_create_admins.sql`
- Creates admins table
- Seeds default admin account (admin@vendit.app)
- Safe to run multiple times (ON CONFLICT DO NOTHING)

#### `20251125125200_wallet_functions.sql`
- Creates wallet_increment() function
- Creates wallet_decrement() function with balance checking
- Fixed ambiguous column references

#### `20251126112500_fix_loyalty_function.sql`
- Creates loyalty_increment() function
- Fixed ambiguous column references in loyalty points calculation

#### `20251201_add_indexes.sql`
- ✅ **Production ready**
- Comprehensive performance indexes for:
  - Machine slots, products, payments, carts
  - Notifications, campaigns, loyalty points
  - Wallet transactions, users

### 💰 Payment & Loyalty Enhancements

#### `20251202000000_loyalty_referrals.sql`
- ✅ **Production ready**
- Adds referral system:
  - Referral codes on users table
  - Referrals tracking table with Branch.io integration
  - Referral status and metadata
- Enhances loyalty points with reason and metadata

#### `20251203000000_payments_earned_points.sql`
- Adds earned_points column to payments table
- Tracks loyalty points earned per payment

#### `20251204000000_seed_initial_data.sql`
- ✅ **Production ready**
- Seeds essential data:
  - Default categories (All, Snacks, Drinks, Healthy)
  - Static content (privacy policy, terms, FAQ)
- Safe to run multiple times

#### `20251204000001_payments_redemptions.sql`
- Adds redemption tracking:
  - redeemed_points column
  - redeemed_amount column
- Tracks loyalty point redemptions per payment

### 🗄️ Legacy/Reference Files

#### `2024-php-port.sql.backup` (renamed, not run)
- **Status**: ⚠️ Legacy - DO NOT RUN
- Full data dump from PHP/Laravel version
- Has syntax compatibility issues
- Kept for data reference only

## Running Migrations

### Option 1: Automated (Recommended)
```bash
# Development
npm run migrate

# Production
NODE_ENV=production npm run migrate
```

### Option 2: Supabase CLI
```bash
supabase db push
```

### Option 3: Manual (Supabase Dashboard)
1. Go to SQL Editor in Supabase Dashboard
2. Copy migration file content
3. Execute in order (see Migration Order below)

## Migration Order for Fresh Database

Run migrations in this exact order:

1. **Core Schema** (if starting fresh - usually already applied in production):
   ```
   supabase_schema.sql (from root directory)
   ```

2. **Essential Enhancements** (run these in order):
   ```sql
   20251120210528_users_int_flags.sql
   20251121153802_add_machine_distance.sql
   20251121160217_add_ratings_payments_fk.sql
   20251122151256_create_admins.sql
   20251125125200_wallet_functions.sql
   20251126112500_fix_loyalty_function.sql
   20251201_add_indexes.sql
   20251202000000_loyalty_referrals.sql
   20251203000000_payments_earned_points.sql
   20251204000000_seed_initial_data.sql
   20251204000001_payments_redemptions.sql
   ```

3. **Sync Products** (after migrations):
   ```bash
   curl -X POST https://your-app-url.com/api/machines/sync
   ```

## Idempotency

✅ All migrations are **idempotent** - safe to run multiple times:
- Use `CREATE TABLE IF NOT EXISTS`
- Use `ADD COLUMN IF NOT EXISTS`
- Use `CREATE INDEX IF NOT EXISTS`
- Use `ON CONFLICT DO NOTHING` for inserts

## Production Deployment Checklist

- [ ] Backup database before running migrations
- [ ] Run migrations in chronological order
- [ ] Verify all migrations completed successfully
- [ ] Run `/api/machines/sync` to populate products
- [ ] Test critical flows (authentication, payments, loyalty)
- [ ] Monitor error logs for any issues

## Notes

- **Products and Machines**: Should be synced from remote API, not manually inserted
- **Passwords**: Default admin password should be changed immediately after first login
- **Backups**: Always backup before production migrations
- **Testing**: Test migrations on staging environment first
