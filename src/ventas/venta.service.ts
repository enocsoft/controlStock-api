import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';

import { PrismaService } from '../prisma/prisma.service';
import { CrearVentaDto } from './dto/crear-venta.dto';
import { aVentaResponse, VentaResponse } from './venta.mapper';

// Paridad con VentaUsecase/VentaRepo del Go: mensajes envueltos idénticos.
@Injectable()
export class VentaService {
  constructor(private readonly prisma: PrismaService) {}

  async crear(usuarioId: string, dto: CrearVentaDto): Promise<VentaResponse> {
    const items = dto.items ?? [];
    const clienteId = dto.cliente_id ?? null;

    // 1) Pre-fetch de productos (el Go: GetByID por item; inexistente →
    //    400 'producto <id>: producto no encontrado', NO 404).
    const productos = await Promise.all(
      items.map(async (item) => {
        const producto = await this.prisma.producto.findUnique({
          where: { id: item.producto_id },
        });
        if (!producto) {
          throw new BadRequestException(`producto ${item.producto_id}: producto no encontrado`);
        }
        return producto;
      }),
    );

    // 2) Reglas de dominio (NuevaVenta del Go), mismo orden y mensajes.
    if (items.length === 0) {
      throw new BadRequestException('no se pudo armar la venta: una venta necesita al menos un producto');
    }
    for (const item of items) {
      if (item.cantidad <= 0) {
        throw new BadRequestException(
          'no se pudo armar la venta: la cantidad de cada item debe ser mayor a cero',
        );
      }
    }

    // PrecioUnitario = snapshot del PrecioVenta actual (el Go lo copia del
    // producto, no lo acepta del cliente).
    const total = items.reduce(
      (acc, item, index) => acc + item.cantidad * Number(productos[index].precioVenta),
      0,
    );

    // 3) Transacción: venta + items + descuento atómico de stock +
    //    movimiento (paridad con VentaRepo.Save).
    try {
      const venta = await this.prisma.$transaction(async (tx) => {
        const creada = await tx.venta.create({
          data: {
            clienteId,
            usuarioId,
            total,
            estado: 'confirmada',
            items: {
              create: items.map((item, index) => ({
                productoId: item.producto_id,
                cantidad: item.cantidad,
                precioUnitario: Number(productos[index].precioVenta),
              })),
            },
          },
          include: { items: true },
        });

        for (const item of items) {
          // UPDATE atómico: stock_actual = stock_actual - n
          // WHERE id = $id AND stock_actual >= n → 0 filas = stock insuficiente.
          const afectadas = await tx.producto.updateMany({
            where: { id: item.producto_id, stockActual: { gte: item.cantidad } },
            data: { stockActual: { decrement: item.cantidad } },
          });
          if (afectadas.count === 0) {
            throw new ConflictException(`producto ${item.producto_id}: stock insuficiente`);
          }

          await tx.movimientoStock.create({
            data: {
              productoId: item.producto_id,
              usuarioId,
              cantidad: -item.cantidad,
              tipo: 'venta',
              motivo: 'Venta registrada',
              referenciaId: creada.id,
            },
          });
        }

        return creada;
      });

      return aVentaResponse(venta);
    } catch (error) {
      // cliente_id con UUID válido pero inexistente: el Go devolvía el error
      // SQL de FK envuelto como 400; acá se traduce limpio (deviación marcada).
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2003') {
        throw new BadRequestException('cliente_id inválido');
      }
      throw error;
    }
  }

  // Paridad: lista SIN items (Go no los carga → 'Items': null siempre),
  // ORDER BY fecha DESC; lista vacía → null.
  async listar(): Promise<VentaResponse[] | null> {
    const ventas = await this.prisma.venta.findMany({
      orderBy: { fecha: 'desc' },
    });
    return ventas.length > 0 ? ventas.map((v) => aVentaResponse({ ...v, items: null })) : null;
  }

  async obtenerPorId(id: string): Promise<VentaResponse> {
    const venta = await this.prisma.venta.findUnique({
      where: { id },
      include: { items: true },
    });
    if (!venta) {
      throw new NotFoundException('venta no encontrada');
    }
    return aVentaResponse(venta);
  }

  // Paridad con AnularVenta: estado → anulada, stock se RE-SUMA (sin nuevo
  // movimiento; el historial queda como evidencia). Mejora marcada: en Go
  // no era transaccional; acá atómico.
  async anular(id: string): Promise<{ estado: string }> {
    const venta = await this.prisma.venta.findUnique({
      where: { id },
      include: { items: true },
    });
    if (!venta) {
      throw new NotFoundException('venta no encontrada');
    }
    if (venta.estado === 'anulada') {
      throw new BadRequestException('la venta ya está anulada');
    }

    await this.prisma.$transaction(async (tx) => {
      for (const item of venta.items) {
        const producto = await tx.producto.findUnique({ where: { id: item.productoId } });
        if (!producto) {
          throw new BadRequestException(
            `no se encontró el producto ${item.productoId}: producto no encontrado`,
          );
        }
        await tx.producto.update({
          where: { id: item.productoId },
          data: { stockActual: { increment: item.cantidad } },
        });
      }
      await tx.venta.update({ where: { id }, data: { estado: 'anulada' } });
    });

    return { estado: 'anulada' };
  }
}