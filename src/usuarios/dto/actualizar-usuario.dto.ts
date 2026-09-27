// Full replacement (paridad con actualizarUsuarioRequest): los campos
// omitidos caen al zero value del Go ('', false) gracias a los defaults de
// clase, y las reglas de dominio (obligatorios, rol) se aplican con los
// mensajes exactos. El password es OPCIONAL: ausente o vacío conserva el
// hash; su longitud la valida el service solo cuando viene no vacía.
import { Transform } from 'class-transformer';
import { IsBoolean, IsIn, IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class ActualizarUsuarioDto {
  @IsString()
  @IsNotEmpty({ message: 'nombre y email son obligatorios' })
  nombre = '';

  @IsString()
  @IsNotEmpty({ message: 'nombre y email son obligatorios' })
  email = '';

  @IsOptional()
  @Transform(({ value }) => value ?? '')
  @IsString()
  password?: string;

  @IsString()
  @IsIn(['dueño', 'empleado'], { message: "el rol debe ser 'dueño' o 'empleado'" })
  rol = '';

  @IsBoolean({ message: 'activo debe ser un booleano' })
  activo = false;
}