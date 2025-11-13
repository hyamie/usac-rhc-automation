@echo off
echo ========================================
echo Service Type Filter - Quick Deploy
echo ========================================
echo.

cd /d "%~dp0dashboard"

echo [1/4] Installing missing dependencies...
call npm install sonner @radix-ui/react-skeleton
if errorlevel 1 (
    echo ERROR: Failed to install dependencies
    pause
    exit /b 1
)
echo.

echo [2/4] Testing build locally...
call npm run build
if errorlevel 1 (
    echo ERROR: Build failed
    echo Check the errors above and fix them
    pause
    exit /b 1
)
echo.

echo [3/4] Committing dependency updates...
cd ..
git add dashboard/package.json dashboard/package-lock.json
git commit -m "fix: add missing UI dependencies (sonner, skeleton)"
echo.

echo [4/4] Deploying to Vercel production...
cd dashboard
call vercel --prod
echo.

echo ========================================
echo Deployment Complete!
echo ========================================
echo.
echo Your service filter should now be live at:
echo https://dashboard-iasjlnqjs-mike-hyams-projects.vercel.app
echo.
echo Or check your production URL in the output above.
echo.
pause
