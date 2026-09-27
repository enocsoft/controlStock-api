import { defineConfig } from 'prisma/config';

// Prisma 7: la URL de conexión vive fuera del schema (en este config).
// Dev usa los defaults del repo (mismo user/pass que docker-compose y el Go);
// producción/CI la proveen por DATABASE_URL.
export default defineConfig({
  schema: 'prisma/schema.prisma',
  datasource: {
    url:
      process.env.DATABASE_URL ??
      'postgresql://comercios:comercios@localhost:5433/comercios?schema=public',
  },
  migrations: {
    path: 'prisma/migrations',
  },
});