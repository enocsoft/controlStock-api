import { Proveedor } from '@prisma/client';

// Contrato Go: PascalCase; campos string vacíos serializan como ''.
export interface ProveedorResponse {
  ID: string;
  Nombre: string;
  CUIT: string;
  Telefono: string;
  Email: string;
  Activo: boolean;
}

export function aProveedorResponse(p: Proveedor): ProveedorResponse {
  return {
    ID: p.id,
    Nombre: p.nombre,
    CUIT: p.cuit ?? '',
    Telefono: p.telefono ?? '',
    Email: p.email ?? '',
    Activo: p.activo,
  };
}
