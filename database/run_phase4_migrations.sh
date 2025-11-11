#!/bin/bash
# Phase 4 Database Migration Runner
# Purpose: Run Phase 4 migrations on Supabase database

set -e  # Exit on error

echo "🚀 Phase 4 Database Migration"
echo "=============================="
echo ""

# Load environment variables from dashboard/.env.local
if [ -f "../dashboard/.env.local" ]; then
    source "../dashboard/.env.local"
    echo "✅ Loaded environment variables"
else
    echo "❌ Error: ../dashboard/.env.local not found"
    echo "Please ensure the dashboard .env.local file exists"
    exit 1
fi

# Check for required variables
if [ -z "$SUPABASE_URL" ] || [ -z "$SUPABASE_SERVICE_ROLE_KEY" ]; then
    echo "❌ Error: SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY not set"
    exit 1
fi

# Extract database connection details from Supabase URL
DB_HOST=$(echo $SUPABASE_URL | sed 's|https://||' | sed 's|supabase.co||' | sed 's|\.||g')
DB_NAME="postgres"
DB_USER="postgres"
DB_PORT="5432"

echo "📊 Database: $DB_HOST"
echo ""

# Option 1: Use psql if available
if command -v psql &> /dev/null; then
    echo "Using psql to run migrations..."

    read -sp "Enter Supabase database password: " DB_PASSWORD
    echo ""

    echo "Running phase4_migrations.sql..."
    PGPASSWORD=$DB_PASSWORD psql -h "db.${DB_HOST}.supabase.co" \
        -U $DB_USER \
        -d $DB_NAME \
        -p $DB_PORT \
        -f phase4_migrations.sql

    echo "Running phase4_bootstrap_voice_model.sql..."
    PGPASSWORD=$DB_PASSWORD psql -h "db.${DB_HOST}.supabase.co" \
        -U $DB_USER \
        -d $DB_NAME \
        -p $DB_PORT \
        -f phase4_bootstrap_voice_model.sql

    echo ""
    echo "✅ Migrations complete!"

# Option 2: Provide instructions for Supabase Dashboard
else
    echo "⚠️  psql not found. Use Supabase Dashboard instead:"
    echo ""
    echo "1. Go to: ${SUPABASE_URL/api./}"
    echo "2. Navigate to: SQL Editor"
    echo "3. Create new query"
    echo "4. Copy contents of: phase4_migrations.sql"
    echo "5. Run query"
    echo "6. Create another new query"
    echo "7. Copy contents of: phase4_bootstrap_voice_model.sql"
    echo "8. Run query"
    echo ""
    echo "📁 Files to run:"
    echo "   - $(pwd)/phase4_migrations.sql"
    echo "   - $(pwd)/phase4_bootstrap_voice_model.sql"
fi

echo ""
echo "🎯 Next Steps:"
echo "   1. Verify tables created: SELECT tablename FROM pg_tables WHERE schemaname = 'public' AND tablename LIKE 'email_%';"
echo "   2. Check voice model: SELECT * FROM voice_model WHERE active = true;"
echo "   3. Generate first 3 templates (A/B/C)"
echo "   4. Build n8n workflow"
