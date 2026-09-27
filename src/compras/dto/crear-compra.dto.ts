import { Type } from 'class-transformer';
import { ValidationArguments, IsArray, IsInt, IsNumber, IsUUID, ValidateNested } from 'class-validator';

// Paridad con registrarCompraRequest del Go... acá nuevo diseño con las
// mismas convenciones de wire de ventas. El precio_unitario SÍ viene del
// cliente: es el precio de compra del proveedor, no se snapshottea del
// producto (decisión de diseño documentada). Las reglas de dominio
// (items vacíos, cantidad <= 0, precio negativo) las resuelve el service
// con el orden exacto de errores; acá solo valida tipos/forma.
export class CompraItemDto {
  @IsUUID(undefined, {
    message: (args: ValidationArguments) => `producto_id inválido: ${args.value}`,
  })
  producto_id!: string;

  @IsInt({ message: 'cantidad debe ser un número entero' })
  cantidad!: number;

  @IsNumber({}, { message: 'precio_unitario debe ser un número' })
  precio_unitario!: number;
}

export class CrearCompraDto {
  @IsUUID(undefined, { message: 'proveedor_id inválido' })
  proveedor_id!: string;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CompraItemDto)
  items!: CompraItemDto[];
}
