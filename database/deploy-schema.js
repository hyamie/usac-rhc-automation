const fs = require('fs');
const path = require('path');

// Read environment variables
const SUPABASE_URL = 'https://fhuqiicgmfpnmficopqp.supabase.co';
const SUPABASE_SERVICE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZodXFpaWNnbWZwbm1maWNvcHFwIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2MjQzOTkzNiwiZXhwIjoyMDc4MDE1OTM2fQ.mftyuE4grE-CSaT-KQh6iyzV1pcdBnwyarGAm6OFbf8';

// Read SQL schema
const schemaPath = path.join(__dirname, 'schema.sql');
const schema = fs.readFileSync(schemaPath, 'utf8');

async function deploySchema() {
  console.log('Deploying database schema to Supabase...\n');
  
  try {
    // Use Supabase Management API to execute SQL
    const response = await fetch(`${SUPABASE_URL}/rest/v1/rpc/exec_sql`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': SUPABASE_SERVICE_KEY,
        'Authorization': `Bearer ${SUPABASE_SERVICE_KEY}`,
      },
      body: JSON.stringify({
        query: schema
      })
    });

    if (!response.ok) {
      // Try direct database connection API instead
      console.log('Trying alternative deployment method...\n');
      
      // Split schema into individual statements
      const statements = schema
        .split(';')
        .map(s => s.trim())
        .filter(s => s.length > 0 && !s.startsWith('--'));
      
      console.log(`Found ${statements.length} SQL statements to execute.\n`);
      console.log('Note: Some statements may fail if they already exist. This is normal.\n');
      
      // For now, just output instructions for manual deployment
      console.log('='.repeat(80));
      console.log('MANUAL DEPLOYMENT REQUIRED');
      console.log('='.repeat(80));
      console.log('\nPlease deploy the schema manually using one of these methods:\n');
      console.log('1. Via Supabase Dashboard:');
      console.log('   - Go to: https://supabase.com/dashboard/project/fhuqiicgmfpnmficopqp/sql/new');
      console.log('   - Copy the contents of: database/schema.sql');
      console.log('   - Paste into the SQL Editor');
      console.log('   - Click "Run" or press Ctrl+Enter\n');
      console.log('2. Via psql command line:');
      console.log('   - Get your database connection string from Supabase Dashboard');
      console.log('   - Run: psql <connection-string> < database/schema.sql\n');
      console.log('3. Via Supabase CLI (after installing with scoop/brew/etc):');
      console.log('   - Run: supabase db push --db-url <connection-string>\n');
      console.log('='.repeat(80));
      
      return false;
    }

    const result = await response.json();
    console.log('Schema deployed successfully!');
    console.log('Result:', result);
    return true;
    
  } catch (error) {
    console.error('Error deploying schema:', error.message);
    console.log('\n' + '='.repeat(80));
    console.log('MANUAL DEPLOYMENT REQUIRED');
    console.log('='.repeat(80));
    console.log('\nPlease deploy the schema manually:');
    console.log('1. Go to: https://supabase.com/dashboard/project/fhuqiicgmfpnmficopqp/sql/new');
    console.log('2. Copy the contents of: database/schema.sql');
    console.log('3. Paste into the SQL Editor');
    console.log('4. Click "Run" or press Ctrl+Enter\n');
    return false;
  }
}

deploySchema().then(success => {
  if (!success) {
    console.log('\nSchema file location:', schemaPath);
  }
  process.exit(success ? 0 : 1);
});
