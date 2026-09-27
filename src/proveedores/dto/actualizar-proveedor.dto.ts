// Full replacement (paridad con actualizarProveedorRequest): los campos
// omitidos caen al zero value del Go ('' y false).
import { Transform } from 'class-transformer';
import { IsBoolean, IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class ActualizarProveedorDto {
  @IsOptional()
  @Transform(({ value }) => value ?? '')
  @IsString()
  @IsNotEmpty({ message: 'el nombre no puede estar vacío' })
  nombre!: string;

  @IsOptional()
  @Transform(({ value }) => value ?? '')
  @IsString()
  cuit!: string;

  @IsOptional()
  @Transform(({ value }) => value ?? '')
  @IsString()
  telefono!: string;

  @IsOptional()
  @Transform(({ value }) => value ?? '')
  @IsString()
  email!: string;

  @IsOptional()
  @Transform(({ value }) => value ?? false)
  @IsBoolean({ message: 'activo debe ser un booleano' })
  activo!: boolean;
}
