import { Usuario } from '@prisma/client';

// Contrato Go (usuarioGestionResponse): PascalCase y NUNCA exponemos
// PasswordHash, ni siquiera en el objeto interno que viaja entre capas.
export interface UsuarioGestionResponse {
  ID: string;
  Nombre: string;
  Email: string;
  Rol: string;
  Activo: boolean;
}

export function aUsuarioResponse(u: Usuario): UsuarioGestionResponse {
  return {
    ID: u.id,
    Nombre: u.nombre,
    Email: u.email,
    Rol: u.rol,
    Activo: u.activo,
  };
}
