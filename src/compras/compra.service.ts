import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';

import { PrismaService } from '../prisma/prisma.service';
import { CrearCompraDto } from './dto/crear-compra.dto';
import { aCompraResponse, CompraResponse } from './compra.mapper';

// Nuevo módulo (no existe en el Go): las mismas convenciones de wire de
// ventas (body snake_case, respuesta PascalCase, errores envueltos) y el
// mismo estilo transaccional.
@Injectable()
export class CompraService {
  constructor(private readonly prisma: PrismaService) {}

  async crear(usuarioId: string, dto: CrearCompraDto): Promise<CompraResponse> {
    const items = dto.items ?? [];

    // 1) Proveedor inexistente → 404 (verificado antes de transar).
    const proveedor = await this.prisma.proveedor.findUnique({
      where: { id: dto.proveedor_id },
    });
    if (!proveedor) {
      throw new NotFoundException('proveedor no encontrado');
    }

    // 2) Items vacíos → 400 (el service lleva el orden de errores, como en
    //    ventas; el DTO no repite reglas semánticas).
    if (items.length === 0) {
      throw new BadRequestException(
        'no se pudo armar la compra: una compra necesita al menos un producto',
      );
    }

    // 3) Producto inexistente → 400 (NO 404; igual que en ventas).
    for (const item of items) {
      const producto = await this.prisma.producto.findUnique({
        where: { id: item.producto_id },
      });
      if (!producto) {
        throw new BadRequestException(`producto ${item.producto_id}: producto no encontrado`);
      }
    }

    // 4) cantidad <= 0 → 400.
    for (const item of items) {
      if (item.cantidad <= 0) {
        throw new BadRequestException(
          'no se pudo armar la compra: la cantidad de cada item debe ser mayor a cero',
        );
      }
    }

    // 5) precio_unitario < 0 → 400. El precio lo da el cliente: es el precio
    //    de compra del proveedor, no se snapshottea del producto.
    for (const item of items) {
      if (item.precio_unitario < 0) {
        throw new BadRequestException(
          'no se pudo armar la compra: el precio unitario no puede ser negativo',
        );
      }
    }

    const total = items.reduce(
      (acc, item) => acc + item.cantidad * item.precio_unitario,
      0,
    );

    // Transacción: compra con items anidados → por item: increment de stock
    // + movimiento 'compra' con referencia (espejo de ventaRepo.Save, con
    // signo positivo y stock que SUBE).
    const compra = await this.prisma.$transaction(async (tx) => {
      const creada = await tx.compra.create({
        data: {
          proveedorId: dto.proveedor_id,
          usuarioId,
          total,
          items: {
            create: items.map((item) => ({
              productoId: item.producto_id,
              cantidad: item.cantidad,
              precioUnitario: item.precio_unitario,
            })),
          },
        },
        include: { items: true },
      });

      for (const item of items) {
        await tx.producto.update({
          where: { id: item.producto_id },
          data: { stockActual: { increment: item.cantidad } },
        });

        await tx.movimientoStock.create({
          data: {
            productoId: item.producto_id,
            usuarioId,
            cantidad: item.cantidad,
            tipo: 'compra',
            motivo: 'Compra registrada',
            referenciaId: creada.id,
          },
        });
      }

      return creada;
    });

    return aCompraResponse(compra);
  }

  // Lista SIN items (Items: null siempre), ORDER BY fecha DESC;
  // lista vacía → null (mismo patrón que ventas listar).
  async listar(): Promise<CompraResponse[] | null> {
    const compras = await this.prisma.compra.findMany({
      orderBy: { fecha: 'desc' },
    });
    return compras.length > 0 ? compras.map((c) => aCompraResponse({ ...c, items: null })) : null;
  }

  async obtenerPorId(id: string): Promise<CompraResponse> {
    const compra = await this.prisma.compra.findUnique({
      where: { id },
      include: { items: true },
    });
    if (!compra) {
      throw new NotFoundException('compra no encontrada');
    }
    return aCompraResponse(compra);
  }
}
