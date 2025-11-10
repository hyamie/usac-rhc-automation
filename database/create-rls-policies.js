const { Client } = require('pg');

// Supabase connection details
const SUPABASE_URL = 'https://fhuqiicgmfpnmficopqp.supabase.co';
const SUPABASE_SERVICE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZodXFpaWNnbWZwbm1maWNvcHFwIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2MjQzOTkzNiwiZXhwIjoyMDc4MDE1OTM2fQ.mftyuE4grE-CSaT-KQh6iyzV1pcdBnwyarGAm6OFbf8';

// Extract project ref from URL
const projectRef = 'fhuqiicgmfpnmficopqp';

// PostgreSQL connection string for Supabase
// Format: postgresql://postgres.[project-ref]:[service-role-key]@aws-0-us-east-1.pooler.supabase.com:6543/postgres
const connectionString = `postgresql://postgres.${projectRef}:${SUPABASE_SERVICE_KEY}@aws-0-us-east-1.pooler.supabase.com:6543/postgres`;

// RLS Policies SQL
const rlsPoliciesSQL = `
-- Drop existing policies if they exist (to make this script idempotent)
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
  console.log('Creating RLS policies for clinics_pending_review table...\n');
  console.log('Project:', projectRef);
  console.log('Connection: Supabase PostgreSQL pooler\n');

  const client = new Client({
    connectionString,
    ssl: { rejectUnauthorized: false }
  });

  try {
    // Connect to database
    console.log('Connecting to database...');
    await client.connect();
    console.log('✓ Connected successfully\n');

    // Execute the RLS policies SQL
    console.log('Executing RLS policies SQL...');
    const result = await client.query(rlsPoliciesSQL);
    console.log('✓ RLS policies executed successfully\n');

    // Verify the policies were created
    console.log('Verifying policies...');
    const verifyQuery = `
      SELECT
        schemaname,
        tablename,
        policyname,
        permissive,
        roles,
        cmd,
        qual,
        with_check
      FROM pg_policies
      WHERE tablename = 'clinics_pending_review'
      ORDER BY policyname;
    `;

    const policies = await client.query(verifyQuery);

    if (policies.rows.length === 0) {
      console.log('⚠ WARNING: No policies found for clinics_pending_review table!');
    } else {
      console.log(`✓ Found ${policies.rows.length} policies:\n`);
      policies.rows.forEach((policy, idx) => {
        console.log(`${idx + 1}. Policy: "${policy.policyname}"`);
        console.log(`   Command: ${policy.cmd}`);
        console.log(`   Roles: ${JSON.stringify(policy.roles)}`);
        console.log(`   Using: ${policy.qual || 'N/A'}`);
        console.log(`   With Check: ${policy.with_check || 'N/A'}`);
        console.log('');
      });
    }

    console.log('✅ SUCCESS: RLS policies created and verified!');
    return true;

  } catch (error) {
    console.error('❌ ERROR:', error.message);
    console.error('\nFull error:', error);
    return false;
  } finally {
    await client.end();
    console.log('\nDatabase connection closed.');
  }
}

// Run the script
createRLSPolicies().then(success => {
  process.exit(success ? 0 : 1);
});
