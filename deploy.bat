@echo off
REM ============================================================================
REM USAC RHC Automation - Windows Deployment Script
REM ============================================================================
REM Usage: deploy.bat <SUPABASE_URL> <SUPABASE_ANON_KEY> <SUPABASE_SERVICE_KEY>
REM ============================================================================

echo ========================================
echo USAC RHC Automation Deployment
echo ========================================
echo.

REM Check arguments
if "%~3"=="" (
    echo Error: Missing required arguments
    echo Usage: deploy.bat SUPABASE_URL SUPABASE_ANON_KEY SUPABASE_SERVICE_KEY
    exit /b 1
)

set SUPABASE_URL=%~1
set SUPABASE_ANON_KEY=%~2
set SUPABASE_SERVICE_KEY=%~3
set PROJECT_DIR=C:\ClaudeAgents\projects\usac-rhc-automation
set DASHBOARD_DIR=%PROJECT_DIR%\dashboard

REM ============================================================================
REM Step 1: Create GitHub Repository
REM ============================================================================
echo [1/5] Creating GitHub repository...
cd /d "%PROJECT_DIR%"

REM Check if remote already exists
git remote get-url origin >nul 2>&1
if %errorlevel% equ 0 (
    echo Repository already has remote origin. Pushing latest changes...
    git push origin master
) else (
    REM Create new repository
    "C:\Program Files\GitHub CLI\gh.exe" repo create usac-rhc-automation --public --source=. --remote=origin --description="USAC Rural Health Care automation system for clinic monitoring and outreach" --push
)

for /f "tokens=*" %%i in ('"C:\Program Files\GitHub CLI\gh.exe" repo view --json url -q .url') do set REPO_URL=%%i
echo GitHub repository: %REPO_URL%
echo.

REM ============================================================================
REM Step 2: Deploy Database Schema
REM ============================================================================
echo [2/5] Database schema deployment...
echo.
echo Please deploy the schema manually using ONE of these methods:
echo.
echo METHOD 1 - Supabase Dashboard (Recommended):
echo   1. Go to: %SUPABASE_URL:~0,-1%/project/_/sql
echo   2. Click "New Query"
echo   3. Copy contents from: %PROJECT_DIR%\database\schema.sql
echo   4. Click "Run"
echo.
echo METHOD 2 - PostgreSQL Client:
echo   Extract the database password from your Supabase project
echo   Then run: psql "postgresql://postgres:[PASSWORD]@db.YOUR_PROJECT.supabase.co:5432/postgres" -f "%PROJECT_DIR%\database\schema.sql"
echo.
pause
echo.

REM ============================================================================
REM Step 3: Create Dashboard Environment File
REM ============================================================================
echo [3/5] Creating dashboard environment file...

echo # Supabase Configuration > "%DASHBOARD_DIR%\.env.local"
echo NEXT_PUBLIC_SUPABASE_URL=%SUPABASE_URL% >> "%DASHBOARD_DIR%\.env.local"
echo NEXT_PUBLIC_SUPABASE_ANON_KEY=%SUPABASE_ANON_KEY% >> "%DASHBOARD_DIR%\.env.local"
echo SUPABASE_SERVICE_ROLE_KEY=%SUPABASE_SERVICE_KEY% >> "%DASHBOARD_DIR%\.env.local"
echo. >> "%DASHBOARD_DIR%\.env.local"
echo # n8n Webhook URLs (placeholder - update after workflow import) >> "%DASHBOARD_DIR%\.env.local"
echo N8N_ENRICHMENT_WEBHOOK_URL=https://hyamie.app.n8n.cloud/webhook/placeholder-enrichment >> "%DASHBOARD_DIR%\.env.local"
echo N8N_EMAIL_WEBHOOK_URL=https://hyamie.app.n8n.cloud/webhook/placeholder-email >> "%DASHBOARD_DIR%\.env.local"
echo. >> "%DASHBOARD_DIR%\.env.local"
echo # Application URL >> "%DASHBOARD_DIR%\.env.local"
echo NEXT_PUBLIC_APP_URL=https://usac-rhc-automation.vercel.app >> "%DASHBOARD_DIR%\.env.local"

echo Created .env.local
echo.

