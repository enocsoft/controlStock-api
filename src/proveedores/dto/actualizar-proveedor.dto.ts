// Full replacement (paridad con actualizarProveedorRequest): los campos
// omitidos caen al zero value del Go ('' y false) gracias a los defaults
// de clase.
import { IsBoolean, IsNotEmpty, IsString } from 'class-validator';

export class ActualizarProveedorDto {
  @IsString()
  @IsNotEmpty({ message: 'el nombre no puede estar vacío' })
  nombre = '';

  @IsString()
  cuit = '';

  @IsString()
  telefono = '';

  @IsString()
  email = '';

  @IsBoolean({ message: 'activo debe ser un booleano' })
  activo = false;
}