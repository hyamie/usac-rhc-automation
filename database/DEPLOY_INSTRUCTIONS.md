# Database Schema Deployment Instructions

## Manual Deployment (Recommended)

Since Supabase CLI is not installed, deploy the schema manually:

### Steps:

1. **Open Supabase SQL Editor:**
   - Go to: https://fhuqiicgmfpnmficopqp.supabase.co
   - Navigate to: SQL Editor (left sidebar)

2. **Copy Schema SQL:**
   - Open: `C:\ClaudeAgents\projects\usac-rhc-automation\database\schema_update_v2.sql`
   - Copy entire contents

3. **Execute SQL:**
   - Paste into Supabase SQL Editor
   - Click "Run" button
   - Wait for confirmation message

4. **Verify Schema:**
   - Go to: Table Editor
   - Open: `clinics_pending_review`
   - Verify new columns exist:
     - is_consultant
     - consultant_company
     - consultant_email_domain
     - funding_year_1, funding_amount_1
     - etc.

5. **Check New Table:**
   - Verify `consultant_email_domains` table exists
   - Should have columns: id, domain, associated_company, added_date, etc.

## Expected Results

After successful deployment:
- ✅ 18 new columns added to `clinics_pending_review`
- ✅ New table `consultant_email_domains` created
- ✅ Helper function `detect_consultant_by_domain()` created
- ✅ View `consultant_analytics` created
- ✅ Permissions granted

## Troubleshooting

If errors occur:
- Check that `clinics_pending_review` table exists
- Ensure you're logged in with admin/service role
- Try running statements one section at a time

## Alternative: Use psql CLI

If you have PostgreSQL client installed:

```bash
psql "postgresql://postgres:[password]@db.fhuqiicgmfpnmficopqp.supabase.co:5432/postgres" \
  -f schema_update_v2.sql
```

Replace `[password]` with your Supabase database password.
