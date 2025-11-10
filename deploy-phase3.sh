#!/bin/bash
# ============================================================================
# Phase 3 Deployment Script
# ============================================================================
# Description: Automated deployment script for Phase 3 dashboard enhancements
# Date: 2025-11-09
# ============================================================================

set -e  # Exit on error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Helper functions
print_header() {
  echo -e "${BLUE}============================================================================${NC}"
  echo -e "${BLUE}$1${NC}"
  echo -e "${BLUE}============================================================================${NC}"
}

print_success() {
  echo -e "${GREEN}✓ $1${NC}"
}

print_warning() {
  echo -e "${YELLOW}⚠ $1${NC}"
}

print_error() {
  echo -e "${RED}✗ $1${NC}"
}

print_info() {
  echo -e "${BLUE}ℹ $1${NC}"
}

# Check if we're in the right directory
if [ ! -f "PHASE3_DEPLOYMENT_GUIDE.md" ]; then
  print_error "Must run from project root directory"
  exit 1
fi

# ============================================================================
# Step 1: Pre-deployment Checks
# ============================================================================
print_header "Step 1: Pre-deployment Checks"

# Check if dashboard directory exists
if [ ! -d "dashboard" ]; then
  print_error "Dashboard directory not found"
  exit 1
fi
print_success "Dashboard directory found"

# Check if migration file exists
if [ ! -f "database/migrations/20251109_add_outreach_and_consultant_fields.sql" ]; then
  print_error "Migration file not found"
  exit 1
fi
print_success "Migration file found"

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
  print_error "Node.js not installed"
  exit 1
fi
print_success "Node.js installed: $(node --version)"

# Check if npm is installed
if ! command -v npm &> /dev/null; then
  print_error "npm not installed"
  exit 1
fi
print_success "npm installed: $(npm --version)"

# ============================================================================
# Step 2: Database Migration Instructions
# ============================================================================
print_header "Step 2: Database Migration"

print_warning "MANUAL STEP REQUIRED:"
echo ""
echo "Please apply the database migration manually:"
echo ""
echo "1. Go to: https://supabase.com/dashboard"
echo "2. Select your project"
echo "3. Navigate to: SQL Editor"
echo "4. Click: New Query"
echo "5. Copy/paste the contents of:"
echo "   database/migrations/20251109_add_outreach_and_consultant_fields.sql"
echo "6. Click: Run (or press Ctrl+Enter)"
echo "7. Verify success message"
echo ""
read -p "Press Enter after completing the migration..."

print_info "Verifying migration (manual check recommended)..."
echo ""
echo "Run this query in Supabase to verify:"
echo ""
echo "SELECT column_name, data_type, column_default"
echo "FROM information_schema.columns"
echo "WHERE table_name = 'clinics_pending_review'"
echo "AND column_name IN ('outreach_status', 'contact_is_consultant', 'mail_contact_is_consultant');"
echo ""
read -p "Did the verification query return 3 rows? (y/n): " verified

if [ "$verified" != "y" ] && [ "$verified" != "Y" ]; then
  print_error "Migration verification failed"
  exit 1
fi

print_success "Migration verified"

# ============================================================================
# Step 3: Install Dependencies
# ============================================================================
print_header "Step 3: Installing Dependencies"

cd dashboard

print_info "Running npm install..."
if npm install; then
  print_success "Dependencies installed"
else
  print_error "Failed to install dependencies"
  exit 1
fi

# ============================================================================
# Step 4: Type Check
# ============================================================================
print_header "Step 4: TypeScript Type Check"

print_info "Running type check..."
if npm run type-check; then
  print_success "Type check passed"
else
  print_error "Type check failed"
  exit 1
fi

# ============================================================================
# Step 5: Build Test
# ============================================================================
print_header "Step 5: Production Build Test"

print_info "Building for production..."
if npm run build; then
  print_success "Build successful"
else
  print_error "Build failed"
  exit 1
fi

# ============================================================================
# Step 6: Git Commit
# ============================================================================
print_header "Step 6: Git Commit"

cd ..

# Check if there are changes to commit
if [ -z "$(git status --porcelain)" ]; then
  print_warning "No changes to commit"
else
  print_info "Staging all changes..."
  git add .

  print_info "Creating commit..."
  git commit -m "feat(dashboard): Phase 3 enhancements - outreach workflow and consultant tagging

- Add Start Outreach button with API integration
- Convert Service Type to modal popup
- Add consultant tagging for primary and mail contacts
- Remove Application Type filter
- Update database schema with new fields
- Add API routes for outreach status and consultant tagging

Related files:
- Database migration: 20251109_add_outreach_and_consultant_fields.sql
- API routes: start-outreach, tag-primary-consultant, tag-mail-consultant
- UI components: dialog.tsx (new), ClinicCard.tsx, ClinicList.tsx
- Types: database.types.ts updated

Documentation:
- SCHEMA_CHANGES_PHASE3.md
- PHASE3_DEPLOYMENT_GUIDE.md
- CHECKPOINT_2025-11-09_PHASE3_COMPLETE.md
- PHASE3_CHANGES_SUMMARY.md"

  print_success "Changes committed"
fi

# ============================================================================
# Step 7: Deploy Options
# ============================================================================
print_header "Step 7: Deployment Options"

echo ""
echo "Choose deployment method:"
echo "1) Push to Git (Vercel auto-deploy)"
echo "2) Manual Vercel deployment"
echo "3) Skip deployment (deploy later)"
echo ""
read -p "Enter choice (1-3): " deploy_choice

case $deploy_choice in
  1)
    print_info "Pushing to Git..."
    if git push origin main; then
      print_success "Pushed to Git"
      print_info "Vercel will auto-deploy. Check: https://vercel.com/dashboard"
    else
      print_error "Git push failed"
      exit 1
    fi
    ;;
  2)
    print_info "Starting manual Vercel deployment..."
    cd dashboard
    if npx vercel --prod; then
      print_success "Manual deployment successful"
    else
      print_error "Manual deployment failed"
      exit 1
    fi
    cd ..
    ;;
  3)
    print_warning "Skipping deployment"
    print_info "Deploy later with: git push origin main"
    ;;
  *)
    print_error "Invalid choice"
    exit 1
    ;;
esac

# ============================================================================
# Step 8: Summary
# ============================================================================
print_header "Deployment Summary"

echo ""
print_success "Phase 3 deployment completed!"
echo ""
echo "What was deployed:"
echo "  ✓ Database migration (3 new fields, 2 indexes)"
echo "  ✓ 3 new API routes"
echo "  ✓ Updated ClinicCard component"
echo "  ✓ Updated ClinicList component"
echo "  ✓ New Dialog UI component"
echo "  ✓ Removed Application Type filter"
echo ""
echo "Next steps:"
echo "  1. Visit dashboard to test changes"
echo "  2. Run post-deployment verification tests"
echo "  3. Update Part 2 n8n workflow to use new fields"
echo "  4. Monitor for 24 hours"
echo ""
echo "Documentation:"
echo "  - PHASE3_DEPLOYMENT_GUIDE.md (step-by-step testing)"
echo "  - CHECKPOINT_2025-11-09_PHASE3_COMPLETE.md (implementation details)"
echo "  - PHASE3_CHANGES_SUMMARY.md (visual overview)"
echo "  - SCHEMA_CHANGES_PHASE3.md (database details)"
echo ""
print_info "Deployment script completed successfully!"
echo ""
