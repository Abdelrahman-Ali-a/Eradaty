const fs = require('fs');
const path = require('path');
const { Client } = require('pg');
require('dotenv').config({ path: '.env.local' });

const MIGRATIONS_DIR = path.join(__dirname, 'supabase', 'migrations');

async function migrate() {
    if (!process.env.DATABASE_URL) {
        console.error('❌ Error: DATABASE_URL is missing in .env.local');
        process.exit(1);
    }

    const client = new Client({
        connectionString: process.env.DATABASE_URL,
        // Supabase requires SSL, but sometimes strict verification fails in dev
        ssl: { rejectUnauthorized: false }
    });

    try {
        console.log('Connecting to database...');
        await client.connect();

        // Create migrations table to track history
        await client.query(`
      CREATE TABLE IF NOT EXISTS _migrations (
        name TEXT PRIMARY KEY,
        applied_at TIMESTAMPTZ DEFAULT NOW()
      );
    `);

        // Get applied migrations
        const { rows: applied } = await client.query('SELECT name FROM _migrations');
        const appliedNames = new Set(applied.map(r => r.name));

        // Get all migration files
        if (!fs.existsSync(MIGRATIONS_DIR)) {
            console.error(`❌ Migration directory not found: ${MIGRATIONS_DIR}`);
            process.exit(1);
        }

        const files = fs.readdirSync(MIGRATIONS_DIR)
            .filter(f => f.endsWith('.sql'))
            .sort(); // Ensure alphanumeric order

        if (files.length === 0) {
            console.log('No migration files found.');
            return;
        }

        console.log(`Found ${files.length} migration files.`);

        for (const file of files) {
            if (appliedNames.has(file)) {
                // Skip silently or log verbose? logging is nice.
                // console.log(`Skipping ${file} (already applied)`);
                continue;
            }

            console.log(`Applying ${file}...`);
            const content = fs.readFileSync(path.join(MIGRATIONS_DIR, file), 'utf8');

            try {
                await client.query('BEGIN');

                // Split by semicolon? No, pg driver can run multiple statements usually, 
                // but sometimes strictly implies one.
                // However, standard pg query execution with multiple statements is supported in simple query protocol.
                // Only potential issue is if the driver or DB config disallows multiple. 
                // Supabase usually allows it.
                await client.query(content);

                await client.query('INSERT INTO _migrations (name) VALUES ($1)', [file]);
                await client.query('COMMIT');
                console.log(`✅ Applied ${file}`);
            } catch (err) {
                await client.query('ROLLBACK');
                console.error(`❌ Failed to apply ${file}:`);
                console.error(err.message);

                // Special advice for common errors
                if (err.message.includes('already exists')) {
                    console.log('   Hint: The object already exists. If you are applying migrations to an existing DB, consider marking this as applied manually or ensuring migrations are idempotent (IF NOT EXISTS).');
                    // Check if we should mark it as applied if it failed due to existence? 
                    // Only purely safe if we prompt user. For now, exit.
                }
                process.exit(1);
            }
        }

        console.log('🎉 All migrations checked and applied successfully!');

    } catch (err) {
        console.error('Migration script error:', err);
    } finally {
        await client.end();
    }
}

migrate();
