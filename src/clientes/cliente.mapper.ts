import { Cliente } from '@prisma/client';

// Contrato Go: PascalCase; campos string vacíos serializan como '' (no
// null, zero value del Go); el NUMERIC(12,2) sale como number en JS.
export interface ClienteResponse {
  ID: string;
  Nombre: string;
  CUIT: string;
  Telefono: string;
  Email: string;
  SaldoCuentaCorriente: number;
  Activo: boolean;
}

export function aClienteResponse(c: Cliente): ClienteResponse {
  return {
    ID: c.id,
    Nombre: c.nombre,
    CUIT: c.cuit ?? '',
    Telefono: c.telefono ?? '',
    Email: c.email ?? '',
    SaldoCuentaCorriente: Number(c.saldoCuentaCorriente),
    Activo: c.activo,
  };
}
