@echo off
REM ============================================================================
REM Generate TypeScript Types from Supabase Database (Windows)
REM ============================================================================
REM Usage: generate-types.bat YOUR_PROJECT_REF
REM Example: generate-types.bat abc123xyz
REM ============================================================================

if "%1"=="" (
  echo Error: Project reference ID required
  echo Usage: generate-types.bat YOUR_PROJECT_REF
  echo.
  echo Get your project ref from:
  echo   Supabase Dashboard -^> Settings -^> General -^> Reference ID
  exit /b 1
)

set PROJECT_REF=%1
set OUTPUT_DIR=..\dashboard\src\types
set OUTPUT_FILE=%OUTPUT_DIR%\database.types.ts

echo Generating TypeScript types for project: %PROJECT_REF%
echo Output: %OUTPUT_FILE%
echo.

REM Check if Supabase CLI is installed
where supabase >nul 2>nul
if %errorlevel% neq 0 (
  echo Error: Supabase CLI not found
  echo Install with: npm install -g supabase
  exit /b 1
)

REM Create output directory if it doesn't exist
if not exist "%OUTPUT_DIR%" mkdir "%OUTPUT_DIR%"

REM Generate types
echo Running: npx supabase gen types typescript --project-id %PROJECT_REF%
npx supabase gen types typescript --project-id %PROJECT_REF% > "%OUTPUT_FILE%"

if %errorlevel% equ 0 (
  echo.
  echo Success! Types generated at: %OUTPUT_FILE%
  echo.
  echo You can now use these types in your Next.js app:
  echo   import type { Database } from '@/types/database.types'
) else (
  echo.
  echo Error generating types
  echo Make sure:
  echo   1. You're logged in: supabase login
  echo   2. Project ref is correct
  echo   3. You have internet connection
  exit /b 1
)
