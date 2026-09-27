import { Transform } from 'class-transformer';
import { IsNotEmpty, IsOptional, IsString } from 'class-validator';

// Paridad con crearClienteRequest + domain.NuevoCliente: solo el nombre
// es obligatorio ('el nombre no puede estar vacío'); cuit/telefono/email
// omitidos valen '' (zero value del Go).
export class CrearClienteDto {
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
