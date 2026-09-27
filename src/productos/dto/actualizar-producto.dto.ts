import { Transform } from 'class-transformer';
import { IsBoolean, IsNotEmpty, IsNumber, IsOptional, IsString, Min } from 'class-validator';

// Full replacement (paridad con actualizarProductoRequest): los campos
// omitidos caen al zero value del Go ('', 0, false) y después las reglas
// de dominio producen los mismos errores (p.ej. nombre omitido → 400
// 'el nombre no puede estar vacío').
export class ActualizarProductoDto {
  @IsOptional()
  @Transform(({ value }) => value ?? '')
  @IsString()
  @IsNotEmpty({ message: 'el SKU no puede estar vacío' })
  sku!: string;

  @IsOptional()
  @Transform(({ value }) => value ?? '')
  @IsString()
  @IsNotEmpty({ message: 'el nombre no puede estar vacío' })
  nombre!: string;

  @IsOptional()
  @Transform(({ value }) => value ?? '')
  @IsString()
  categoria!: string;

  @IsOptional()
  @Transform(({ value }) => value ?? 0)
  @IsNumber({}, { message: 'precio_costo debe ser un número' })
  @Min(0, { message: 'los precios no pueden ser negativos' })
  precio_costo!: number;

  @IsOptional()
  @Transform(({ value }) => value ?? 0)
  @IsNumber({}, { message: 'precio_venta debe ser un número' })
  @Min(0, { message: 'los precios no pueden ser negativos' })
  precio_venta!: number;

  @IsOptional()
  @Transform(({ value }) => value ?? 0)
  @IsNumber({}, { message: 'stock_actual debe ser un número' })
  @Min(0, { message: 'el stock no puede ser negativo' })
  stock_actual!: number;

  @IsOptional()
  @Transform(({ value }) => value ?? 0)
  @IsNumber({}, { message: 'stock_minimo debe ser un número' })
  @Min(0, { message: 'el stock no puede ser negativo' })
  stock_minimo!: number;

  @IsOptional()
  @Transform(({ value }) => value ?? false)
  @IsBoolean({ message: 'activo debe ser un booleano' })
  activo!: boolean;
}