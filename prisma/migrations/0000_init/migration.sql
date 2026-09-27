-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "public";

-- CreateTable
CREATE TABLE "usuarios" (
    "id" UUID NOT NULL,
    "nombre" VARCHAR(150) NOT NULL,
    "email" VARCHAR(150) NOT NULL,
    "password_hash" VARCHAR(255) NOT NULL,
    "rol" VARCHAR(30) NOT NULL DEFAULT 'empleado',
    "activo" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "usuarios_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "productos" (
    "id" UUID NOT NULL,
    "sku" VARCHAR(50) NOT NULL,
    "codigo_barras" VARCHAR(50),
    "nombre" VARCHAR(200) NOT NULL,
    "categoria" VARCHAR(100),
    "precio_costo" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "precio_venta" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "stock_actual" INTEGER NOT NULL DEFAULT 0,
    "stock_minimo" INTEGER NOT NULL DEFAULT 0,
    "activo" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "productos_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "clientes" (
    "id" UUID NOT NULL,
    "nombre" VARCHAR(200) NOT NULL,
    "cuit" VARCHAR(20),
    "telefono" VARCHAR(30),
    "email" VARCHAR(150),
    "saldo_cuenta_corriente" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "activo" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "clientes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "proveedores" (
    "id" UUID NOT NULL,
    "nombre" VARCHAR(200) NOT NULL,
    "cuit" VARCHAR(20),
    "telefono" VARCHAR(30),
    "email" VARCHAR(150),
    "activo" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "proveedores_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ventas" (
    "id" UUID NOT NULL,
    "cliente_id" UUID,
    "usuario_id" UUID NOT NULL,
    "fecha" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "total" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "estado" VARCHAR(20) NOT NULL DEFAULT 'confirmada',
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ventas_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "venta_items" (
    "id" UUID NOT NULL,
    "venta_id" UUID NOT NULL,
    "producto_id" UUID NOT NULL,
    "cantidad" INTEGER NOT NULL,
    "precio_unitario" DECIMAL(12,2) NOT NULL,

    CONSTRAINT "venta_items_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "compras" (
    "id" UUID NOT NULL,
    "proveedor_id" UUID NOT NULL,
    "usuario_id" UUID NOT NULL,
    "fecha" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "total" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "compras_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "compra_items" (
    "id" UUID NOT NULL,
    "compra_id" UUID NOT NULL,
    "producto_id" UUID NOT NULL,
    "cantidad" INTEGER NOT NULL,
    "precio_unitario" DECIMAL(12,2) NOT NULL,

    CONSTRAINT "compra_items_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "movimientos_stock" (
    "id" UUID NOT NULL,
    "producto_id" UUID NOT NULL,
    "usuario_id" UUID NOT NULL,
    "cantidad" INTEGER NOT NULL,
    "tipo" VARCHAR(20) NOT NULL,
    "motivo" VARCHAR(255),
    "referencia_id" UUID,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "movimientos_stock_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "cajas" (
    "id" UUID NOT NULL,
    "usuario_id" UUID NOT NULL,
    "fecha_apertura" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "fecha_cierre" TIMESTAMPTZ(6),
    "saldo_inicial" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "saldo_final" DECIMAL(12,2),
    "estado" VARCHAR(20) NOT NULL DEFAULT 'abierta',

    CONSTRAINT "cajas_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "movimientos_caja" (
    "id" UUID NOT NULL,
    "caja_id" UUID NOT NULL,
    "monto" DECIMAL(12,2) NOT NULL,
    "tipo" VARCHAR(20) NOT NULL,
    "descripcion" VARCHAR(255),
    "referencia_id" UUID,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "movimientos_caja_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "usuarios_email_key" ON "usuarios"("email");

-- CreateIndex
CREATE UNIQUE INDEX "productos_sku_key" ON "productos"("sku");

-- CreateIndex
CREATE INDEX "idx_ventas_cliente" ON "ventas"("cliente_id");

-- CreateIndex
CREATE INDEX "idx_ventas_fecha" ON "ventas"("fecha");

-- CreateIndex
CREATE INDEX "idx_venta_items_venta" ON "venta_items"("venta_id");

-- CreateIndex
CREATE INDEX "idx_venta_items_producto" ON "venta_items"("producto_id");

-- CreateIndex
CREATE INDEX "idx_compras_proveedor" ON "compras"("proveedor_id");

-- CreateIndex
CREATE INDEX "idx_compra_items_compra" ON "compra_items"("compra_id");

-- CreateIndex
CREATE INDEX "idx_compra_items_producto" ON "compra_items"("producto_id");

-- CreateIndex
CREATE INDEX "idx_mov_stock_producto" ON "movimientos_stock"("producto_id");

-- CreateIndex
CREATE INDEX "idx_mov_stock_fecha" ON "movimientos_stock"("created_at");

-- CreateIndex
CREATE INDEX "idx_cajas_estado" ON "cajas"("estado");

-- CreateIndex
CREATE INDEX "idx_mov_caja_caja" ON "movimientos_caja"("caja_id");

-- AddForeignKey
ALTER TABLE "ventas" ADD CONSTRAINT "ventas_cliente_id_fkey" FOREIGN KEY ("cliente_id") REFERENCES "clientes"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ventas" ADD CONSTRAINT "ventas_usuario_id_fkey" FOREIGN KEY ("usuario_id") REFERENCES "usuarios"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "venta_items" ADD CONSTRAINT "venta_items_venta_id_fkey" FOREIGN KEY ("venta_id") REFERENCES "ventas"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "venta_items" ADD CONSTRAINT "venta_items_producto_id_fkey" FOREIGN KEY ("producto_id") REFERENCES "productos"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "compras" ADD CONSTRAINT "compras_proveedor_id_fkey" FOREIGN KEY ("proveedor_id") REFERENCES "proveedores"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "compras" ADD CONSTRAINT "compras_usuario_id_fkey" FOREIGN KEY ("usuario_id") REFERENCES "usuarios"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "compra_items" ADD CONSTRAINT "compra_items_compra_id_fkey" FOREIGN KEY ("compra_id") REFERENCES "compras"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "compra_items" ADD CONSTRAINT "compra_items_producto_id_fkey" FOREIGN KEY ("producto_id") REFERENCES "productos"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "movimientos_stock" ADD CONSTRAINT "movimientos_stock_producto_id_fkey" FOREIGN KEY ("producto_id") REFERENCES "productos"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "movimientos_stock" ADD CONSTRAINT "movimientos_stock_usuario_id_fkey" FOREIGN KEY ("usuario_id") REFERENCES "usuarios"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "cajas" ADD CONSTRAINT "cajas_usuario_id_fkey" FOREIGN KEY ("usuario_id") REFERENCES "usuarios"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "movimientos_caja" ADD CONSTRAINT "movimientos_caja_caja_id_fkey" FOREIGN KEY ("caja_id") REFERENCES "cajas"("id") ON DELETE CASCADE ON UPDATE CASCADE;


-- ${"$"}partir de las migraciones Go originales: índices GIN de búsqueda full-text
-- (Prisma no los expresa en schema, se conservan a mano)
CREATE INDEX "idx_productos_nombre" ON "productos" USING gin (to_tsvector('spanish', "nombre"));
CREATE INDEX "idx_clientes_nombre" ON "clientes" USING gin (to_tsvector('spanish', "nombre"));
