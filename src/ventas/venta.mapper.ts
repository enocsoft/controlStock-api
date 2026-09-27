import { Venta, VentaItem } from '@prisma/client';

// Paridad Go: respuestas PascalCase; Fecha RFC3339 con .000Z recortado
// (= toISOString() del Go sin fracción cuando es 0); Items null en listas.
export interface VentaItemResponse {
  ID: string;
  ProductoID: string;
  Cantidad: number;
  PrecioUnitario: number;
}

export interface VentaResponse {
  ID: string;
  ClienteID: string | null;
  UsuarioID: string;
  Fecha: string;
  Total: number;
  Estado: string;
  Items: VentaItemResponse[] | null;
}

export function formatoFecha(fecha: Date): string {
  return fecha.toISOString().replace(/\.000Z$/, 'Z');
}

export function aVentaItemResponse(i: VentaItem): VentaItemResponse {
  return {
    ID: i.id,
    ProductoID: i.productoId,
    Cantidad: i.cantidad,
    PrecioUnitario: Number(i.precioUnitario),
  };
}

export function aVentaResponse(v: Venta & { items: VentaItem[] | null }): VentaResponse {
  return {
    ID: v.id,
    ClienteID: v.clienteId,
    UsuarioID: v.usuarioId,
    Fecha: formatoFecha(v.fecha),
    Total: Number(v.total),
    Estado: v.estado,
    Items: v.items ? v.items.map(aVentaItemResponse) : null,
  };
}