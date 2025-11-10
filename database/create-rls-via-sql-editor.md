# Creating RLS Policies - Best Approach

## The Problem

Supabase does not allow arbitrary SQL execution via REST API for security reasons. We have several options:

## Option 1: Supabase Dashboard (RECOMMENDED - Fastest)

1. Go to: https://supabase.com/dashboard/project/fhuqiicgmfpnmficopqp/sql/new

2. Execute this SQL:

```sql
-- Drop existing policies if they exist
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

3. Verify with:

```sql
SELECT policyname, cmd, roles
FROM pg_policies
WHERE tablename = 'clinics_pending_review';
```

## Option 2: Supabase MCP (If Available)

If the Supabase MCP server is active in Claude Code, it provides an `execute_sql` tool that can run this directly.

**Environment Variables Configured:**
- SUPABASE_URL: https://fhuqiicgmfpnmficopqp.supabase.co
- SUPABASE_SERVICE_KEY: (service_role key configured)

**MCP Configuration:** C:\ClaudeAgents\.mcp.json (supabase server configured)

## Option 3: Direct PostgreSQL Connection (Requires DB Password)

To connect directly to the PostgreSQL database:

1. Get your database password from: https://supabase.com/dashboard/project/fhuqiicgmfpnmficopqp/settings/database

2. Update connection string in script:
```
postgresql://postgres.fhuqiicgmfpnmficopqp:[DB-PASSWORD]@aws-0-us-east-1.pooler.supabase.com:5432/postgres
```

3. Run: `node database/create-rls-policies.js`

## Why We Need These Policies

n8n workflows use the service_role key but RLS still applies. Without these policies:
- GET/POST/PATCH requests to `/clinics_pending_review` return 403 Forbidden
- Data cannot be inserted or updated even with service_role key

With these policies:
- service_role can bypass RLS restrictions
- n8n can successfully insert/update clinic data
- The table remains protected from unauthorized access

## Next Steps

Please choose Option 1 (Dashboard) for quickest resolution, then confirm the policies were created successfully.
