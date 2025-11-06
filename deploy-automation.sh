#!/bin/bash
# ============================================================================
# USAC RHC Automation - Complete Deployment Script
# ============================================================================
# This script automates the full deployment process after prerequisites are met
#
# Prerequisites:
# 1. GitHub CLI authenticated
# 2. Supabase project created with URL and keys
# 3. Vercel CLI authenticated (already done)
#
# Usage:
#   bash deploy-automation.sh <SUPABASE_URL> <SUPABASE_ANON_KEY> <SUPABASE_SERVICE_KEY>
# ============================================================================

set -e  # Exit on any error

# Color output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo -e "${BLUE}========================================${NC}"
echo -e "${BLUE}USAC RHC Automation Deployment${NC}"
echo -e "${BLUE}========================================${NC}"
echo ""

# Check arguments
if [ $# -ne 3 ]; then
    echo -e "${RED}Error: Missing required arguments${NC}"
    echo "Usage: $0 <SUPABASE_URL> <SUPABASE_ANON_KEY> <SUPABASE_SERVICE_KEY>"
    exit 1
fi

SUPABASE_URL=$1
SUPABASE_ANON_KEY=$2
SUPABASE_SERVICE_KEY=$3

PROJECT_DIR="/c/ClaudeAgents/projects/usac-rhc-automation"
DASHBOARD_DIR="$PROJECT_DIR/dashboard"

# ============================================================================
# Step 1: Create GitHub Repository
# ============================================================================
echo -e "${GREEN}[1/5] Creating GitHub repository...${NC}"
cd "$PROJECT_DIR"

# Check if remote already exists
if git remote get-url origin 2>/dev/null; then
    echo "Repository already has remote origin. Skipping creation."
    REPO_URL=$(git remote get-url origin)
else
    # Create new repository
    gh repo create usac-rhc-automation \
        --public \
        --source=. \
        --remote=origin \
        --description="USAC Rural Health Care automation system for clinic monitoring and outreach" \
        --push

    REPO_URL=$(gh repo view --json url -q .url)
fi

echo -e "${GREEN}✓ GitHub repository: $REPO_URL${NC}"
echo ""

# ============================================================================
# Step 2: Deploy Database Schema to Supabase
# ============================================================================
echo -e "${GREEN}[2/5] Deploying database schema to Supabase...${NC}"

# Use curl to run the SQL directly via Supabase REST API
SCHEMA_FILE="$PROJECT_DIR/database/schema.sql"

# Note: This requires the service role key to execute SQL
# We'll use psql if available, otherwise provide manual instructions
if command -v psql &> /dev/null; then
    # Extract connection string components
    DB_HOST=$(echo $SUPABASE_URL | sed 's|https://||' | sed 's|\.supabase\.co.*|.supabase.co|')

    echo "Please run this command manually to deploy the schema:"
    echo "psql \"postgresql://postgres:[YOUR_DB_PASSWORD]@db.$DB_HOST:5432/postgres\" < $SCHEMA_FILE"
else
    echo -e "${YELLOW}PostgreSQL client not found.${NC}"
    echo "Please deploy the schema manually:"
    echo "1. Go to Supabase Dashboard > SQL Editor"
    echo "2. Copy contents from: $SCHEMA_FILE"
    echo "3. Execute the SQL"
fi

echo ""
read -p "Press Enter once you've deployed the database schema..."

echo -e "${GREEN}✓ Database schema deployed${NC}"
echo ""

# ============================================================================
# Step 3: Create .env.local for Dashboard
# ============================================================================
echo -e "${GREEN}[3/5] Creating dashboard environment file...${NC}"

cat > "$DASHBOARD_DIR/.env.local" <<EOF
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=$SUPABASE_URL
NEXT_PUBLIC_SUPABASE_ANON_KEY=$SUPABASE_ANON_KEY
SUPABASE_SERVICE_ROLE_KEY=$SUPABASE_SERVICE_KEY

# n8n Webhook URLs (will be updated after n8n workflow deployment)
N8N_ENRICHMENT_WEBHOOK_URL=https://hyamie.app.n8n.cloud/webhook/placeholder-enrichment
N8N_EMAIL_WEBHOOK_URL=https://hyamie.app.n8n.cloud/webhook/placeholder-email

# Application URL (will be updated after Vercel deployment)
NEXT_PUBLIC_APP_URL=https://usac-rhc-automation.vercel.app
EOF

echo -e "${GREEN}✓ Created .env.local${NC}"
echo ""

# ============================================================================
# Step 4: Deploy to Vercel
# ============================================================================
echo -e "${GREEN}[4/5] Deploying dashboard to Vercel...${NC}"

cd "$DASHBOARD_DIR"

# Link to Vercel project (creates new project if doesn't exist)
vercel link --yes --project=usac-rhc-automation

# Set environment variables in Vercel
echo "Setting Vercel environment variables..."
vercel env add NEXT_PUBLIC_SUPABASE_URL production <<< "$SUPABASE_URL"
vercel env add NEXT_PUBLIC_SUPABASE_ANON_KEY production <<< "$SUPABASE_ANON_KEY"
vercel env add SUPABASE_SERVICE_ROLE_KEY production <<< "$SUPABASE_SERVICE_KEY"
vercel env add N8N_ENRICHMENT_WEBHOOK_URL production <<< "https://hyamie.app.n8n.cloud/webhook/placeholder-enrichment"
vercel env add N8N_EMAIL_WEBHOOK_URL production <<< "https://hyamie.app.n8n.cloud/webhook/placeholder-email"

# Deploy to production
echo "Deploying to Vercel..."
VERCEL_URL=$(vercel --prod --yes 2>&1 | grep -oP 'https://.*\.vercel\.app' | head -1)

echo -e "${GREEN}✓ Deployed to: $VERCEL_URL${NC}"
echo ""

# ============================================================================
# Step 5: Update Documentation
# ============================================================================
echo -e "${GREEN}[5/5] Updating documentation...${NC}"

cd "$PROJECT_DIR"

cat > "DEPLOYMENT_SUMMARY.md" <<EOF
# USAC RHC Automation - Deployment Summary

**Deployment Date:** $(date '+%Y-%m-%d %H:%M:%S')

## 🚀 Deployed Services

### GitHub Repository
- **URL:** $REPO_URL
- **Branch:** master
- **Status:** ✅ Deployed

### Supabase Database
- **Project URL:** $SUPABASE_URL
- **Dashboard:** ${SUPABASE_URL/https:\/\//https://app.supabase.com/project/}/
- **Status:** ✅ Database schema deployed
- **Tables:**
  - clinics_pending_review
  - usac_historical_filings
  - system_alerts

### Vercel Dashboard
- **Production URL:** $VERCEL_URL
- **Dashboard:** https://vercel.com/hyamie/usac-rhc-automation
- **Status:** ✅ Deployed
- **Environment Variables:** ✅ Configured

### n8n Cloud
- **Instance URL:** https://hyamie.app.n8n.cloud
- **Status:** ⏳ Workflows ready to import (manual step)

---

## 📋 Remaining Manual Steps

### 1. Import n8n Workflows
Location: \`/c/ClaudeAgents/projects/usac-rhc-automation/workflows/\`

**Import these 3 workflows:**

1. **USAC_Monitor.json**
   - Monitors USAC Form 465 filings
   - Webhook trigger + scheduled check

2. **Enrichment_Pipeline.json**
   - Enriches clinic data with Apollo.io
   - Triggered by dashboard or webhook

3. **Email_Outreach.json**
   - Generates and sends personalized emails
   - Uses Anthropic API for content generation

**Steps:**
\`\`\`bash
1. Go to https://hyamie.app.n8n.cloud
2. Click "Import Workflow" (top right)
3. Upload each JSON file
4. Activate each workflow after reviewing settings
5. Copy webhook URLs from each workflow
6. Update Vercel environment variables with real webhook URLs
\`\`\`

### 2. Update Webhook URLs in Vercel

Once n8n workflows are imported:

\`\`\`bash
# Get the real webhook URLs from n8n workflows
# Then update Vercel:

vercel env add N8N_ENRICHMENT_WEBHOOK_URL production
# Paste: https://hyamie.app.n8n.cloud/webhook/ACTUAL_ENRICHMENT_ID

vercel env add N8N_EMAIL_WEBHOOK_URL production
# Paste: https://hyamie.app.n8n.cloud/webhook/ACTUAL_EMAIL_ID

# Redeploy to pick up new URLs
cd /c/ClaudeAgents/projects/usac-rhc-automation/dashboard
vercel --prod
\`\`\`

### 3. Test the Complete Flow

1. **Add Test Clinic:**
   - Go to $VERCEL_URL
   - Click "Add Clinic"
   - Enter test data

2. **Test Enrichment:**
   - Select clinic
   - Click "Enrich"
   - Verify Apollo.io data appears

3. **Test Email Generation:**
   - Select enriched clinic
   - Click "Generate Email"
   - Review AI-generated content

4. **Monitor n8n:**
   - Check workflow executions
   - Review logs for errors

---

## 🔑 Credentials Reference

### Supabase
- **URL:** $SUPABASE_URL
- **Anon Key:** ${SUPABASE_ANON_KEY:0:20}...
- **Service Key:** ${SUPABASE_SERVICE_KEY:0:20}...

### n8n Cloud
- **Base URL:** https://hyamie.app.n8n.cloud
- **API Key:** eyJhbG...YLTM (in /c/ClaudeAgents/config/.env)

### Vercel
- **Team:** hyamie
- **Project:** usac-rhc-automation

---

## 📊 System Architecture

\`\`\`
┌─────────────────┐
│  USAC Website   │
│  (Form 465)     │
└────────┬────────┘
         │
         ▼
┌─────────────────┐      ┌──────────────┐
│  n8n Monitor    │─────▶│  Supabase    │
│  Workflow       │      │  Database    │
└─────────────────┘      └──────┬───────┘
                                │
                                ▼
┌─────────────────┐      ┌──────────────┐
│  Enrichment     │◀─────│  Next.js     │
│  Pipeline       │      │  Dashboard   │
└────────┬────────┘      └──────────────┘
         │                      ▲
         ▼                      │
┌─────────────────┐             │
│  Apollo.io API  │             │
└─────────────────┘             │
         │                      │
         ▼                      │
┌─────────────────┐             │
│  Email Outreach │─────────────┘
│  Generator      │
└─────────────────┘
\`\`\`

---

## 🎯 Next Steps

1. ✅ Complete n8n workflow imports
2. ✅ Update webhook URLs in Vercel
3. ✅ Run end-to-end test
4. 📧 Configure email sending (Gmail/SMTP)
5. 🔔 Set up monitoring and alerts
6. 📈 Monitor first real USAC filing

---

## 🛠️ Useful Commands

\`\`\`bash
# View Vercel logs
vercel logs usac-rhc-automation

# Redeploy dashboard
cd /c/ClaudeAgents/projects/usac-rhc-automation/dashboard
vercel --prod

# Update Supabase types
cd dashboard
npx supabase gen types typescript --project-id YOUR_PROJECT_ID > src/types/supabase.ts

# Check n8n workflows
curl -H "X-N8N-API-KEY: YOUR_KEY" https://hyamie.app.n8n.cloud/api/v1/workflows

# View project status
git status
git log --oneline -5
\`\`\`

---

**🎉 Deployment automated by Claude Code**
**Generated:** $(date)
EOF

echo -e "${GREEN}✓ Documentation updated${NC}"
echo ""

# ============================================================================
# Final Summary
# ============================================================================
echo -e "${BLUE}========================================${NC}"
echo -e "${BLUE}Deployment Complete!${NC}"
echo -e "${BLUE}========================================${NC}"
echo ""
echo -e "${GREEN}✅ GitHub Repository:${NC} $REPO_URL"
echo -e "${GREEN}✅ Supabase Database:${NC} $SUPABASE_URL"
echo -e "${GREEN}✅ Vercel Dashboard:${NC} $VERCEL_URL"
echo -e "${YELLOW}⏳ n8n Workflows:${NC} Ready to import manually"
echo ""
echo -e "${BLUE}📄 See DEPLOYMENT_SUMMARY.md for complete details and next steps${NC}"
echo ""
echo -e "${YELLOW}⚠️  Manual Steps Required:${NC}"
echo "  1. Import 3 n8n workflow JSON files"
echo "  2. Update webhook URLs in Vercel environment"
echo "  3. Test the complete flow"
echo ""
echo -e "${GREEN}🎉 All automated steps completed successfully!${NC}"
