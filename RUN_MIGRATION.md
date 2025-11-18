# Run Database Migration

## Clinic Grouping Feature Migration

### Quick Steps

1. **Open Supabase SQL Editor:**
   https://supabase.com/dashboard/project/fhuqiicgmfpnmficopqp/sql/new

2. **Copy the migration file:**
   - Open: `database/migrations/002_clinic_groups.sql`
   - Select all and copy (Ctrl+A, Ctrl+C)

3. **Paste and Run:**
   - Paste into Supabase SQL editor
   - Click "Run" button
   - Wait for success message

4. **Verify:**
   Run this query to confirm tables were created:
   ```sql
   SELECT table_name
   FROM information_schema.tables
   WHERE table_schema = 'public'
   AND table_name IN ('clinic_groups', 'clinic_group_members');
   ```

   Should return 2 rows.

5. **Test in Dashboard:**
   ```bash
   cd dashboard
   npm run dev
   ```
   - Open http://localhost:3000
   - Try selecting clinics with checkboxes
   - Group them together

## What This Migration Does

✅ Creates `clinic_groups` table
✅ Creates `clinic_group_members` junction table
✅ Adds `belongs_to_group_id` column to `clinics_pending_review`
✅ Sets up indexes for performance
✅ Enables Row Level Security
✅ Creates update triggers

## If Migration Fails

Check for existing tables:
```sql
DROP TABLE IF EXISTS clinic_group_members CASCADE;
DROP TABLE IF EXISTS clinic_groups CASCADE;
ALTER TABLE clinics_pending_review DROP COLUMN IF EXISTS belongs_to_group_id;
```

Then re-run the migration.
