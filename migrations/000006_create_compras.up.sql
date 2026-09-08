CREATE TABLE compras (
    id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    proveedor_id  UUID NOT NULL REFERENCES proveedores(id),
    usuario_id    UUID NOT NULL REFERENCES usuarios(id),
    fecha         TIMESTAMPTZ  NOT NULL DEFAULT now(),
    total         NUMERIC(12,2) NOT NULL DEFAULT 0 CHECK (total >= 0),
    created_at    TIMESTAMPTZ  NOT NULL DEFAULT now()
);

CREATE TABLE compra_items (
    id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    compra_id        UUID NOT NULL REFERENCES compras(id) ON DELETE CASCADE,
    producto_id      UUID NOT NULL REFERENCES productos(id),
    cantidad         INTEGER      NOT NULL CHECK (cantidad > 0),
    precio_unitario  NUMERIC(12,2) NOT NULL CHECK (precio_unitario >= 0)
);

CREATE INDEX idx_compras_proveedor ON compras(proveedor_id);
CREATE INDEX idx_compra_items_compra ON compra_items(compra_id);
CREATE INDEX idx_compra_items_producto ON compra_items(producto_id);
