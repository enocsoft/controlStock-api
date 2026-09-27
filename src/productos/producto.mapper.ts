import { Producto } from '@prisma/client';

// Contrato Go: respuestas PascalCase; Categoria y campos vacíos serializan
// como strings vacíos (no null); los NUMERIC(12,2) son number en JS.
export interface ProductoResponse {
  ID: string;
  SKU: string;
  Nombre: string;
  Categoria: string;
  PrecioCosto: number;
  PrecioVenta: number;
  StockActual: number;
  StockMinimo: number;
  Activo: boolean;
}

export function aProductoResponse(p: Producto): ProductoResponse {
  return {
    ID: p.id,
    SKU: p.sku,
    Nombre: p.nombre,
    Categoria: p.categoria ?? '',
    PrecioCosto: Number(p.precioCosto),
    PrecioVenta: Number(p.precioVenta),
    StockActual: p.stockActual,
    StockMinimo: p.stockMinimo,
    Activo: p.activo,
  };
}