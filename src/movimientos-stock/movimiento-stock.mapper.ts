import { MovimientoStock } from '@prisma/client';

import { formatoFecha } from '../ventas/venta.mapper';

// Mismo contrato de wire que ventas: respuestas PascalCase; CreatedAt
// RFC3339 con .000Z recortado.
export interface MovimientoStockResponse {
  ID: string;
  ProductoID: string;
  UsuarioID: string;
  Cantidad: number;
  Tipo: string;
  Motivo: string | null;
  ReferenciaID: string | null;
  CreatedAt: string;
}

export function aMovimientoStockResponse(m: MovimientoStock): MovimientoStockResponse {
  return {
    ID: m.id,
    ProductoID: m.productoId,
    UsuarioID: m.usuarioId,
    Cantidad: m.cantidad,
    Tipo: m.tipo,
    Motivo: m.motivo,
    ReferenciaID: m.referenciaId,
    CreatedAt: formatoFecha(m.createdAt),
  };
}
