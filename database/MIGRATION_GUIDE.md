# Phase 4.2 Database Migrations - Execution Guide

**Date:** 2025-11-11
**Status:** Ready to Execute
**Method:** Manual via Supabase Dashboard (Recommended)

---

## Quick Start (5 minutes)

### Step 1: Open Supabase SQL Editor

1. Go to: **https://fhuqiicgmfpnmficopqp.supabase.co/project/_/sql**
2. Log in if prompted
3. Click "+ New Query" button

### Step 2: Execute Migration Files (In Order)

Execute these 3 SQL files **one at a time** in this exact order:

#### Migration 1: Create Tables & Policies
```
File: database/phase4_migrations.sql
Description: Creates 5 tables (email_templates, email_instances, template_edits, weekly_performance, voice_model)
Lines: 472
```

**Action:**
1. Open `C:\claudeagents\projects\usac-rhc-automation\database\phase4_migrations.sql`
2. Copy entire contents (Ctrl+A, Ctrl+C)
3. Paste into Supabase SQL Editor
4. Click "Run" button
5. ✅ Verify: Should see "Success. No rows returned"

---

#### Migration 2: Bootstrap Voice Model
```
File: database/phase4_bootstrap_voice_model.sql
Description: Inserts Mike's voice model v1 with learned email patterns
Lines: 161
```

**Action:**
1. Open `C:\claudeagents\projects\usac-rhc-automation\database\phase4_bootstrap_voice_model.sql`
2. Copy entire contents
3. Paste into Supabase SQL Editor (new query or same)
4. Click "Run"
5. ✅ Verify: Should see results showing voice model v1 inserted

---

#### Migration 3: Insert Templates
```
File: insert_templates_week-46-2025_direct.sql
Description: Inserts 3 email templates (A/B/C variants)
Lines: ~100
```

**Action:**
1. Open `C:\claudeagents\projects\usac-rhc-automation\insert_templates_week-46-2025_direct.sql`
2. Copy entire contents
3. Paste into Supabase SQL Editor
4. Click "Run"
5. ✅ Verify: Should see "3 rows inserted" or similar

---

### Step 3: Verify Migrations

Run these verification queries in Supabase SQL Editor:

```sql
-- 1. Check all tables were created
SELECT table_name
FROM information_schema.tables
WHERE table_schema = 'public'
  AND (table_name LIKE 'email_%'
    OR table_name IN ('weekly_performance', 'voice_model'))
ORDER BY table_name;

-- Expected: 5 tables
-- email_instances, email_templates, template_edits, voice_model, weekly_performance
```

```sql
-- 2. Check voice model
SELECT
    version,
    confidence_score,
    training_emails_count,
    active,
    created_at
FROM voice_model
WHERE active = true;

-- Expected: 1 row, version=1, confidence=0.82, emails=10
```

```sql
-- 3. Check templates
SELECT
    version,
    template_variant,
    contact_type,
    tone,
    active
FROM email_templates
WHERE version = 'week-46-2025'
ORDER BY template_variant;

-- Expected: 3 rows (A, B, C)
```

---

## Alternative: Command Line (If tools available)

### Option A: Using Supabase CLI (if installed)

```bash
# Install Supabase CLI first (if not installed)
npm install -g supabase

# Link to project
supabase link --project-ref fhuqiicgmfpnmficopqp

# Run migrations
supabase db push

# Or execute individual files
supabase db execute < database/phase4_migrations.sql
supabase db execute < database/phase4_bootstrap_voice_model.sql
supabase db execute < insert_templates_week-46-2025_direct.sql
```

### Option B: Using psql (if installed)

```bash
# Get connection string from environment
cd /c/claudeagents
source config/.env

# Execute migrations
psql "$POSTGRES_URL" -f projects/usac-rhc-automation/database/phase4_migrations.sql
psql "$POSTGRES_URL" -f projects/usac-rhc-automation/database/phase4_bootstrap_voice_model.sql
psql "$POSTGRES_URL" -f projects/usac-rhc-automation/insert_templates_week-46-2025_direct.sql
```

---

## Troubleshooting

### Error: "relation already exists"

**Cause:** Tables were partially created in a previous attempt.

