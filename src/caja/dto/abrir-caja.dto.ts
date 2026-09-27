import { Transform } from 'class-transformer';
import { IsNumber, IsOptional } from 'class-validator';

// Paridad: saldo_inicial ausente vale 0; el < 0 lo valida el service con
// el mensaje envuelto del Go. usuario_id no se acepta (el Go lo ignoraba).
export class AbrirCajaDto {
  @IsOptional()
  @Transform(({ value }) => value ?? 0)
  @IsNumber({}, { message: 'saldo_inicial debe ser un número' })
  saldo_inicial!: number;
}