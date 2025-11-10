# Run Migration - Step by Step

## Quick 5-Minute Guide

### Step 1: Open Supabase SQL Editor (1 min)
1. Go to: https://fhuqiicgmfpnmficopqp.supabase.co
2. Sign in to your Supabase account
3. Click **"SQL Editor"** in the left sidebar
4. Click **"New query"** button

### Step 2: Copy the Migration Script (30 seconds)
1. Open file: `database/schema_update_v3_alignment_fix.sql`
2. Select All (Ctrl+A) and Copy (Ctrl+C)

### Step 3: Run the Migration (1 min)
1. Paste the SQL into the Supabase SQL Editor
2. Click **"Run"** button (or press Ctrl+Enter)
3. Wait for execution (should take ~5 seconds)

### Step 4: Verify Success (1 min)
You should see output like:
```
NOTICE: Migration successful: All columns created

column_name          | data_type | is_nullable | column_default
---------------------|-----------|-------------|----------------
additional_documents | jsonb     | YES         | '{"rfp_links": [], ...
application_number   | text      | YES         | NULL
contact_phone        | text      | YES         | NULL
zip                  | text      | YES         | NULL
```

✅ **Success!** If you see the above table with 4 rows

### Step 5: Reload Schema Cache (30 seconds)
1. Click **"Settings"** in left sidebar
2. Click **"API"**
3. Scroll down to **"Schema"** section
4. Click **"Reload schema"** button
5. Wait for confirmation message

---

## What This Migration Does

Adds 4 missing columns:
- ✅ `application_number` - Form 465 ID from USAC
- ✅ `zip` - Clinic ZIP code
- ✅ `contact_phone` - Contact phone number
- ✅ `additional_documents` - JSONB array for RFP & document links

Creates indexes for performance
Creates helper function `get_document_count()`
Creates view `clinics_with_documents`

---

## Troubleshooting

**Error: "relation does not exist"**
- Make sure you're connected to the correct database
- Run `schema.sql` and `schema_update_v2.sql` first

**Error: "column already exists"**
- Migration already ran! Skip to Step 5 (reload schema cache)

**Error: Permission denied**
- Make sure you're logged in as the project owner

---

## After Migration

Return to Claude Code and confirm migration is complete.

Next steps:
1. ✅ Migration complete
2. ⏭️ Update n8n workflow to use new columns
3. ⏭️ Test workflow end-to-end
