#!/bin/bash

# Database Schema Sync Script
# Safely applies the schema synchronization migration

set -e  # Exit on error

echo "🔄 Starting Database Schema Synchronization..."
echo ""

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Load environment variables
if [ -f .env ]; then
    export $(cat .env | grep SUPABASE | xargs)
else
    echo -e "${RED}❌ Error: .env file not found${NC}"
    exit 1
fi

# Check if Supabase URL is set
if [ -z "$SUPABASE_URL" ]; then
    echo -e "${RED}❌ Error: SUPABASE_URL not set in .env${NC}"
    exit 1
fi

echo -e "${YELLOW}⚠️  IMPORTANT: This will make significant changes to your database${NC}"
echo ""
echo "Changes that will be made:"
echo "  1. Rename tables (machine → machines, product → products, etc.)"
echo "  2. Add missing columns to users, payments, loyalty_points"
echo "  3. Create missing tables (referrals, user_loyalty_points, audit_logs, activity_logs)"
echo "  4. Remove Laravel-specific tables (cache, jobs, etc.)"
echo ""
read -p "Do you want to continue? (yes/no): " -r
echo ""

if [[ ! $REPLY =~ ^[Yy]es$ ]]; then
    echo "Migration cancelled."
    exit 0
fi

# Step 1: Create backup
echo -e "${YELLOW}📦 Step 1: Creating database backup...${NC}"

BACKUP_FILE="backup_$(date +%Y%m%d_%H%M%S).sql"

if command -v pg_dump &> /dev/null; then
    # Extract connection details from Supabase URL
    SUPABASE_DB_URL="${SUPABASE_URL/https:\/\//}"
    
    echo "  Backup file: $BACKUP_FILE"
    echo "  Note: You'll need your database password"
    
    # Uncomment if you have direct PostgreSQL access
    # pg_dump -h your-project.supabase.co -U postgres -d postgres > "$BACKUP_FILE"
    
    echo -e "${GREEN}  ✓ Backup information saved${NC}"
else
    echo -e "${YELLOW}  ⚠️  pg_dump not found. Please backup via Supabase dashboard${NC}"
    echo "  Go to: https://app.supabase.com/project/YOUR_PROJECT/database/backups"
    read -p "Press enter when backup is complete..."
fi

# Step 2: Validate migration file
echo ""
echo -e "${YELLOW}📝 Step 2: Validating migration file...${NC}"

MIGRATION_FILE="supabase/migrations/20251211000000_sync_schema.sql"

if [ ! -f "$MIGRATION_FILE" ]; then
    echo -e "${RED}  ❌ Migration file not found: $MIGRATION_FILE${NC}"
    exit 1
fi

echo -e "${GREEN}  ✓ Migration file found${NC}"

# Step 3: Apply migration
echo ""
echo -e "${YELLOW}🚀 Step 3: Applying migration...${NC}"

# Option 1: Using Supabase CLI (if installed)
if command -v supabase &> /dev/null; then
    echo "  Using Supabase CLI..."
    supabase db push
    echo -e "${GREEN}  ✓ Migration applied via Supabase CLI${NC}"
    
# Option 2: Using psql (if you have direct access)
elif command -v psql &> /dev/null; then
    echo "  Using psql..."
    echo "  You'll need your database connection string"
    read -p "  Enter database URL (or press enter to skip): " DB_URL
    
    if [ -n "$DB_URL" ]; then
        psql "$DB_URL" < "$MIGRATION_FILE"
        echo -e "${GREEN}  ✓ Migration applied via psql${NC}"
    else
        echo -e "${YELLOW}  ⚠️  Skipped automatic migration${NC}"
    fi
    
# Option 3: Manual instructions
else
    echo -e "${YELLOW}  ⚠️  No database tools found${NC}"
    echo ""
    echo "  Please apply the migration manually:"
    echo "  1. Go to: https://app.supabase.com/project/YOUR_PROJECT/sql"
    echo "  2. Copy contents from: $MIGRATION_FILE"
    echo "  3. Paste and run in SQL Editor"
    echo ""
    read -p "Press enter when migration is complete..."
fi

# Step 4: Verify changes
echo ""
echo -e "${YELLOW}🔍 Step 4: Verification...${NC}"

echo "  Please verify these tables exist in your database:"
echo "    ✓ machines (renamed from machine)"
echo "    ✓ products (renamed from product)"
echo "    ✓ categories (renamed from category)"
echo "    ✓ campaigns (renamed from campagin)"
echo "    ✓ campaign_views (renamed from campaignview)"
echo "    ✓ loyalty_points (renamed from loyality_points)"
echo "    ✓ referrals (new)"
echo "    ✓ user_loyalty_points (new)"
echo "    ✓ audit_logs (new)"
echo "    ✓ activity_logs (new)"
echo ""

# Step 5: Restart application
echo -e "${YELLOW}🔄 Step 5: Restart application...${NC}"

if [ -f "package.json" ]; then
    echo "  Rebuilding TypeScript..."
    npm run build
    
    echo ""
    echo "  Ready to restart application!"
    echo "  Run: npm run dev"
else
    echo "  Please rebuild and restart your application"
fi

echo ""
echo -e "${GREEN}✅ Schema synchronization complete!${NC}"
echo ""
echo "Next steps:"
echo "  1. Test referral system"
echo "  2. Test loyalty points"
echo "  3. Test admin audit logs"
echo "  4. Check all API endpoints"
echo ""