REM ============================================================================
REM Step 4: Deploy to Vercel
REM ============================================================================
echo [4/5] Deploying to Vercel...
cd /d "%DASHBOARD_DIR%"

REM Link or create project
vercel link --yes --project=usac-rhc-automation

REM Deploy to production
echo Deploying to Vercel production...
vercel --prod --yes > deploy_output.txt 2>&1

REM Extract URL from output
for /f "tokens=*" %%i in ('findstr /C:"https://" deploy_output.txt') do set VERCEL_URL=%%i
echo Deployed to: %VERCEL_URL%
echo.

REM Set environment variables
echo Setting Vercel environment variables...
echo %SUPABASE_URL% | vercel env add NEXT_PUBLIC_SUPABASE_URL production
echo %SUPABASE_ANON_KEY% | vercel env add NEXT_PUBLIC_SUPABASE_ANON_KEY production
echo %SUPABASE_SERVICE_KEY% | vercel env add SUPABASE_SERVICE_ROLE_KEY production
echo https://hyamie.app.n8n.cloud/webhook/placeholder-enrichment | vercel env add N8N_ENRICHMENT_WEBHOOK_URL production
echo https://hyamie.app.n8n.cloud/webhook/placeholder-email | vercel env add N8N_EMAIL_WEBHOOK_URL production

echo Environment variables configured
echo.

REM ============================================================================
REM Step 5: Create Deployment Summary
REM ============================================================================
echo [5/5] Creating deployment summary...
cd /d "%PROJECT_DIR%"

echo # USAC RHC Automation - Deployment Summary > DEPLOYMENT_SUMMARY.md
echo. >> DEPLOYMENT_SUMMARY.md
echo **Deployment Date:** %date% %time% >> DEPLOYMENT_SUMMARY.md
echo. >> DEPLOYMENT_SUMMARY.md
echo ## Deployed Services >> DEPLOYMENT_SUMMARY.md
echo. >> DEPLOYMENT_SUMMARY.md
echo ### GitHub Repository >> DEPLOYMENT_SUMMARY.md
echo - **URL:** %REPO_URL% >> DEPLOYMENT_SUMMARY.md
echo - **Status:** Deployed >> DEPLOYMENT_SUMMARY.md
echo. >> DEPLOYMENT_SUMMARY.md
echo ### Supabase Database >> DEPLOYMENT_SUMMARY.md
echo - **Project URL:** %SUPABASE_URL% >> DEPLOYMENT_SUMMARY.md
echo - **Status:** Schema ready to deploy >> DEPLOYMENT_SUMMARY.md
echo. >> DEPLOYMENT_SUMMARY.md
echo ### Vercel Dashboard >> DEPLOYMENT_SUMMARY.md
echo - **Production URL:** %VERCEL_URL% >> DEPLOYMENT_SUMMARY.md
echo - **Status:** Deployed >> DEPLOYMENT_SUMMARY.md
echo. >> DEPLOYMENT_SUMMARY.md
echo ### n8n Cloud >> DEPLOYMENT_SUMMARY.md
echo - **Instance URL:** https://hyamie.app.n8n.cloud >> DEPLOYMENT_SUMMARY.md
echo - **Status:** Workflows ready to import >> DEPLOYMENT_SUMMARY.md
echo. >> DEPLOYMENT_SUMMARY.md
echo ## Remaining Manual Steps >> DEPLOYMENT_SUMMARY.md
echo. >> DEPLOYMENT_SUMMARY.md
echo 1. Deploy database schema to Supabase >> DEPLOYMENT_SUMMARY.md
echo 2. Import n8n workflows from /workflows directory >> DEPLOYMENT_SUMMARY.md
echo 3. Update webhook URLs in Vercel environment >> DEPLOYMENT_SUMMARY.md
echo 4. Test the complete system >> DEPLOYMENT_SUMMARY.md
echo. >> DEPLOYMENT_SUMMARY.md

echo Documentation updated
echo.

REM ============================================================================
REM Final Summary
REM ============================================================================
echo ========================================
echo Deployment Complete!
echo ========================================
echo.
echo GitHub Repository: %REPO_URL%
echo Supabase Database: %SUPABASE_URL%
echo Vercel Dashboard: %VERCEL_URL%
echo n8n Workflows: Ready to import
echo.
echo See DEPLOYMENT_SUMMARY.md for complete details
echo.
pause
