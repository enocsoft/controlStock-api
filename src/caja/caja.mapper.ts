import { Caja, MovimientoCaja } from '@prisma/client';

import { formatoFecha } from '../ventas/venta.mapper';

// Paridad Go: PascalCase; FechaCierre/SaldoFinal null cuando no hay;
// Movimientos null en listas, poblado en detalle y en cierre.
export interface MovimientoCajaResponse {
  ID: string;
  CajaID: string;
  Monto: number;
  Tipo: string;
  Descripcion: string;
  CreatedAt: string;
}

export interface CajaResponse {
  ID: string;
  UsuarioID: string;
  FechaApertura: string;
  FechaCierre: string | null;
  SaldoInicial: number;
  SaldoFinal: number | null;
  Estado: string;
  Movimientos: MovimientoCajaResponse[] | null;
}

export function aMovimientoCajaResponse(m: MovimientoCaja): MovimientoCajaResponse {
  return {
    ID: m.id,
    CajaID: m.cajaId,
    Monto: Number(m.monto),
    Tipo: m.tipo,
    Descripcion: m.descripcion ?? '',
    CreatedAt: formatoFecha(m.createdAt),
  };
}

export function aCajaResponse(caja: Caja & { movimientos: MovimientoCaja[] | null }): CajaResponse {
  return {
    ID: caja.id,
    UsuarioID: caja.usuarioId,
    FechaApertura: formatoFecha(caja.fechaApertura),
    FechaCierre: caja.fechaCierre ? formatoFecha(caja.fechaCierre) : null,
    SaldoInicial: Number(caja.saldoInicial),
    SaldoFinal: caja.saldoFinal === null ? null : Number(caja.saldoFinal),
    Estado: caja.estado,
    Movimientos:
      caja.movimientos && caja.movimientos.length > 0
        ? caja.movimientos.map(aMovimientoCajaResponse)
        : null,
  };
}