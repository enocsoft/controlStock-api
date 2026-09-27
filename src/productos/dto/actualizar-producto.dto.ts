import { IsBoolean, IsNotEmpty, IsNumber, IsString, Min } from 'class-validator';

// Full replacement (paridad con actualizarProductoRequest): los campos
// omitidos caen al zero value del Go ('', 0, false) gracias a los defaults
// de clase, y las reglas de dominio producen los mismos errores (p.ej.
// nombre omitido → 400 'el nombre no puede estar vacío').
export class ActualizarProductoDto {
  @IsString()
  @IsNotEmpty({ message: 'el SKU no puede estar vacío' })
  sku = '';

  @IsString()
  @IsNotEmpty({ message: 'el nombre no puede estar vacío' })
  nombre = '';

  @IsString()
  categoria = '';

  @IsNumber({}, { message: 'precio_costo debe ser un número' })
  @Min(0, { message: 'los precios no pueden ser negativos' })
  precio_costo = 0;

  @IsNumber({}, { message: 'precio_venta debe ser un número' })
  @Min(0, { message: 'los precios no pueden ser negativos' })
  precio_venta = 0;

  @IsNumber({}, { message: 'stock_actual debe ser un número' })
  @Min(0, { message: 'el stock no puede ser negativo' })
  stock_actual = 0;

  @IsNumber({}, { message: 'stock_minimo debe ser un número' })
  @Min(0, { message: 'el stock no puede ser negativo' })
  stock_minimo = 0;

  @IsBoolean({ message: 'activo debe ser un booleano' })
  activo = false;
}