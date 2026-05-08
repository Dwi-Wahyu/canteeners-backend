// prisma.config.ts
import 'dotenv/config';
import { defineConfig, env } from 'prisma/config';

export default defineConfig({
  schema: 'prisma/schema/',
  migrations: {
    path: 'prisma/migrations',
    seed: 'bun run prisma/seed',
  },
  datasource: {
    url: env('DATABASE_URL') ?? process.env.DATABASE_URL,
  },
});