**Fix:**
```sql
-- Drop tables in reverse order (foreign key dependencies)
DROP TABLE IF EXISTS template_edits CASCADE;
DROP TABLE IF EXISTS email_instances CASCADE;
DROP TABLE IF EXISTS weekly_performance CASCADE;
DROP TABLE IF EXISTS email_templates CASCADE;
DROP TABLE IF EXISTS voice_model CASCADE;

-- Then re-run migrations from Step 2
```

### Error: "permission denied"

**Cause:** Using anon key instead of service_role key.

**Fix:** Make sure you're logged into Supabase Dashboard as the project owner.

### Error: "function does not exist"

**Cause:** Helper functions not created.

**Fix:** Re-run `phase4_bootstrap_voice_model.sql` which creates helper functions.

---

## What Gets Created

### Tables (5)

1. **email_templates** - Weekly A/B/C template versions
   - Stores subject and body templates with placeholders
   - Tracks performance metrics
   - Version: `week-46-2025`, variants: A, B, C

2. **email_instances** - Individual emails sent/drafted
   - Links to clinic and template
   - Stores rendered content with enrichment
   - Tracks draft creation and user edits
   - Records opens, clicks, responses

3. **template_edits** - Learning from Mike's changes
   - Captures what Mike edits before sending
   - Identifies patterns (shortening, tone shifts, etc.)
   - Feeds into template improvement

4. **weekly_performance** - A/B/C test results
   - Weekly metrics for each variant
   - Winner identification
   - Key learnings and recommendations

5. **voice_model** - Learned writing patterns
   - Mike's tone profile (formality, warmth, directness)
   - Preferred phrases and patterns to avoid
   - Sentence structure preferences
   - Subject line patterns

### Functions (2)

1. **get_active_voice_model()** - Returns current voice model
2. **identify_edit_pattern(text, text)** - Analyzes edit types

### Policies (RLS)

- Authenticated users: READ access
- Service role: FULL access

---

## Next Steps After Migrations

Once database migrations are complete, proceed to:

### 1. Import n8n Workflow

**File:** `workflows/outreach_email_generation.json`

**Steps:**
1. Go to: https://hyamie.app.n8n.cloud
2. Click "Import from File"
3. Select: `outreach_email_generation.json`
4. Configure credentials (Supabase, Perplexity, O365)
5. Activate workflow
6. Copy webhook URL

**Documentation:**
- `workflows/WORKFLOW_IMPORT_GUIDE.md` - Detailed import instructions
- `workflows/API_CREDENTIALS_SETUP.md` - API key setup guide
- `workflows/outreach_email_generation_spec.md` - Workflow specification

### 2. Update Dashboard Environment

**File:** `dashboard/.env.local`

Update these variables:
```bash
NEXT_PUBLIC_N8N_OUTREACH_WEBHOOK_URL=<actual_webhook_url>
NEXT_PUBLIC_N8N_WEBHOOK_AUTH_TOKEN=<secure_token>
```

### 3. Test End-to-End

1. Restart Next.js dev server: `cd dashboard && npm run dev`
2. Open clinic card in browser
3. Click "Start Outreach" button
4. Verify email draft created in O365
5. Check Supabase for email instance record

---

## Cost & Performance

**Database Storage:**
- Voice model: ~5 KB
- 3 Templates: ~6 KB
- Per email instance: ~2 KB

**Query Performance:**
- All tables have appropriate indexes
- RLS policies optimized for service_role

**Monthly Costs:**
- Database storage: $0 (within free tier)
- Database queries: $0 (within free tier)

---

## Support & References

**Supabase Dashboard:**
- Project: https://fhuqiicgmfpnmficopqp.supabase.co
- SQL Editor: /project/_/sql
- Table Editor: /project/_/editor
- API Docs: /project/_/api

**Project Documentation:**
- Phase 4.1 Complete: `PHASE4.1_COMPLETE.md`
- Phase 4.2 Dashboard: `PHASE4.2_DASHBOARD_INTEGRATION_COMPLETE.md`
- Database Schema Design: (in migration files)

**Questions?**
All SQL is heavily commented. Read the migration files for detailed explanations.

---

**Last Updated:** 2025-11-11
**Estimated Time:** 5-10 minutes
**Difficulty:** Easy (copy/paste SQL)

✅ **You're ready to execute!** Open Supabase Dashboard and begin with Migration 1.
