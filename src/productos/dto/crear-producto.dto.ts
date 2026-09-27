import { Transform } from 'class-transformer';
import { IsNotEmpty, IsNumber, IsOptional, IsString, Min } from 'class-validator';

// Paridad con crearProductoRequest + domain.NuevoProducto: solo 4 campos y
// los precios faltantes valen 0 (zero value del Go, válido en el alta).
export class CrearProductoDto {
  @IsString()
  @IsNotEmpty({ message: 'el SKU no puede estar vacío' })
  sku!: string;

  @IsString()
  @IsNotEmpty({ message: 'el nombre no puede estar vacío' })
  nombre!: string;

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
}