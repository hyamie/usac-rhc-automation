-- ============================================================================
-- Service Type Data Diagnostic Script
-- Run this in Supabase SQL Editor to check your data
-- ============================================================================

-- 1. Check if service_type column exists
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'clinics_pending_review'
  AND column_name = 'service_type';

-- Expected: Should return 1 row with service_type | text | YES

-- ============================================================================

-- 2. See what service_type values currently exist
SELECT
  CASE
    WHEN service_type IS NULL THEN '❌ NULL (no data)'
    WHEN service_type = '' THEN '❌ EMPTY STRING (blank)'
    ELSE '✅ ' || service_type
  END as service_type_display,
  COUNT(*) as clinic_count,
  ROUND(100.0 * COUNT(*) / SUM(COUNT(*)) OVER(), 2) as percentage
FROM clinics_pending_review
GROUP BY service_type
ORDER BY clinic_count DESC;

-- Expected (if working):
-- ✅ Telecommunications Service ONLY | 15 | 35.71
-- ✅ Both Telecommunications...       | 8  | 19.05
-- etc.

-- Problem (if broken):
-- ❌ NULL (no data)                   | 42 | 100.00
-- or
-- ❌ EMPTY STRING (blank)             | 42 | 100.00

-- ============================================================================

-- 3. Sample data - see actual values
SELECT
  clinic_name,
  service_type,
  filing_date,
  created_at
FROM clinics_pending_review
ORDER BY created_at DESC
LIMIT 10;

-- Look at the service_type column - does it have data?

-- ============================================================================

-- 4. Count populated vs empty
SELECT
  COUNT(*) as total_clinics,
  COUNT(service_type) - COUNT(CASE WHEN service_type = '' THEN 1 END) as populated,
  COUNT(CASE WHEN service_type IS NULL OR service_type = '' THEN 1 END) as empty,
  ROUND(
    100.0 * (COUNT(service_type) - COUNT(CASE WHEN service_type = '' THEN 1 END)) / NULLIF(COUNT(*), 0),
    2
  ) as percent_populated
FROM clinics_pending_review;

-- Expected (if working):
-- total_clinics | populated | empty | percent_populated
-- 42           | 38        | 4     | 90.48

-- Problem (if broken):
-- total_clinics | populated | empty | percent_populated
-- 42           | 0         | 42    | 0.00

-- ============================================================================

-- 5. See exact unique values (for filter matching)
SELECT DISTINCT
  service_type,
  LENGTH(service_type) as length,
  COUNT(*) OVER (PARTITION BY service_type) as count
FROM clinics_pending_review
WHERE service_type IS NOT NULL
  AND service_type != ''
ORDER BY count DESC, service_type;

-- This shows EXACTLY what values are in the database
-- Compare these to your filter options

-- ============================================================================

-- 6. Recent data check (last 7 days)
SELECT
  DATE(created_at) as insert_date,
  COUNT(*) as clinics_inserted,
  COUNT(CASE WHEN service_type IS NOT NULL AND service_type != '' THEN 1 END) as has_service_type,
  ROUND(
    100.0 * COUNT(CASE WHEN service_type IS NOT NULL AND service_type != '' THEN 1 END) / NULLIF(COUNT(*), 0),
    2
  ) as percent_with_data
FROM clinics_pending_review
WHERE created_at >= CURRENT_DATE - INTERVAL '7 days'
GROUP BY DATE(created_at)
ORDER BY insert_date DESC;

-- This shows if recent data has service_type populated

-- ============================================================================

-- 7. Test the filter query (exactly what the dashboard does)
SELECT
  clinic_name,
  service_type,
  state,
  filing_date
FROM clinics_pending_review
WHERE service_type = 'telecommunications_only'  -- Try different values
ORDER BY filing_date DESC
LIMIT 10;

-- Try these values:
-- 'telecommunications_only'
-- 'both'
-- 'voice'
-- 'data'
-- 'Telecommunications Service ONLY'  (with caps and spaces)
-- 'Both Telecommunications & Internet Services'

-- If none return results, the values don't match!

-- ============================================================================
-- SUMMARY OF RESULTS
-- ============================================================================

-- After running all queries above, you should know:

-- ✅ Does service_type column exist? (Query 1)
-- ✅ What values are in the database? (Query 2, 5)
-- ✅ How much data is populated? (Query 4)
-- ✅ Are recent inserts working? (Query 6)
-- ✅ Do filter values match database values? (Query 7)

-- ============================================================================
-- NEXT STEPS BASED ON RESULTS
-- ============================================================================

-- If Query 2 shows "❌ NULL" or "❌ EMPTY STRING":
--   → n8n is not capturing the field
--   → Check USAC API field name
--   → Update n8n Transform node

-- If Query 5 shows values like "Telecommunications Service ONLY":
--   → Values don't match filter (filter uses 'telecommunications_only')
--   → Either update filter values OR normalize in n8n

-- If Query 6 shows 0% for recent data:
--   → Workflow is running but not capturing service_type
--   → Check n8n execution logs
--   → USAC API field name likely changed

-- If Query 7 returns 0 rows for all values:
--   → Mismatch between filter values and database values
--   → Use Query 5 to see exact database values
--   → Update filter to match

-- ============================================================================
