import { join } from 'node:path';
import { DataSourceOptions } from 'typeorm';

function readDatabaseEnv(env: NodeJS.ProcessEnv): {
    host: string;
    port: number;
    username: string;
    password: string;
    database: string;
} {
    const host = env.DB_HOST;
    const port = env.DB_PORT;
    const username = env.DB_USERNAME;
    const password = env.DB_PASSWORD;
    const database = env.DB_DATABASE;

    if (!host || !port || !username || !password || !database) {
        throw new Error(
            'Database env vars are required: DB_HOST, DB_PORT, DB_USERNAME, DB_PASSWORD, DB_DATABASE',
        );
    }

    return {
        host,
        port: parseInt(port, 10),
        username,
        password,
        database,
    };
}

export function getMigrationsDir(): string {
    return join(__dirname, 'migrations');
}

export function buildDatabaseConnectionOptions(env: NodeJS.ProcessEnv): DataSourceOptions {
    return {
        type: 'postgres',
        ...readDatabaseEnv(env),
        migrations: [join(__dirname, 'migrations', '*.{js}')],
        migrationsRun: true,
        synchronize: false,
    };
}

export function buildCliDataSourceOptions(env: NodeJS.ProcessEnv): DataSourceOptions {
    return {
        type: 'postgres',
        ...readDatabaseEnv(env),
        entities: [join(__dirname, '../**/*.entity.{ts,js}')],
        migrations: [join(getMigrationsDir(), '*.{ts,js}')],
        synchronize: false,
    };
}
