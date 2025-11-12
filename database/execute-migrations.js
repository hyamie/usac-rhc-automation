#!/usr/bin/env node
/**
 * Execute Phase 4.2 Database Migrations
 * Uses PostgreSQL client for direct SQL execution
 */

const { Client } = require('pg');
const fs = require('fs');
const path = require('path');

// Colors
const colors = {
  reset: '\x1b[0m',
  blue: '\x1b[34m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m'
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

// Load environment from config/.env
function loadEnv() {
  const envPath = path.join(__dirname, '../../../config/.env');
  const envContent = fs.readFileSync(envPath, 'utf8');

  const env = {};
  envContent.split('\n').forEach(line => {
    line = line.trim();
    if (line && !line.startsWith('#')) {
      const [key, ...valueParts] = line.split('=');
      if (key && valueParts.length > 0) {
        env[key.trim()] = valueParts.join('=').trim().replace(/^["']|["']$/g, '');
      }
    }
  });

  return env;
}

async function executeSQLFile(client, filePath, description) {
  log(`\n📄 ${description}`, 'blue');
  log(`   File: ${path.basename(filePath)}`, 'blue');

  try {
    const sqlContent = fs.readFileSync(filePath, 'utf8');

    // Execute the SQL
    await client.query(sqlContent);

    log(`   ✅ Success`, 'green');
    return true;
  } catch (error) {
    log(`   ❌ Error: ${error.message}`, 'red');

    // Check if it's just a "already exists" error, which is OK
    if (error.message.includes('already exists')) {
      log(`   ⚠️  Some objects already exist - continuing`, 'yellow');
      return true;
    }

    return false;
  }
}

async function verifyMigrations(client) {
  log(`\n🔍 Verifying Migrations...`, 'blue');

  try {
    // Check tables
    const tablesResult = await client.query(`
      SELECT table_name
      FROM information_schema.tables
      WHERE table_schema = 'public'
        AND (table_name LIKE 'email_%'
          OR table_name IN ('weekly_performance', 'voice_model'))
      ORDER BY table_name;
    `);

    log(`   ✅ Tables created: ${tablesResult.rows.length}`, 'green');
    tablesResult.rows.forEach(row => {
      log(`      - ${row.table_name}`, 'green');
    });

    // Check voice model
    const vmResult = await client.query(`
      SELECT version, confidence_score, training_emails_count, active
      FROM voice_model
      WHERE active = true;
    `);

    if (vmResult.rows.length > 0) {
      const vm = vmResult.rows[0];
      log(`   ✅ Voice Model v${vm.version}: ${vm.training_emails_count} emails, confidence ${vm.confidence_score}`, 'green');
    } else {
      log(`   ⚠️  Voice Model: Not found`, 'yellow');
    }

    // Check templates
    const templateResult = await client.query(`
      SELECT version, template_variant, contact_type, tone
      FROM email_templates
      WHERE version = 'week-46-2025'
      ORDER BY template_variant;
    `);

    if (templateResult.rows.length > 0) {
      log(`   ✅ Templates: Found ${templateResult.rows.length} templates`, 'green');
      templateResult.rows.forEach(t => {
        log(`      - Variant ${t.template_variant}: ${t.tone} tone for ${t.contact_type}`, 'green');
      });
    } else {
      log(`   ⚠️  Templates: Not found`, 'yellow');
    }

    return true;
  } catch (error) {
    log(`   ⚠️  Verification error: ${error.message}`, 'yellow');
    return false;
  }
}

async function main() {
  log('\n========================================', 'blue');
  log('Phase 4.2: Database Migrations', 'blue');
  log('========================================', 'blue');

  // Load environment
  const env = loadEnv();

  // Get Supabase connection string
  // Format: postgresql://postgres.[project-ref]:[password]@[host]:6543/postgres
  let connectionString = env.POSTGRES_URL;

  if (!connectionString || connectionString.includes('[project-ref]') || connectionString.includes('[password]')) {
    // Build from Supabase details
    const supabaseUrl = env.SUPABASE_URL_USAC;
    const serviceKey = env.SUPABASE_SERVICE_KEY_USAC;

    if (!supabaseUrl || !serviceKey) {
      log('\n❌ Error: Missing database connection info', 'red');
      log('Need either POSTGRES_URL or SUPABASE_URL_USAC + SUPABASE_SERVICE_KEY_USAC', 'red');
      process.exit(1);
    }

    // Extract project ref from Supabase URL
    const projectRef = supabaseUrl.match(/https:\/\/([^.]+)\.supabase\.co/)?.[1];

    if (!projectRef) {
      log('\n❌ Error: Could not extract project ref from SUPABASE_URL_USAC', 'red');
      log(`URL: ${supabaseUrl}`, 'red');
      process.exit(1);
    }

    // Use service role key as password (Supabase allows this for direct connections)
    connectionString = `postgresql://postgres:${serviceKey}@db.${projectRef}.supabase.co:5432/postgres`;
  }

  log(`\n🔗 Connecting to database...`, 'blue');

  // Create PostgreSQL client
  const client = new Client({
    connectionString,
    ssl: { rejectUnauthorized: false } // Supabase uses SSL
  });

  try {
    await client.connect();
    log(`   ✅ Connected`, 'green');

    // Execute migrations
    const migrationsDir = __dirname;
    const migrations = [
      {
        file: path.join(migrationsDir, 'phase4_migrations.sql'),
        description: 'Phase 4 Migrations (5 tables + policies)'
      },
      {
        file: path.join(migrationsDir, 'phase4_bootstrap_voice_model.sql'),
        description: 'Voice Model v1 (Mike\'s email patterns)'
      },
      {
        file: path.join(migrationsDir, '../insert_templates_week-46-2025_direct.sql'),
        description: 'Week 46-2025 Templates (A/B/C variants)'
      }
    ];

    let allSuccess = true;
    for (const migration of migrations) {
      const success = await executeSQLFile(client, migration.file, migration.description);
      if (!success) {
        allSuccess = false;
      }
    }

    if (!allSuccess) {
      log('\n⚠️  Some migrations had errors', 'yellow');
    }

    // Verify
    await verifyMigrations(client);

    log('\n========================================', 'green');
    log('✅ Database Migrations Complete!', 'green');
    log('========================================', 'green');

    log('\n📋 Next Steps:', 'blue');
    log('1. Import n8n workflow: workflows/outreach_email_generation.json', 'blue');
    log('2. Configure API credentials (Perplexity, O365)', 'blue');
    log('3. Update dashboard/.env.local with webhook URL', 'blue');
    log('4. Test end-to-end email generation\n', 'blue');

  } catch (error) {
    log(`\n❌ Connection Error: ${error.message}`, 'red');
    log('\nTroubleshooting:', 'yellow');
    log('1. Verify POSTGRES_URL in config/.env is correct', 'yellow');
    log('2. Check Supabase project is running', 'yellow');
    log('3. Verify database credentials are valid', 'yellow');
    log('\nAlternative: Use Supabase Dashboard SQL Editor', 'yellow');
    log('  URL: https://fhuqiicgmfpnmficopqp.supabase.co/project/_/sql\n', 'yellow');
    process.exit(1);
  } finally {
    await client.end();
  }
}

// Run
main().catch(error => {
  log(`\n❌ Fatal Error: ${error.message}`, 'red');
  console.error(error.stack);
  process.exit(1);
});
