CREATE TABLE cajas (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    usuario_id      UUID NOT NULL REFERENCES usuarios(id),
    fecha_apertura  TIMESTAMPTZ  NOT NULL DEFAULT now(),
    fecha_cierre    TIMESTAMPTZ,
    saldo_inicial   NUMERIC(12,2) NOT NULL DEFAULT 0,
    saldo_final     NUMERIC(12,2),
    estado          VARCHAR(20)  NOT NULL DEFAULT 'abierta' CHECK (estado IN ('abierta', 'cerrada'))
);

CREATE TABLE movimientos_caja (
    id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    caja_id      UUID NOT NULL REFERENCES cajas(id) ON DELETE CASCADE,
    monto        NUMERIC(12,2) NOT NULL,
    tipo         VARCHAR(20)  NOT NULL CHECK (tipo IN ('ingreso', 'egreso')),
    descripcion  VARCHAR(255),
    referencia_id UUID,
    created_at   TIMESTAMPTZ  NOT NULL DEFAULT now()
);

CREATE INDEX idx_cajas_estado ON cajas(estado);
CREATE INDEX idx_mov_caja_caja ON movimientos_caja(caja_id);
