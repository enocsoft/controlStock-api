/**
 * Configuración por entorno con defaults de desarrollo (paridad con el antiguo
 * config.go del backend Go: PORT 8080 → 8081, DB local, JWT dev). No lee
 * archivos .env: las variables se pasan por entorno (docker-compose o shell).
 */
export const port = Number(process.env.PORT ?? 8081);

export const databaseUrl =
  process.env.DATABASE_URL ??
  'postgresql://comercios:comercios@localhost:5433/comercios?schema=public';

export const jwtSecret = process.env.JWT_SECRET ?? 'cambiar-en-produccion';