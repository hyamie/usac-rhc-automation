-- Migration: Convert notes field from text to jsonb
-- Date: 2025-11-09
-- Description: Convert existing text notes to structured JSONB array format

-- Step 1: Add a temporary column to hold the new JSONB data
ALTER TABLE clinics_pending_review ADD COLUMN notes_temp jsonb;

-- Step 2: Migrate existing notes to JSONB format
-- If notes exist and are not empty, create array with single note object with current timestamp
-- Otherwise, set to empty array
UPDATE clinics_pending_review
SET notes_temp = CASE
  WHEN notes IS NULL OR notes = '' THEN '[]'::jsonb
  ELSE jsonb_build_array(
    jsonb_build_object(
      'timestamp', updated_at,
      'note', notes
    )
  )
END;

-- Step 3: Drop the old notes column
ALTER TABLE clinics_pending_review DROP COLUMN notes;

-- Step 4: Rename the temporary column to notes
ALTER TABLE clinics_pending_review RENAME COLUMN notes_temp TO notes;

-- Step 5: Set a default value for new rows
ALTER TABLE clinics_pending_review ALTER COLUMN notes SET DEFAULT '[]'::jsonb;

-- Step 6: Add a comment to document the structure
COMMENT ON COLUMN clinics_pending_review.notes IS 'JSONB array of note objects with structure: [{"timestamp": "ISO8601", "note": "text"}]';
