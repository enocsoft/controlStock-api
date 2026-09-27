import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';

import { PrismaService } from '../prisma/prisma.service';
import { CrearMovimientoStockDto } from './dto/movimiento-stock.dto';
import { aMovimientoStockResponse, MovimientoStockResponse } from './movimiento-stock.mapper';

// Nuevo módulo (no existe en el Go): mismas convenciones de wire de ventas
// (errores envueltos, respuesta PascalCase). El stock se mueve con un
// updateMany atómico para que el stock no pueda quedar negativo.
@Injectable()
export class MovimientoStockService {
  constructor(private readonly prisma: PrismaService) {}

  async listar(productoId?: string): Promise<MovimientoStockResponse[] | null> {
    const movimientos = await this.prisma.movimientoStock.findMany({
      where: productoId ? { productoId } : undefined,
      orderBy: { createdAt: 'desc' },
    });
    return movimientos.length > 0 ? movimientos.map(aMovimientoStockResponse) : null;
  }

  async crear(usuarioId: string, dto: CrearMovimientoStockDto): Promise<MovimientoStockResponse> {
    // 1) Producto inexistente → 404 (verificado antes de transar).
    const producto = await this.prisma.producto.findUnique({
      where: { id: dto.producto_id },
    });
    if (!producto) {
      throw new NotFoundException('producto no encontrado');
    }

    // 2) tipo no in (ajuste, merma) → 400.
    if (dto.tipo !== 'ajuste' && dto.tipo !== 'merma') {
      throw new BadRequestException("el tipo de movimiento debe ser 'ajuste' o 'merma'");
    }

    // 3) cantidad === 0 → 400 (delta firmado: uso directo como increment).
    if (dto.cantidad === 0) {
      throw new BadRequestException('la cantidad debe ser distinta de cero');
    }

    // Transacción: updateMany atómico (0 filas → 409) + movimiento con
    // referencia nula (no apunta a ninguna otra entidad).
    const creado = await this.prisma.$transaction(async (tx) => {
      // UPDATE atómico: stock_actual = stock_actual + delta
      // WHERE id = $id AND stock_actual >= -delta → 0 filas = el stock
      // resultante sería negativo. Con delta positivo la condición
      // `gte(-delta)` es siempre verdadera y no molesta.
      const afectadas = await tx.producto.updateMany({
        where: { id: dto.producto_id, stockActual: { gte: -dto.cantidad } },
        data: { stockActual: { increment: dto.cantidad } },
      });
      if (afectadas.count === 0) {
        throw new ConflictException('stock insuficiente');
      }

      return tx.movimientoStock.create({
        data: {
          productoId: dto.producto_id,
          usuarioId,
          cantidad: dto.cantidad,
          tipo: dto.tipo,
          motivo: dto.motivo ?? null,
          referenciaId: null,
        },
      });
    });

    return aMovimientoStockResponse(creado);
  }
}
