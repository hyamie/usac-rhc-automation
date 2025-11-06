#!/bin/bash
# ============================================================================
# Generate TypeScript Types from Supabase Database
# ============================================================================
# Usage: ./generate-types.sh YOUR_PROJECT_REF
# Example: ./generate-types.sh abc123xyz
# ============================================================================

if [ -z "$1" ]; then
  echo "Error: Project reference ID required"
  echo "Usage: ./generate-types.sh YOUR_PROJECT_REF"
  echo ""
  echo "Get your project ref from:"
  echo "  Supabase Dashboard ’ Settings ’ General ’ Reference ID"
  exit 1
fi

PROJECT_REF=$1
OUTPUT_DIR="../dashboard/src/types"
OUTPUT_FILE="$OUTPUT_DIR/database.types.ts"

echo "Generating TypeScript types for project: $PROJECT_REF"
echo "Output: $OUTPUT_FILE"
echo ""

# Check if Supabase CLI is installed
if ! command -v supabase &> /dev/null; then
  echo "Error: Supabase CLI not found"
  echo "Install with: npm install -g supabase"
  exit 1
fi

# Create output directory if it doesn't exist
mkdir -p "$OUTPUT_DIR"

# Generate types
echo "Running: npx supabase gen types typescript --project-id $PROJECT_REF"
npx supabase gen types typescript --project-id "$PROJECT_REF" > "$OUTPUT_FILE"

if [ $? -eq 0 ]; then
  echo ""
  echo " Success! Types generated at: $OUTPUT_FILE"
  echo ""
  echo "You can now use these types in your Next.js app:"
  echo "  import type { Database } from '@/types/database.types'"
else
  echo ""
  echo "L Error generating types"
  echo "Make sure:"
  echo "  1. You're logged in: supabase login"
  echo "  2. Project ref is correct"
  echo "  3. You have internet connection"
  exit 1
fi
