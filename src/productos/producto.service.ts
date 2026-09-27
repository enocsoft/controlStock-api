import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';

import { listaONull } from '../common/utils/lista-o-null';
import { PrismaService } from '../prisma/prisma.service';
import { ActualizarProductoDto } from './dto/actualizar-producto.dto';
import { CrearProductoDto } from './dto/crear-producto.dto';
import { aProductoResponse, ProductoResponse } from './producto.mapper';

@Injectable()
export class ProductoService {
  constructor(private readonly prisma: PrismaService) {}

  // Paridad: el alta no recibe categoria/stock/activo; el server fija
  // StockActual 0, Activo true y Categoria/StockMinimo como zero values.
  async crear(dto: CrearProductoDto): Promise<ProductoResponse> {
    let producto: Awaited<ReturnType<PrismaService['producto']['create']>>;
    try {
      producto = await this.prisma.producto.create({
        data: {
          sku: dto.sku,
          nombre: dto.nombre,
          precioCosto: dto.precio_costo,
          precioVenta: dto.precio_venta,
          stockActual: 0,
          stockMinimo: 0,
          activo: true,
        },
      });
    } catch (error) {
      // El SKU es UNIQUE en la DB; el Go devolvía el error SQL envuelto como 400.
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
        throw new BadRequestException('el SKU ya está en uso');
      }
      throw error;
    }
    return aProductoResponse(producto);
  }

  // Paridad: solo activos, ORDER BY nombre; lista vacía serializa null.
  async listar(): Promise<ProductoResponse[] | null> {
    const productos = await this.prisma.producto.findMany({
      where: { activo: true },
      orderBy: { nombre: 'asc' },
    });
    return listaONull(productos.map(aProductoResponse));
  }

  // Paridad: devuelve cualquier producto, activo o no.
  async obtenerPorId(id: string): Promise<ProductoResponse> {
    const producto = await this.prisma.producto.findUnique({ where: { id } });
    if (!producto) {
      throw new NotFoundException('producto no encontrado');
    }
    return aProductoResponse(producto);
  }

  // Paridad con ActualizarProducto: full replacement validado con los
  // mismos mensajes; respuesta 200 con la entidad completa.
  async actualizar(id: string, dto: ActualizarProductoDto): Promise<ProductoResponse> {
    const producto = await this.prisma.producto.findUnique({ where: { id } });
    if (!producto) {
      throw new NotFoundException('producto no encontrado');
    }

    const actualizado = await this.prisma.producto.update({
      where: { id },
      data: {
        sku: dto.sku,
        nombre: dto.nombre,
        categoria: dto.categoria,
        precioCosto: dto.precio_costo,
        precioVenta: dto.precio_venta,
        stockActual: dto.stock_actual,
        stockMinimo: dto.stock_minimo,
        activo: dto.activo,
      },
    });
    return aProductoResponse(actualizado);
  }

  // Paridad: borrado lógico CIEGO (el Go hace UPDATE sin verificar →
  // cualquier id responde 204, incluso inexistente).
  async eliminar(id: string): Promise<void> {
    await this.prisma.producto.updateMany({ where: { id }, data: { activo: false } });
  }
}