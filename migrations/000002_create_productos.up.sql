CREATE TABLE productos (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    sku             VARCHAR(50) NOT NULL UNIQUE,
    codigo_barras   VARCHAR(50),
    nombre          VARCHAR(200) NOT NULL,
    categoria       VARCHAR(100),
    precio_costo    NUMERIC(12,2) NOT NULL DEFAULT 0 CHECK (precio_costo >= 0),
    precio_venta    NUMERIC(12,2) NOT NULL DEFAULT 0 CHECK (precio_venta >= 0),
    stock_actual    INTEGER      NOT NULL DEFAULT 0 CHECK (stock_actual >= 0),
    stock_minimo    INTEGER      NOT NULL DEFAULT 0,
    activo          BOOLEAN      NOT NULL DEFAULT true,
    created_at      TIMESTAMPTZ  NOT NULL DEFAULT now(),
    updated_at      TIMESTAMPTZ  NOT NULL DEFAULT now()
);

CREATE INDEX idx_productos_sku ON productos(sku);
CREATE INDEX idx_productos_nombre ON productos USING gin (to_tsvector('spanish', nombre));
