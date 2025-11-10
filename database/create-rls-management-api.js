// This script uses the Supabase Management API to execute SQL
// You need a Personal Access Token (PAT) from: https://supabase.com/dashboard/account/tokens

const SUPABASE_PROJECT_REF = 'fhuqiicgmfpnmficopqp';

// Get your PAT from: https://supabase.com/dashboard/account/tokens
// Then set it as an environment variable: SUPABASE_MANAGEMENT_TOKEN
const MANAGEMENT_TOKEN = process.env.SUPABASE_MANAGEMENT_TOKEN || '';

if (!MANAGEMENT_TOKEN) {
  console.error('❌ ERROR: SUPABASE_MANAGEMENT_TOKEN environment variable not set');
  console.log('\nTo use this script:');
  console.log('1. Go to: https://supabase.com/dashboard/account/tokens');
  console.log('2. Generate a Personal Access Token (PAT)');
  console.log('3. Run: set SUPABASE_MANAGEMENT_TOKEN=your-token-here');
  console.log('4. Run: node database/create-rls-management-api.js');
  console.log('\nAlternatively, use the Supabase Dashboard SQL Editor (recommended):');
  console.log('https://supabase.com/dashboard/project/fhuqiicgmfpnmficopqp/sql/new');
  process.exit(1);
}

const rlsSQL = `
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
`;

async function createRLSPolicies() {
  console.log('Creating RLS policies via Supabase Management API...\n');
  console.log('Project:', SUPABASE_PROJECT_REF);
  console.log('Token (last 4):', '...' + MANAGEMENT_TOKEN.slice(-4));
  console.log('');

  try {
    // Execute SQL via Management API
    const response = await fetch(
      `https://api.supabase.com/v1/projects/${SUPABASE_PROJECT_REF}/database/query`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${MANAGEMENT_TOKEN}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          query: rlsSQL
        })
      }
    );

    console.log('Response Status:', response.status);

    if (!response.ok) {
      const errorText = await response.text();
      console.error('❌ ERROR:', errorText);

      if (response.status === 401) {
        console.log('\n⚠ Authentication failed. Please check:');
        console.log('1. Your PAT is valid');
        console.log('2. Your PAT has the necessary permissions');
        console.log('3. Generate a new PAT: https://supabase.com/dashboard/account/tokens');
      }

      return false;
    }

    const result = await response.json();
    console.log('✓ SQL executed successfully');
    console.log('Result:', JSON.stringify(result, null, 2));

    // Verify the policies were created
    console.log('\nVerifying policies...');
    const verifyResponse = await fetch(
      `https://api.supabase.com/v1/projects/${SUPABASE_PROJECT_REF}/database/query`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${MANAGEMENT_TOKEN}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          query: `
            SELECT policyname, cmd, roles
            FROM pg_policies
            WHERE tablename = 'clinics_pending_review'
            ORDER BY policyname;
          `
        })
      }
    );

    if (verifyResponse.ok) {
      const verifyResult = await verifyResponse.json();
      console.log('\n✅ SUCCESS! Policies created:');
      console.log(JSON.stringify(verifyResult, null, 2));
    }

    return true;

  } catch (error) {
    console.error('❌ ERROR:', error.message);
    return false;
  }
}

createRLSPolicies().then(success => {
  if (!success) {
    console.log('\n📝 Manual alternative:');
    console.log('Go to: https://supabase.com/dashboard/project/fhuqiicgmfpnmficopqp/sql/new');
    console.log('And execute the SQL from: database/temp_rls_policies.sql');
  }
  process.exit(success ? 0 : 1);
});
