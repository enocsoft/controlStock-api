// Full replacement (paridad con actualizarClienteRequest): los campos
// omitidos caen al zero value del Go ('' y false) gracias a los defaults
// de clase. El saldo NO es editable por acá (solo vía pagos); si el
// cliente envía un saldo en el body, whitelist lo descarta y no tiene
// efecto.
import { IsBoolean, IsNotEmpty, IsNumber, IsString } from 'class-validator';

export class ActualizarClienteDto {
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

// Body de POST /:id/pagos (registrarPagoRequest): monto number y las
// reglas (monto <= 0 → 400) viven en el servicio con el mensaje exacto.
export class RegistrarPagoDto {
  @IsNumber({}, { message: 'monto debe ser un número' })
  monto!: number;
}