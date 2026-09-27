# --- Build ---
FROM oven/bun:1 AS build

WORKDIR /app

# Cachear dependencias (solo se reinstalan si cambian package.json/bun.lock)
COPY package.json bun.lock* ./
RUN bun install --frozen-lockfile

COPY . .
RUN bunx prisma generate
RUN bun run build

# --- Final ---
FROM oven/bun:1

WORKDIR /app
COPY --from=build /app/node_modules ./node_modules
COPY --from=build /app/dist ./dist
COPY --from=build /app/prisma ./prisma
COPY --from=build /app/package.json ./package.json
COPY --from=build /app/prisma.config.ts ./prisma.config.ts

ENV NODE_ENV=production

EXPOSE 8081

# Las migraciones de Prisma se aplican al arrancar (paridad con el patrón
# del stack Go donde el servicio migrate corría antes que la api).
CMD ["sh", "-c", "bunx prisma migrate deploy && node dist/main.js"]