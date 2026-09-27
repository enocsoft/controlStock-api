import { Transform } from 'class-transformer';
import { IsNumber, IsOptional, IsString } from 'class-validator';

// Los checks de tipo/monto los hace el service (orden de errores del Go:
// cerrada → tipo → monto).
export class MovimientoCajaDto {
  @IsString()
  tipo!: string;

  @IsOptional()
  @Transform(({ value }) => value ?? 0)
  @IsNumber({}, { message: 'monto debe ser un número' })
  monto!: number;

  @IsOptional()
  @Transform(({ value }) => value ?? '')
  @IsString()
  descripcion!: string;
}