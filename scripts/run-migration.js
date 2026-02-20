// Quick script to run the category migration
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://iaasxnhayilbbhgdkesh.supabase.co';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || 'your-service-key-here';

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function runMigration() {
    console.log('Running category migration...');

    const sql = `
    -- Change category from enum to text
    alter table public.costs 
      alter column category type text using category::text;
    
    -- Drop the old enum type
    drop type if exists public.cost_category cascade;
    
    -- Add comment
    comment on column public.costs.category is 'Cost category - accepts any text value for flexibility with OCR extraction';
  `;

    const { data, error } = await supabase.rpc('exec_sql', { sql_query: sql });

    if (error) {
        console.error('Migration error:', error);
        process.exit(1);
    }

    console.log('✅ Migration completed successfully!');
    process.exit(0);
}

runMigration();
