/**
 * Marks existing migrations as applied without running them.
 * Use once when the database schema was created via synchronize
 * and you are switching to TypeORM migrations.
 *
 * Usage: npm run migration:baseline
 */
import { existsSync } from 'node:fs';
import { join } from 'node:path';
import { config } from 'dotenv';
import { Client } from 'pg';

const backendRoot = join(__dirname, '..', '..');

for (const envFile of ['.env', '.env.example']) {
    const envPath = join(backendRoot, envFile);

    if (existsSync(envPath)) {
        config({ path: envPath });
        break;
    }
}

const appliedMigrations = [
    { timestamp: 1740000000000, name: 'InitialSchema1740000000000' },
    { timestamp: 1740000000001, name: 'MigrateLegacyRoleEnum1740000000001' },
];

async function main(): Promise<void> {
    const client = new Client({
        host: process.env.DB_HOST,
        port: parseInt(process.env.DB_PORT ?? '5432', 10),
        user: process.env.DB_USERNAME,
        password: process.env.DB_PASSWORD,
        database: process.env.DB_DATABASE,
    });

    await client.connect();

    try {
        await client.query(`
            CREATE TABLE IF NOT EXISTS "migrations" (
                "id" SERIAL NOT NULL,
                "timestamp" bigint NOT NULL,
                "name" character varying NOT NULL,
                CONSTRAINT "PK_8c82d7f526340ab734260ea46be" PRIMARY KEY ("id")
            )
        `);

        for (const migration of appliedMigrations) {
            const existing = await client.query<{ id: number }>(
                `SELECT id FROM migrations WHERE name = $1 LIMIT 1`,
                [migration.name],
            );

            if (existing.rows.length > 0) {
                console.log(`Already baselined: ${migration.name}`);
                continue;
            }

            await client.query(
                `INSERT INTO migrations (timestamp, name) VALUES ($1, $2)`,
                [migration.timestamp, migration.name],
            );

            console.log(`Baselined: ${migration.name}`);
        }
    } finally {
        await client.end();
    }
}

main().catch((error) => {
    console.error(error);
    process.exit(1);
});
