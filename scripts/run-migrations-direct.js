require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

async function runMigrations() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseKey) {
    console.error('✗ Missing Supabase credentials in .env.local');
    process.exit(1);
  }

  console.log('→ Connecting to Supabase...');
  console.log('  URL:', supabaseUrl);

  const supabase = createClient(supabaseUrl, supabaseKey, {
    auth: {
      persistSession: false
    }
  });

  try {
    // Read the combined migration file
    const migrationSQL = fs.readFileSync(
      path.join(__dirname, '../migrations-combined.sql'),
      'utf8'
    );

    console.log('\n→ Executing migrations via Supabase REST API...');
    
    // Split into individual statements and execute them
    const statements = migrationSQL
      .split(';')
      .map(s => s.trim())
      .filter(s => s.length > 0 && !s.startsWith('--'));

    console.log(`  Found ${statements.length} SQL statements to execute`);

    // Try to execute via SQL query endpoint
    const { data, error } = await supabase.rpc('exec_sql', { 
      query: migrationSQL 
    });

    if (error) {
      console.log('\n⚠️  Direct SQL execution not available via RPC.');
      console.log('   This is expected - Supabase restricts direct SQL execution via the anon key.');
      console.log('\n📋 Please run migrations manually:');
      console.log('\n1. Go to: https://supabase.com/dashboard/project/iaasxnhayilbbhgdkesh/sql/new');
      console.log('2. Copy the contents of: migrations-combined.sql');
      console.log('3. Paste into the SQL Editor and click "RUN"');
      console.log('\nThe file is located at:');
      console.log('  /Users/adham/CascadeProjects/eradaty/migrations-combined.sql');
      process.exit(1);
    }

    console.log('✓ Migrations completed successfully!');

  } catch (error) {
    console.error('\n✗ Error:', error.message);
    console.log('\n📋 Please run migrations manually via Supabase SQL Editor:');
    console.log('   https://supabase.com/dashboard/project/iaasxnhayilbbhgdkesh/sql/new');
    process.exit(1);
  }
}

runMigrations();
