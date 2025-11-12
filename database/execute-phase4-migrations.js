#!/usr/bin/env node
/**
 * Execute Phase 4.2 Database Migrations
 * Uses Supabase JS client to run SQL migrations
 * Created: 2025-11-11
 */

const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// Load environment variables
require('dotenv').config({ path: path.join(__dirname, '../../../config/.env') });

// ANSI color codes
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

async function executeSQLFile(supabase, filePath, description) {
  log(`\n📄 ${description}`, 'blue');
  log(`   File: ${path.basename(filePath)}`, 'blue');

  try {
    // Read SQL file
    const sqlContent = fs.readFileSync(filePath, 'utf8');

    // Execute SQL using Supabase RPC (raw SQL execution)
    const { data, error } = await supabase.rpc('exec_sql', {
      sql_query: sqlContent
    });

    if (error) {
      // Try alternative: execute via REST API
      log(`   Trying alternative method...`, 'yellow');

      // Split SQL into individual statements and execute
      const statements = sqlContent
        .split(';')
        .map(s => s.trim())
        .filter(s => s.length > 0 && !s.startsWith('--'));

      for (const statement of statements) {
        const { error: stmtError } = await supabase.rpc('exec', {
          query: statement
        });

        if (stmtError && !stmtError.message.includes('already exists')) {
          throw stmtError;
        }
      }
    }

    log(`   ✅ Success`, 'green');
    return true;
  } catch (error) {
    log(`   ❌ Error: ${error.message}`, 'red');

    // If it's a "function does not exist" error, provide manual instructions
    if (error.message.includes('function') || error.message.includes('does not exist')) {
      log(`\n   ⚠️  Direct SQL execution not available via API`, 'yellow');
      log(`   Please execute manually via Supabase Dashboard:`, 'yellow');
      log(`   1. Go to: https://fhuqiicgmfpnmficopqp.supabase.co/project/_/sql`, 'yellow');
      log(`   2. Copy contents of: ${filePath}`, 'yellow');
      log(`   3. Paste and click "Run"`, 'yellow');
      return false;
    }

    throw error;
  }
}

async function verifyMigrations(supabase) {
  log(`\n🔍 Verifying Migrations...`, 'blue');

  try {
    // Check voice model
    const { data: voiceModel, error: vmError } = await supabase
      .from('voice_model')
      .select('version, confidence_score, training_emails_count, active')
      .eq('active', true)
      .single();

    if (vmError) {
      log(`   ⚠️  Voice Model: Not found or error: ${vmError.message}`, 'yellow');
    } else {
      log(`   ✅ Voice Model v${voiceModel.version}: ${voiceModel.training_emails_count} emails, confidence ${voiceModel.confidence_score}`, 'green');
    }

    // Check templates
    const { data: templates, error: tmpError } = await supabase
      .from('email_templates')
      .select('version, template_variant, contact_type, tone')
      .eq('version', 'week-46-2025');

    if (tmpError) {
      log(`   ⚠️  Templates: Not found or error: ${tmpError.message}`, 'yellow');
    } else {
      log(`   ✅ Templates: Found ${templates.length} templates (${templates.map(t => t.template_variant).join(', ')})`, 'green');
      templates.forEach(t => {
        log(`      - Variant ${t.template_variant}: ${t.tone} tone for ${t.contact_type}`, 'green');
      });
    }

    // Check tables exist
    const { data: tables, error: tablesError } = await supabase
      .rpc('get_tables');

    if (!tablesError && tables) {
      const emailTables = tables.filter(t =>
        t.table_name.startsWith('email_') ||
        ['voice_model', 'weekly_performance'].includes(t.table_name)
      );
      log(`   ✅ Tables created: ${emailTables.length}`, 'green');
    }

    return true;
  } catch (error) {
    log(`   ⚠️  Verification partially failed: ${error.message}`, 'yellow');
    return false;
  }
}

async function main() {
  log('\n========================================', 'blue');
  log('Phase 4.2: Database Migrations', 'blue');
  log('========================================', 'blue');

  // Check environment variables
  const supabaseUrl = process.env.SUPABASE_URL_USAC;
  const supabaseKey = process.env.SUPABASE_SERVICE_KEY_USAC;

  if (!supabaseUrl || !supabaseKey) {
    log('\n❌ Error: Missing Supabase credentials', 'red');
    log('Required environment variables:', 'red');
    log('  - SUPABASE_URL_USAC', 'red');
    log('  - SUPABASE_SERVICE_KEY_USAC', 'red');
    log('\nMake sure config/.env is properly configured.', 'red');
    process.exit(1);
  }

  log(`\n🔗 Supabase URL: ${supabaseUrl}`, 'blue');

  // Create Supabase client
  const supabase = createClient(supabaseUrl, supabaseKey);

  // Migration files
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

  let needsManual = false;

  // Execute migrations
  for (const migration of migrations) {
    const success = await executeSQLFile(supabase, migration.file, migration.description);
    if (!success) {
      needsManual = true;
    }
  }

  if (needsManual) {
    log('\n========================================', 'yellow');
    log('⚠️  Manual Execution Required', 'yellow');
    log('========================================', 'yellow');
    log('\nThe Supabase REST API doesn\'t support direct SQL execution.', 'yellow');
    log('Please execute the migrations manually:', 'yellow');
    log('\n1. Open Supabase Dashboard SQL Editor:', 'yellow');
    log('   https://fhuqiicgmfpnmficopqp.supabase.co/project/_/sql', 'yellow');
    log('\n2. Execute these files in order:', 'yellow');
    migrations.forEach((m, i) => {
      log(`   ${i + 1}. ${m.file}`, 'yellow');
      log(`      ${m.description}`, 'yellow');
    });
    log('\n3. Then run verification:', 'yellow');
    log('   node database/execute-phase4-migrations.js --verify-only', 'yellow');
    process.exit(1);
  }

  // Verify migrations
  await verifyMigrations(supabase);

  log('\n========================================', 'green');
  log('✅ Database Migrations Complete!', 'green');
  log('========================================', 'green');

  log('\n📋 Next Steps:', 'blue');
  log('1. Import n8n workflow: workflows/outreach_email_generation.json', 'blue');
  log('2. Configure API credentials (Perplexity, O365)', 'blue');
  log('3. Update dashboard/.env.local with webhook URL', 'blue');
  log('4. Test end-to-end email generation', 'blue');
  log('');
}

// Handle --verify-only flag
if (process.argv.includes('--verify-only')) {
  (async () => {
    const supabaseUrl = process.env.SUPABASE_URL_USAC;
    const supabaseKey = process.env.SUPABASE_SERVICE_KEY_USAC;

    if (!supabaseUrl || !supabaseKey) {
      log('❌ Missing credentials', 'red');
      process.exit(1);
    }

    const supabase = createClient(supabaseUrl, supabaseKey);
    await verifyMigrations(supabase);
  })();
} else {
  main().catch(error => {
    log(`\n❌ Fatal Error: ${error.message}`, 'red');
    console.error(error);
    process.exit(1);
  });
}
