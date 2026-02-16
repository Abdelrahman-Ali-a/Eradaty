require('dotenv').config({ path: '.env.local' });
const { Client } = require('pg');
const fs = require('fs');
const path = require('path');

async function runMigrations() {
  const client = new Client({
    connectionString: process.env.DATABASE_URL
  });

  try {
    await client.connect();
    console.log('✓ Connected to Supabase database');

    const migration1 = fs.readFileSync(
      path.join(__dirname, '../supabase/migrations/0001_init.sql'),
      'utf8'
    );
    console.log('\n→ Running migration 0001_init.sql...');
    await client.query(migration1);
    console.log('✓ Migration 0001_init.sql completed');

    const migration2 = fs.readFileSync(
      path.join(__dirname, '../supabase/migrations/0002_rls.sql'),
      'utf8'
    );
    console.log('\n→ Running migration 0002_rls.sql...');
    await client.query(migration2);
    console.log('✓ Migration 0002_rls.sql completed');

    console.log('\n✓ All migrations completed successfully!');
    console.log('\nCreated tables:');
    console.log('  - brands');
    console.log('  - costs');
    console.log('  - shopify_connections');
    console.log('  - shopify_orders');
    console.log('  - meta_connections');
    console.log('  - meta_daily_spend');
    console.log('\nCreated enums:');
    console.log('  - cost_category');
    console.log('  - recurring_period');
    console.log('\n✓ Row Level Security (RLS) enabled on all tables');

  } catch (error) {
    console.error('✗ Migration failed:', error.message);
    console.error('Full error:', error);
    process.exit(1);
  } finally {
    await client.end();
  }
}

runMigrations();
