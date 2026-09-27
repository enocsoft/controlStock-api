// Full replacement (paridad con actualizarClienteRequest): los campos
// omitidos caen al zero value del Go ('' y false). El saldo NO es
// editable por acá (solo vía pagos); si el cliente envía un saldo en el
// body, whitelist lo descarta y no tiene efecto.
import { Transform } from 'class-transformer';
import { IsBoolean, IsNotEmpty, IsNumber, IsOptional, IsString } from 'class-validator';

export class ActualizarClienteDto {
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

// Body de POST /:id/pagos (registrarPagoRequest): monto number y las
// reglas (monto <= 0 → 400) viven en el servicio con el mensaje exacto.
export class RegistrarPagoDto {
  @IsNumber({}, { message: 'monto debe ser un número' })
  monto!: number;
}
