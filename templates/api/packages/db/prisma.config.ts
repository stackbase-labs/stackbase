import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

import { defineConfig } from 'prisma/config';

const DATABASE_URL = process.env.DATABASE_URL;

export default defineConfig({
  schema: 'prisma/schema.prisma',
  migrations: {
    path: 'prisma/migrations',
  },
  datasource: {
    url: DATABASE_URL,
  },
});
