import { existsSync } from 'node:fs';
import { join } from 'node:path';
import { config } from 'dotenv';
import { DataSource } from 'typeorm';

import { buildCliDataSourceOptions } from './typeorm.config';

const backendRoot = join(__dirname, '..', '..');

for (const envFile of ['.env']) {
    const envPath = join(backendRoot, envFile);

    if (existsSync(envPath)) {
        config({ path: envPath });
        break;
    }
}

export default new DataSource(buildCliDataSourceOptions(process.env));
