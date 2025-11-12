#!/bin/bash
# Execute Phase 4 Database Migrations via Supabase REST API
# Created: 2025-11-11

set -e # Exit on error

# Load environment variables
cd /c/claudeagents
set -a && source config/.env && set +a

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}========================================${NC}"
echo -e "${BLUE}Phase 4.2: Database Migrations${NC}"
echo -e "${BLUE}========================================${NC}"
echo ""

# Check required environment variables
if [ -z "$SUPABASE_URL_USAC" ] || [ -z "$SUPABASE_SERVICE_KEY_USAC" ]; then
    echo -e "${RED}Error: Missing Supabase credentials${NC}"
    echo "Required: SUPABASE_URL_USAC, SUPABASE_SERVICE_KEY_USAC"
    exit 1
fi

echo -e "${BLUE}Supabase URL:${NC} $SUPABASE_URL_USAC"
echo ""

# Migration files directory
MIGRATIONS_DIR="/c/claudeagents/projects/usac-rhc-automation/database"

# Function to execute SQL via Supabase REST API
execute_sql() {
    local sql_file=$1
    local description=$2

    echo -e "${BLUE}Executing:${NC} $description"
    echo -e "${BLUE}File:${NC} $sql_file"

    # Read SQL file
    SQL_CONTENT=$(cat "$sql_file")

    # Execute via Supabase REST API
    RESPONSE=$(curl -s -X POST "${SUPABASE_URL_USAC}/rest/v1/rpc/exec_sql" \
        -H "apikey: ${SUPABASE_SERVICE_KEY_USAC}" \
        -H "Authorization: Bearer ${SUPABASE_SERVICE_KEY_USAC}" \
        -H "Content-Type: application/json" \
        -H "Prefer: return=representation" \
        -d "{\"query\": $(echo "$SQL_CONTENT" | jq -Rs .)}")

    # Check for errors
    if echo "$RESPONSE" | grep -q "error"; then
        echo -e "${RED}❌ Failed${NC}"
        echo "$RESPONSE" | jq .
        return 1
    else
        echo -e "${GREEN}✅ Success${NC}"
        echo ""
        return 0
    fi
}

# Execute migrations in order
echo -e "${BLUE}Step 1/3: Creating tables and policies${NC}"
echo "----------------------------------------"
execute_sql "${MIGRATIONS_DIR}/phase4_migrations.sql" "Phase 4 Migrations (5 tables)"

echo ""
echo -e "${BLUE}Step 2/3: Bootstrapping voice model${NC}"
echo "----------------------------------------"
execute_sql "${MIGRATIONS_DIR}/phase4_bootstrap_voice_model.sql" "Voice Model v1 (Mike's patterns)"

echo ""
echo -e "${BLUE}Step 3/3: Inserting initial templates${NC}"
echo "----------------------------------------"
execute_sql "/c/claudeagents/projects/usac-rhc-automation/insert_templates_week-46-2025_direct.sql" "Week 46-2025 Templates (A/B/C)"

echo ""
echo -e "${GREEN}========================================${NC}"
echo -e "${GREEN}✅ All Migrations Complete!${NC}"
echo -e "${GREEN}========================================${NC}"
echo ""

# Verify migrations
echo -e "${BLUE}Verification Queries:${NC}"
echo "----------------------------------------"

echo -e "${BLUE}1. Check tables:${NC}"
curl -s "${SUPABASE_URL_USAC}/rest/v1/rpc/exec_sql" \
    -H "apikey: ${SUPABASE_SERVICE_KEY_USAC}" \
    -H "Authorization: Bearer ${SUPABASE_SERVICE_KEY_USAC}" \
    -H "Content-Type: application/json" \
    -d '{"query": "SELECT table_name FROM information_schema.tables WHERE table_schema = '\''public'\'' AND (table_name LIKE '\''email_%'\'' OR table_name IN ('\''weekly_performance'\'', '\''voice_model'\'')) ORDER BY table_name;"}' | jq .

echo ""
echo -e "${BLUE}2. Check voice model:${NC}"
curl -s "${SUPABASE_URL_USAC}/rest/v1/voice_model?select=version,confidence_score,training_emails_count,active&active=eq.true" \
    -H "apikey: ${SUPABASE_SERVICE_KEY_USAC}" \
    -H "Authorization: Bearer ${SUPABASE_SERVICE_KEY_USAC}" | jq .

echo ""
echo -e "${BLUE}3. Check templates:${NC}"
curl -s "${SUPABASE_URL_USAC}/rest/v1/email_templates?select=version,template_variant,contact_type,tone&version=eq.week-46-2025" \
    -H "apikey: ${SUPABASE_SERVICE_KEY_USAC}" \
    -H "Authorization: Bearer ${SUPABASE_SERVICE_KEY_USAC}" | jq .

echo ""
echo -e "${GREEN}✅ Database ready for Phase 4.2!${NC}"
echo ""
echo -e "${BLUE}Next steps:${NC}"
echo "1. Import n8n workflow: workflows/outreach_email_generation.json"
echo "2. Configure n8n credentials (Supabase, Perplexity, O365)"
echo "3. Update dashboard/.env.local with webhook URL"
echo "4. Test end-to-end email generation"
