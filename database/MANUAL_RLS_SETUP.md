# Manual RLS Policy Setup Instructions

## Issue
The Supabase API does not allow direct SQL execution for security reasons. We need to create the RLS policies manually via the Supabase Dashboard.

## SQL to Execute

```sql
-- Drop existing policies if they exist (to make this idempotent)
DROP POLICY IF EXISTS "Service role can insert" ON clinics_pending_review;
DROP POLICY IF EXISTS "Service role can select" ON clinics_pending_review;
DROP POLICY IF EXISTS "Service role can update" ON clinics_pending_review;

-- Allow service role to insert data
CREATE POLICY "Service role can insert"
ON clinics_pending_review
FOR INSERT
TO service_role
WITH CHECK (true);

-- Allow service role to select data
CREATE POLICY "Service role can select"
ON clinics_pending_review
FOR SELECT
TO service_role
USING (true);

-- Allow service role to update data
CREATE POLICY "Service role can update"
ON clinics_pending_review
FOR UPDATE
TO service_role
USING (true)
WITH CHECK (true);
```

## Steps to Execute

1. Go to the Supabase SQL Editor:
   https://supabase.com/dashboard/project/fhuqiicgmfpnmficopqp/sql/new

2. Copy the SQL above

3. Paste it into the SQL Editor

4. Click "Run" or press Ctrl+Enter

5. Verify the policies were created:
   ```sql
   SELECT
     schemaname,
     tablename,
     policyname,
     permissive,
     roles,
     cmd
   FROM pg_policies
   WHERE tablename = 'clinics_pending_review'
   ORDER BY policyname;
   ```

## Expected Result

You should see 3 policies:
1. Service role can insert (FOR INSERT)
2. Service role can select (FOR SELECT)
3. Service role can update (FOR UPDATE)

## Why These Policies Are Needed

The n8n workflows use the service_role key to insert and update data in the `clinics_pending_review` table. Without these RLS policies, n8n gets 403 Forbidden errors when trying to write data, even with the service_role key.

## Alternative: Using Supabase MCP (if available)

If the Supabase MCP server is properly configured in Claude Code, you can also execute SQL using the `execute_sql` MCP tool, which bypasses the REST API limitations.
