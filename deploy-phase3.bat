@echo off
REM ============================================================================
REM Phase 3 Deployment Script (Windows)
REM ============================================================================
REM Description: Automated deployment script for Phase 3 dashboard enhancements
REM Date: 2025-11-09
REM ============================================================================

setlocal enabledelayedexpansion

REM ============================================================================
REM Step 1: Pre-deployment Checks
REM ============================================================================
echo ============================================================================
echo Step 1: Pre-deployment Checks
echo ============================================================================
echo.

if not exist "PHASE3_DEPLOYMENT_GUIDE.md" (
  echo [ERROR] Must run from project root directory
  exit /b 1
)
echo [OK] Found deployment guide

if not exist "dashboard" (
  echo [ERROR] Dashboard directory not found
  exit /b 1
)
echo [OK] Dashboard directory found

if not exist "database\migrations\20251109_add_outreach_and_consultant_fields.sql" (
  echo [ERROR] Migration file not found
  exit /b 1
)
echo [OK] Migration file found

where node >nul 2>nul
if errorlevel 1 (
  echo [ERROR] Node.js not installed
  exit /b 1
)
echo [OK] Node.js installed

where npm >nul 2>nul
if errorlevel 1 (
  echo [ERROR] npm not installed
  exit /b 1
)
echo [OK] npm installed

echo.

REM ============================================================================
REM Step 2: Database Migration Instructions
REM ============================================================================
echo ============================================================================
echo Step 2: Database Migration
echo ============================================================================
echo.

echo [WARNING] MANUAL STEP REQUIRED:
echo.
echo Please apply the database migration manually:
echo.
echo 1. Go to: https://supabase.com/dashboard
echo 2. Select your project
echo 3. Navigate to: SQL Editor
echo 4. Click: New Query
echo 5. Copy/paste the contents of:
echo    database\migrations\20251109_add_outreach_and_consultant_fields.sql
echo 6. Click: Run (or press Ctrl+Enter)
echo 7. Verify success message
echo.
pause

echo.
echo [INFO] Verifying migration (manual check recommended)...
echo.
echo Run this query in Supabase to verify:
echo.
echo SELECT column_name, data_type, column_default
echo FROM information_schema.columns
echo WHERE table_name = 'clinics_pending_review'
echo AND column_name IN ('outreach_status', 'contact_is_consultant', 'mail_contact_is_consultant');
echo.
set /p verified="Did the verification query return 3 rows? (y/n): "

if /i not "%verified%"=="y" (
  echo [ERROR] Migration verification failed
  exit /b 1
)

echo [OK] Migration verified
echo.

REM ============================================================================
REM Step 3: Install Dependencies
REM ============================================================================
echo ============================================================================
echo Step 3: Installing Dependencies
echo ============================================================================
echo.

cd dashboard

echo [INFO] Running npm install...
call npm install
if errorlevel 1 (
  echo [ERROR] Failed to install dependencies
  exit /b 1
)
echo [OK] Dependencies installed
echo.

REM ============================================================================
REM Step 4: Type Check
REM ============================================================================
echo ============================================================================
echo Step 4: TypeScript Type Check
echo ============================================================================
echo.

echo [INFO] Running type check...
call npm run type-check
if errorlevel 1 (
  echo [ERROR] Type check failed
  exit /b 1
)
echo [OK] Type check passed
echo.

REM ============================================================================
REM Step 5: Build Test
REM ============================================================================
echo ============================================================================
echo Step 5: Production Build Test
echo ============================================================================
echo.

echo [INFO] Building for production...
call npm run build
if errorlevel 1 (
  echo [ERROR] Build failed
  exit /b 1
)
echo [OK] Build successful
echo.

cd ..

REM ============================================================================
REM Step 6: Git Commit
REM ============================================================================
echo ============================================================================
echo Step 6: Git Commit
echo ============================================================================
echo.

git status --short >nul 2>nul
if errorlevel 1 (
  echo [WARNING] Git not initialized or not installed
  goto :skip_git
)

git diff --quiet
if not errorlevel 1 (
  echo [WARNING] No changes to commit
  goto :skip_git
)

echo [INFO] Staging all changes...
git add .

echo [INFO] Creating commit...
git commit -m "feat(dashboard): Phase 3 enhancements - outreach workflow and consultant tagging" -m "- Add Start Outreach button with API integration" -m "- Convert Service Type to modal popup" -m "- Add consultant tagging for primary and mail contacts" -m "- Remove Application Type filter" -m "- Update database schema with new fields" -m "- Add API routes for outreach status and consultant tagging"

echo [OK] Changes committed

:skip_git
echo.

REM ============================================================================
REM Step 7: Deploy Options
REM ============================================================================
echo ============================================================================
echo Step 7: Deployment Options
echo ============================================================================
echo.

echo Choose deployment method:
echo 1) Push to Git (Vercel auto-deploy)
echo 2) Manual Vercel deployment
echo 3) Skip deployment (deploy later)
echo.
set /p deploy_choice="Enter choice (1-3): "

if "%deploy_choice%"=="1" (
  echo [INFO] Pushing to Git...
  git push origin main
  if errorlevel 1 (
    echo [ERROR] Git push failed
    exit /b 1
  )
  echo [OK] Pushed to Git
  echo [INFO] Vercel will auto-deploy. Check: https://vercel.com/dashboard
) else if "%deploy_choice%"=="2" (
  echo [INFO] Starting manual Vercel deployment...
  cd dashboard
  call npx vercel --prod
  if errorlevel 1 (
    echo [ERROR] Manual deployment failed
    exit /b 1
  )
  echo [OK] Manual deployment successful
  cd ..
) else if "%deploy_choice%"=="3" (
  echo [WARNING] Skipping deployment
  echo [INFO] Deploy later with: git push origin main
) else (
  echo [ERROR] Invalid choice
  exit /b 1
)

echo.

REM ============================================================================
REM Step 8: Summary
REM ============================================================================
echo ============================================================================
echo Deployment Summary
echo ============================================================================
echo.

echo [OK] Phase 3 deployment completed!
echo.
echo What was deployed:
echo   - Database migration (3 new fields, 2 indexes)
echo   - 3 new API routes
echo   - Updated ClinicCard component
echo   - Updated ClinicList component
echo   - New Dialog UI component
echo   - Removed Application Type filter
echo.
echo Next steps:
echo   1. Visit dashboard to test changes
echo   2. Run post-deployment verification tests
echo   3. Update Part 2 n8n workflow to use new fields
echo   4. Monitor for 24 hours
echo.
echo Documentation:
echo   - PHASE3_DEPLOYMENT_GUIDE.md (step-by-step testing)
echo   - CHECKPOINT_2025-11-09_PHASE3_COMPLETE.md (implementation details)
echo   - PHASE3_CHANGES_SUMMARY.md (visual overview)
echo   - SCHEMA_CHANGES_PHASE3.md (database details)
echo.
echo [INFO] Deployment script completed successfully!
echo.

pause
