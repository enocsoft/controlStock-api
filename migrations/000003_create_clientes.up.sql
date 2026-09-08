CREATE TABLE clientes (
    id                      UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    nombre                  VARCHAR(200) NOT NULL,
    cuit                    VARCHAR(20),
    telefono                VARCHAR(30),
    email                   VARCHAR(150),
    saldo_cuenta_corriente  NUMERIC(12,2) NOT NULL DEFAULT 0,
    activo                  BOOLEAN      NOT NULL DEFAULT true,
    created_at              TIMESTAMPTZ  NOT NULL DEFAULT now(),
    updated_at              TIMESTAMPTZ  NOT NULL DEFAULT now()
);

CREATE INDEX idx_clientes_nombre ON clientes USING gin (to_tsvector('spanish', nombre));
