import { Compra, CompraItem } from '@prisma/client';

import { formatoFecha } from '../ventas/venta.mapper';

// Mismo contrato de wire que ventas: respuestas PascalCase; Fecha RFC3339
// con .000Z recortado; Items null en listas, poblado en el detalle.
export interface CompraItemResponse {
  ID: string;
  ProductoID: string;
  Cantidad: number;
  PrecioUnitario: number;
}

export interface CompraResponse {
  ID: string;
  ProveedorID: string;
  UsuarioID: string;
  Fecha: string;
  Total: number;
  Items: CompraItemResponse[] | null;
}

export function aCompraItemResponse(i: CompraItem): CompraItemResponse {
  return {
    ID: i.id,
    ProductoID: i.productoId,
    Cantidad: i.cantidad,
    PrecioUnitario: Number(i.precioUnitario),
  };
}

export function aCompraResponse(c: Compra & { items: CompraItem[] | null }): CompraResponse {
  return {
    ID: c.id,
    ProveedorID: c.proveedorId,
    UsuarioID: c.usuarioId,
    Fecha: formatoFecha(c.fecha),
    Total: Number(c.total),
    Items: c.items ? c.items.map(aCompraItemResponse) : null,
  };
}
