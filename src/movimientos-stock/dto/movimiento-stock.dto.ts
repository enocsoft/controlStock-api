import { IsInt, IsOptional, IsString, IsUUID } from 'class-validator';

// Shape/type only: las reglas de dominio (tipo válido, cantidad ≠ 0,
// stock resultante) las resuelve el service con el orden exacto de
// mensajes. cantidad es un delta firmado (increment directo).
export class CrearMovimientoStockDto {
  @IsUUID(undefined, { message: 'producto_id inválido' })
  producto_id!: string;

  @IsString({ message: 'tipo debe ser un texto' })
  tipo!: string;

  @IsInt({ message: 'cantidad debe ser un número entero' })
  cantidad!: number;

  @IsOptional()
  @IsString({ message: 'motivo debe ser un texto' })
  motivo?: string;
}
