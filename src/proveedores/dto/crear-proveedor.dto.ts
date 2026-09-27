import { Transform } from 'class-transformer';
import { IsNotEmpty, IsOptional, IsString } from 'class-validator';

// Paridad con crearProveedorRequest + domain.NuevoProveedor: solo el
// nombre es obligatorio; cuit/telefono/email omitidos valen ''.
export class CrearProveedorDto {
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
}
