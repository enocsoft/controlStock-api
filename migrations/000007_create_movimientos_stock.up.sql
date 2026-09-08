CREATE TABLE movimientos_stock (
    id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    producto_id  UUID NOT NULL REFERENCES productos(id),
    usuario_id   UUID NOT NULL REFERENCES usuarios(id),
    cantidad     INTEGER      NOT NULL,
    tipo         VARCHAR(20)  NOT NULL CHECK (tipo IN ('venta', 'compra', 'ajuste', 'merma')),
    motivo       VARCHAR(255),
    referencia_id UUID,
    created_at   TIMESTAMPTZ  NOT NULL DEFAULT now()
);

CREATE INDEX idx_mov_stock_producto ON movimientos_stock(producto_id);
CREATE INDEX idx_mov_stock_fecha ON movimientos_stock(created_at);
