/**
 * Prisma Configuration File
 *
 * This replaces the deprecated `prisma` key in package.json.
 * Used by Prisma CLI for schema location, migrations, and seed command.
 */

import path from 'node:path';
import { defineConfig } from 'prisma/config';

// Load .env.local first, then .env as fallback
import { config } from 'dotenv';
config({ path: path.resolve(__dirname, '.env.local') });
config({ path: path.resolve(__dirname, '.env') });

export default defineConfig({
  schema: 'prisma/schema.prisma',
  migrations: {
    path: 'prisma/migrations',
    seed: 'npx tsx prisma/seed.ts',
  },
});
