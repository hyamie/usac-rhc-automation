# RLS Policy Setup Summary

## Status: Ready for Manual Execution

## What We Discovered

1. **Supabase MCP is configured correctly**
   - Environment variables set in C:\ClaudeAgents\config\.env
   - SUPABASE_URL: https://fhuqiicgmfpnmficopqp.supabase.co
   - SUPABASE_SERVICE_KEY: Configured (service_role key)
   - MCP configuration: C:\ClaudeAgents\.mcp.json

2. **Supabase API Limitations**
   - Supabase does NOT allow arbitrary SQL execution via REST API for security
   - The `/rest/v1/rpc/exec_sql` endpoint was removed
   - Direct PostgreSQL connection requires the database password (not service role key)
   - Management API requires a Personal Access Token (PAT)

## Solutions Available

### Option 1: Supabase Dashboard (RECOMMENDED - 2 minutes)

**This is the fastest and most reliable method.**

1. Go to: https://supabase.com/dashboard/project/fhuqiicgmfpnmficopqp/sql/new

2. Copy and paste this SQL:

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

3. Click "Run" or press Ctrl+Enter

4. Verify with this query:

```sql
SELECT policyname, cmd, roles
FROM pg_policies
WHERE tablename = 'clinics_pending_review'
ORDER BY policyname;
```

Expected output: 3 policies (insert, select, update)

### Option 2: Management API (Requires PAT)

If you need programmatic execution:

1. Generate a Personal Access Token: https://supabase.com/dashboard/account/tokens

2. Set environment variable:
```bash
set SUPABASE_MANAGEMENT_TOKEN=your-token-here
```

3. Run the script:
```bash
node database/create-rls-management-api.js
```

### Option 3: Direct PostgreSQL Connection (Requires DB Password)

1. Get database password: https://supabase.com/dashboard/project/fhuqiicgmfpnmficopqp/settings/database

2. Update connection string in `database/create-rls-policies.js`

3. Run: `node database/create-rls-policies.js`

### Option 4: Supabase MCP (If Active in Claude Code)

If the Supabase MCP server is active and accessible in your Claude Code session, it provides an `execute_sql` tool that can execute this SQL directly.

**Note:** MCP tools are managed by Claude Code and may not always be accessible from within a script execution context.

## Why These Policies Are Critical

**Current Problem:**
- n8n workflows use the service_role key
- RLS still applies even to service_role unless explicitly granted
- Without these policies: 403 Forbidden errors on INSERT/UPDATE
- Current error: "new row violates row-level security policy"

**After Adding Policies:**
- service_role can bypass RLS for this table
- n8n can successfully insert clinic data
- n8n can update clinic data
- Table remains protected from unauthorized access

## Files Created

1. `C:\ClaudeAgents\projects\usac-rhc-automation\database\temp_rls_policies.sql`
   - The SQL to execute

2. `C:\ClaudeAgents\projects\usac-rhc-automation\database\create-rls-management-api.js`
   - Script using Management API (requires PAT)

3. `C:\ClaudeAgents\projects\usac-rhc-automation\database\create-rls-policies.js`
   - Script using direct PostgreSQL connection (requires DB password)

4. `C:\ClaudeAgents\projects\usac-rhc-automation\database\MANUAL_RLS_SETUP.md`
   - Manual setup instructions

5. `C:\ClaudeAgents\projects\usac-rhc-automation\database\create-rls-via-sql-editor.md`
   - Detailed explanation of all options

## Recommended Next Step

**Use Option 1 (Dashboard)** - It takes 2 minutes and is 100% reliable.

After executing the SQL, please confirm the policies were created, and then test your n8n workflow again. The 403 errors should be resolved.

## Testing After Setup

Run your n8n workflow that inserts data into `clinics_pending_review`. It should now succeed without 403 Forbidden errors.

## Supabase MCP Configuration Verified

The Supabase MCP is properly configured in C:\ClaudeAgents\.mcp.json:

```json
{
  "supabase": {
    "type": "stdio",
    "command": "npx",
    "args": ["-y", "@supabase/mcp-server"],
    "env": {
      "SUPABASE_URL": "${SUPABASE_URL}",
      "SUPABASE_SERVICE_ROLE_KEY": "${SUPABASE_SERVICE_KEY}"
    }
  }
}
```

Environment variables are set in C:\ClaudeAgents\config\.env and the MCP should be available for use in Claude Code sessions.
