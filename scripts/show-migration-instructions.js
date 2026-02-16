const fs = require('fs');
const path = require('path');

console.log('\n╔════════════════════════════════════════════════════════════════╗');
console.log('║          SUPABASE DATABASE MIGRATION INSTRUCTIONS              ║');
console.log('╚════════════════════════════════════════════════════════════════╝\n');

console.log('📋 Follow these steps to create your database tables:\n');

console.log('1. Open Supabase SQL Editor:');
console.log('   https://supabase.com/dashboard/project/iaasxnhayilbbhgdkesh/sql/new\n');

console.log('2. Copy the SQL below and paste it into the SQL Editor:\n');
console.log('═'.repeat(70));

const migration1 = fs.readFileSync(
  path.join(__dirname, '../supabase/migrations/0001_init.sql'),
  'utf8'
);
const migration2 = fs.readFileSync(
  path.join(__dirname, '../supabase/migrations/0002_rls.sql'),
  'utf8'
);

const fullMigration = `-- Migration 0001: Create tables, enums, and triggers
${migration1}

-- Migration 0002: Enable Row Level Security (RLS)
${migration2}`;

console.log(fullMigration);
console.log('═'.repeat(70));

console.log('\n3. Click the "RUN" button in the SQL Editor\n');

console.log('✓ This will create:');
console.log('  • Tables: brands, costs, shopify_connections, shopify_orders,');
console.log('           meta_connections, meta_daily_spend');
console.log('  • Enums: cost_category, recurring_period');
console.log('  • Triggers: auto-update timestamps');
console.log('  • RLS Policies: secure data access per user/brand\n');

console.log('💾 The SQL has also been saved to: migrations-combined.sql\n');

fs.writeFileSync(
  path.join(__dirname, '../migrations-combined.sql'),
  fullMigration,
  'utf8'
);
