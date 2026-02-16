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

  const supabase = createClient(supabaseUrl, supabaseKey);

  try {
    const migration1 = fs.readFileSync(
      path.join(__dirname, '../supabase/migrations/0001_init.sql'),
      'utf8'
    );
    console.log('\n→ Running migration 0001_init.sql...');
    const { error: error1 } = await supabase.rpc('exec_sql', { sql: migration1 });
    if (error1) {
      console.error('Note: Direct SQL execution via RPC may not be available.');
      console.error('Error:', error1.message);
      console.log('\n→ Attempting alternative method using Supabase SQL Editor...');
      throw new Error('Please run migrations manually via Supabase SQL Editor');
    }
    console.log('✓ Migration 0001_init.sql completed');

    const migration2 = fs.readFileSync(
      path.join(__dirname, '../supabase/migrations/0002_rls.sql'),
      'utf8'
    );
    console.log('\n→ Running migration 0002_rls.sql...');
    const { error: error2 } = await supabase.rpc('exec_sql', { sql: migration2 });
    if (error2) throw error2;
    console.log('✓ Migration 0002_rls.sql completed');

    console.log('\n✓ All migrations completed successfully!');

  } catch (error) {
    console.error('\n✗ Automated migration failed:', error.message);
    console.log('\n📋 Manual migration instructions:');
    console.log('1. Go to: https://supabase.com/dashboard/project/iaasxnhayilbbhgdkesh/sql/new');
    console.log('2. Copy and paste the contents of: supabase/migrations/0001_init.sql');
    console.log('3. Click "Run"');
    console.log('4. Then copy and paste: supabase/migrations/0002_rls.sql');
    console.log('5. Click "Run" again');
    console.log('\nOr use the Supabase CLI:');
    console.log('  supabase db push');
    process.exit(1);
  }
}

runMigrations();
