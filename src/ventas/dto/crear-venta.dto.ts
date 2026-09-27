import { Type } from 'class-transformer';
import {
  ArrayNotEmpty,
  IsArray,
  IsInt,
  IsOptional,
  IsUUID,
  ValidateNested,
} from 'class-validator';
import { ValidationArguments } from 'class-validator';

// Paridad con registrarVentaRequest del Go. Los mensajes de dominio que el
// Go envuelve los resuelve el service (orden de errores idéntico); acá solo
// valida tipos/forma. cliente_id opcional y null (consumidor final).
export class VentaItemDto {
  @IsUUID(undefined, {
    message: (args: ValidationArguments) => `producto_id inválido: ${args.value}`,
  })
  producto_id!: string;

  @IsInt({ message: 'cantidad debe ser un número entero' })
  cantidad!: number;
}

export class CrearVentaDto {
  @IsOptional()
  @IsUUID(undefined, { message: 'cliente_id inválido' })
  cliente_id?: string | null;

  @IsOptional()
  @IsArray()
  @ArrayNotEmpty({ message: 'una venta necesita al menos un producto' })
  @ValidateNested({ each: true })
  @Type(() => VentaItemDto)
  items?: VentaItemDto[];
}