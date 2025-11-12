#!/usr/bin/env node
/**
 * Execute Phase 4.2 Database Migrations
 * Direct execution using Supabase JS client
 */

const { createClient } = require('@supabase/supabase-js');
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

async function executeSQLFile(supabase, filePath, description) {
  log(`\n📄 ${description}`, 'blue');
  log(`   File: ${path.basename(filePath)}`, 'blue');

  try {
    const sqlContent = fs.readFileSync(filePath, 'utf8');

    // Use Supabase REST API to execute raw SQL
    // Since we're using service role key, we can use the PostgREST /rpc endpoint
    const response = await fetch(`${supabase.supabaseUrl}/rest/v1/rpc/exec`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': supabase.supabaseKey,
        'Authorization': `Bearer ${supabase.supabaseKey}`,
        'Prefer': 'return=representation'
      },
      body: JSON.stringify({ sql: sqlContent })
    });

    if (!response.ok) {
      // If exec RPC doesn't exist, we need to execute via SQL Editor
      // This is expected - Supabase doesn't expose raw SQL execution via API for security
      throw new Error('Direct SQL execution not available via API - use manual method');
    }

    log(`   ✅ Success`, 'green');
    return true;
  } catch (error) {
    log(`   ⚠️  ${error.message}`, 'yellow');
    return false;
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

    if (vmError && !vmError.message.includes('does not exist')) {
      log(`   ⚠️  Voice Model: ${vmError.message}`, 'yellow');
    } else if (voiceModel) {
      log(`   ✅ Voice Model v${voiceModel.version}: ${voiceModel.training_emails_count} emails, confidence ${voiceModel.confidence_score}`, 'green');
    } else {
      log(`   ⚠️  Voice Model: Not found`, 'yellow');
    }

    // Check templates
    const { data: templates, error: tmpError } = await supabase
      .from('email_templates')
      .select('version, template_variant, contact_type, tone')
      .eq('version', 'week-46-2025');

    if (tmpError && !tmpError.message.includes('does not exist')) {
      log(`   ⚠️  Templates: ${tmpError.message}`, 'yellow');
    } else if (templates && templates.length > 0) {
      log(`   ✅ Templates: Found ${templates.length} templates (${templates.map(t => t.template_variant).join(', ')})`, 'green');
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
  const supabaseUrl = env.SUPABASE_URL_USAC;
  const supabaseKey = env.SUPABASE_SERVICE_KEY_USAC;

  if (!supabaseUrl || !supabaseKey) {
    log('\n❌ Error: Missing Supabase credentials in config/.env', 'red');
    process.exit(1);
  }

  log(`\n🔗 Supabase URL: ${supabaseUrl}`, 'blue');

  // Create Supabase client
  const supabase = createClient(supabaseUrl, supabaseKey);

  // Try to execute migrations
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
  for (const migration of migrations) {
    const success = await executeSQLFile(supabase, migration.file, migration.description);
    if (!success) {
      needsManual = true;
      break;
    }
  }

  if (needsManual) {
    log('\n========================================', 'yellow');
    log('📋 Manual Execution Required', 'yellow');
    log('========================================', 'yellow');
    log('\nSupabase API doesn\'t support direct SQL execution.', 'yellow');
    log('\nPlease execute via Supabase Dashboard:', 'yellow');
    log('  URL: https://fhuqiicgmfpnmficopqp.supabase.co/project/_/sql', 'yellow');
    log('\nFiles to execute (in order):', 'yellow');
    migrations.forEach((m, i) => {
      log(`  ${i + 1}. ${m.file}`, 'yellow');
    });
    log('\nAfter executing, run this script with --verify-only', 'yellow');
    process.exit(1);
  }

  // Verify
  await verifyMigrations(supabase);

  log('\n========================================', 'green');
  log('✅ Migrations Complete!', 'green');
  log('========================================\n', 'green');
}

if (process.argv.includes('--verify-only')) {
  (async () => {
    const env = loadEnv();
    const supabase = createClient(env.SUPABASE_URL_USAC, env.SUPABASE_SERVICE_KEY_USAC);
    await verifyMigrations(supabase);
  })();
} else {
  main().catch(error => {
    log(`\n❌ Fatal Error: ${error.message}`, 'red');
    console.error(error);
    process.exit(1);
  });
}
