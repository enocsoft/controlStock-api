# saas-comercios backend (NestJS)

API REST de un sistema de comercios (productos, clientes, proveedores, usuarios,
ventas, caja, compras y movimientos de stock). Migrado desde un backend Go: el
contrato wire se preserva bit a bit (requests snake_case, respuestas PascalCase,
envelope de errores `{"error": "mensaje"}`).

## Stack

- **NestJS 12** (módulos → controllers → services), TypeScript estricto
- **Prisma 7** sobre PostgreSQL (migraciones en `prisma/migrations/`)
- **JWT HS256** (claims `usuario_id`, `rol`, 24h) — `@nestjs/jwt` + passport-jwt
- **bun** como package manager y runtime; **Jest** para tests unitarios
- class-validator / class-transformer para los DTOs

## Requisitos

- Node >= 20 (recomendado 26) y bun >= 1.3
- PostgreSQL 16 local (o el contenedor del docker-compose)

## Variables de entorno

| Variable | Default (dev) | Descripción |
|---|---|---|
| `PORT` | `8081` | Puerto HTTP (el front Angular apunta a 8081) |
| `DATABASE_URL` | `postgresql://comercios:comercios@localhost:5433/comercios?schema=public` | DSN de Postgres |
| `JWT_SECRET` | `cambiar-en-produccion` | Secreto HS256 del JWT |

No se leen archivos `.env`: las variables se pasan por entorno (shell o
docker-compose). No hay CORS restrictivo a `http://localhost:4200` (Angular dev).

## Desarrollo

```bash
bun install
bun run prisma:generate     # genera el client (obligatorio tras tocar la schema)
bun run prisma:migrate      # prisma migrate dev (schema → migración + aplicar)
bun run prisma:seed         # datos sintéticos de prueba (BORRA la DB de dev)
bun run start:dev           # server en :8081 con watch
bun run test                # jest (72 tests)
bun run lint && bun run build
```

DB de dev: si no tenés Postgres en 5433, `docker compose up -d db`.

## Docker / producción

```bash
docker compose up --build   # levanta db (5433) + api (8081)
```

El contenedor de la api ejecuta `prisma migrate deploy` al arrancar (las
migraciones se aplican antes de levantar el server) y expone `8081`. El seed
sintético corre manualmente y nunca en producción.

## API

- `GET /health` → `{"status":"ok"}`
- `POST /auth/registro`, `POST /auth/login` (públicos)
- `/api/v1/*` requiere `Authorization: Bearer <jwt>`:
  - **productos** CRUD + PUT (full replacement) — DELETE soft
  - **clientes** CRUD + PUT + `POST /{id}/pagos` — DELETE soft
  - **proveedores** CRUD + PUT — DELETE soft
  - **usuarios** CRUD + PUT (password opcional) — DELETE soft
  - **ventas** `POST /` (con items), `GET /`, `GET /{id}`, `POST /{id}/anular`
  - **caja** `POST /apertura`, `POST /{id}/movimientos`, `POST /{id}/cierre`, `GET /`, `GET /{id}`
  - **compras** `POST /` (con items y precio_unitario), `GET /`, `GET /{id}`
  - **movimientos-stock** `GET /?producto_id=`, `POST /` (ajuste/merma)

Contrato detallado y decisiones de paridad: `odd/tasks/nestjs-migration.md`
(documento local de planificación, no versionado).