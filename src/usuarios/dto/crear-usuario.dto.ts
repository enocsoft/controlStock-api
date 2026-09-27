// Paridad con crearUsuarioRequest + domain.NuevoUsuario: los mensajes
// exactos ('nombre y email son obligatorios', 'la contraseña debe tener
// al menos 8 caracteres', "el rol debe ser 'dueño' o 'empleado'") viven
// en el servicio, que los aplica con el mismo orden semántico del Go
// (email duplicado → nombre/email obligatorios → password → rol).
// Los decorators @IsString evitan que whitelist descarte los campos y
// casan los tipos del request Go; ningún mensaje depende del pipe.
// Paridad con crearUsuarioRequest + domain.NuevoUsuario: los mensajes
// exactos ('nombre y email son obligatorios', 'la contraseña debe tener
// al menos 8 caracteres', "el rol debe ser 'dueño' o 'empleado'") viven
// en el servicio, que los aplica con el mismo orden semántico del Go
// (email duplicado → nombre/email obligatorios → password → rol).
// Los decorators @IsString evitan que whitelist descarte los campos y
// casan los tipos del request Go; ningún mensaje depende del pipe.
import { IsString } from 'class-validator';

export class CrearUsuarioDto {
  @IsString()
  nombre!: string;

  @IsString()
  email!: string;

  @IsString()
  password!: string;

  @IsString()
  rol!: string;
}
