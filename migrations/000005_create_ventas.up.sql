CREATE TABLE ventas (
    id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    cliente_id   UUID REFERENCES clientes(id),
    usuario_id   UUID NOT NULL REFERENCES usuarios(id),
    fecha        TIMESTAMPTZ  NOT NULL DEFAULT now(),
    total        NUMERIC(12,2) NOT NULL DEFAULT 0 CHECK (total >= 0),
    estado       VARCHAR(20)  NOT NULL DEFAULT 'confirmada' CHECK (estado IN ('confirmada', 'anulada')),
    created_at   TIMESTAMPTZ  NOT NULL DEFAULT now()
);

CREATE TABLE venta_items (
    id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    venta_id         UUID NOT NULL REFERENCES ventas(id) ON DELETE CASCADE,
    producto_id      UUID NOT NULL REFERENCES productos(id),
    cantidad         INTEGER      NOT NULL CHECK (cantidad > 0),
    precio_unitario  NUMERIC(12,2) NOT NULL CHECK (precio_unitario >= 0)
);

CREATE INDEX idx_ventas_cliente ON ventas(cliente_id);
CREATE INDEX idx_ventas_fecha ON ventas(fecha);
CREATE INDEX idx_venta_items_venta ON venta_items(venta_id);
CREATE INDEX idx_venta_items_producto ON venta_items(producto_id);
