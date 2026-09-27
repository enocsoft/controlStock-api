// Full replacement (paridad con actualizarUsuarioRequest): los campos
// omitidos caen al zero value del Go ('', false). El password omitido vale
// '' y significa "no cambiar la contraseña"; las reglas de dominio
// (nombre/email obligatorios, rol válido, password >= 8 si no vacía y el
// 409 por email duplicado) viven en el servicio con los mensajes exactos.
import { Transform } from 'class-transformer';
import { IsBoolean, IsOptional, IsString } from 'class-validator';

export class ActualizarUsuarioDto {
  @IsOptional()
  @Transform(({ value }) => value ?? '')
  @IsString()
  nombre!: string;

  @IsOptional()
  @Transform(({ value }) => value ?? '')
  @IsString()
  email!: string;

  @IsOptional()
  @Transform(({ value }) => value ?? '')
  @IsString()
  password!: string;

  @IsOptional()
  @Transform(({ value }) => value ?? '')
  @IsString()
  rol!: string;

  @IsOptional()
  @Transform(({ value }) => value ?? false)
  @IsBoolean({ message: 'activo debe ser un booleano' })
  activo!: boolean;
}
