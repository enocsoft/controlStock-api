import { BadRequestException, NotFoundException } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { Prisma } from '@prisma/client';

import { PrismaService } from '../prisma/prisma.service';
import { ProductoService } from './producto.service';

describe('ProductoService', () => {
  let service: ProductoService;
  let prisma: { producto: Record<string, jest.Mock> };

  const fila = (overrides: Record<string, unknown> = {}) => ({
    id: 'p1',
    sku: 'SKU-1',
    codigoBarras: null,
    nombre: 'Producto Uno',
    categoria: null,
    precioCosto: 100.5,
    precioVenta: 150,
    stockActual: 4,
    stockMinimo: 2,
    activo: true,
    createdAt: new Date('2026-09-20T14:32:00Z'),
    updatedAt: new Date('2026-09-20T14:32:00Z'),
    ...overrides,
  });

  beforeEach(async () => {
    prisma = {
      producto: {
        create: jest.fn(),
        findMany: jest.fn(),
        findUnique: jest.fn(),
        update: jest.fn(),
        updateMany: jest.fn(),
      },
    };

    const moduleRef = await Test.createTestingModule({
      providers: [ProductoService, { provide: PrismaService, useValue: prisma }],
    }).compile();

    service = moduleRef.get(ProductoService);
  });

  it('crear fija stock 0 y activo true, y responde PascalCase con Categoria como string', async () => {
    prisma.producto.create.mockResolvedValue(fila({ categoria: null }));

    const result = await service.crear({ sku: 'SKU-1', nombre: 'Producto Uno', precio_costo: 0, precio_venta: 0 });

    expect(prisma.producto.create).toHaveBeenCalledWith({
      data: {
        sku: 'SKU-1',
        nombre: 'Producto Uno',
        precioCosto: 0,
        precioVenta: 0,
        stockActual: 0,
        stockMinimo: 0,
        activo: true,
      },
    });
    expect(result).toEqual({
      ID: 'p1',
      SKU: 'SKU-1',
      Nombre: 'Producto Uno',
      Categoria: '',
      PrecioCosto: 100.5,
      PrecioVenta: 150,
      StockActual: 4,
      StockMinimo: 2,
      Activo: true,
    });
  });

  it('listar pide solo activos ordenados por nombre', async () => {
    prisma.producto.findMany.mockResolvedValue([fila()]);

    await service.listar();

    expect(prisma.producto.findMany).toHaveBeenCalledWith({
      where: { activo: true },
      orderBy: { nombre: 'asc' },
    });
  });

  it('crear rechaza SKU duplicado con 400 (el Go devolvía el constraint como 400)', async () => {
    prisma.producto.create.mockRejectedValue(
      new Prisma.PrismaClientKnownRequestError('duplicado', {
        code: 'P2002',
        clientVersion: '7.10.0',
      }),
    );

    await expect(
      service.crear({ sku: 'SKU-1', nombre: 'Dup', precio_costo: 1, precio_venta: 2 }),
    ).rejects.toThrow(new BadRequestException('el SKU ya está en uso'));
  });

  it('obtenerPorId lanza 404 con el mensaje del Go si no existe', async () => {
    prisma.producto.findUnique.mockResolvedValue(null);

    await expect(service.obtenerPorId('p-inexistente')).rejects.toThrow(
      new NotFoundException('producto no encontrado'),
    );
  });

  it('actualizar aplica full replacement y devuelve la entidad', async () => {
    prisma.producto.findUnique.mockResolvedValue(fila());
    prisma.producto.update.mockResolvedValue(
      fila({ sku: 'SKU-2', nombre: 'Editado', categoria: 'Nueva', stockActual: 9, activo: false }),
    );

    const result = await service.actualizar('p1', {
      sku: 'SKU-2',
      nombre: 'Editado',
      categoria: 'Nueva',
      precio_costo: 10,
      precio_venta: 20,
      stock_actual: 9,
      stock_minimo: 1,
      activo: false,
    });

    expect(result.SKU).toBe('SKU-2');
    expect(result.Nombre).toBe('Editado');
    expect(result.Categoria).toBe('Nueva');
    expect(result.StockActual).toBe(9);
    expect(result.Activo).toBe(false);
  });

  it('eliminar es borrado lógico ciego (204 siempre, incluso id inexistente)', async () => {
    await service.eliminar('p1');

    expect(prisma.producto.updateMany).toHaveBeenCalledWith({
      where: { id: 'p1' },
      data: { activo: false },
    });

    prisma.producto.updateMany.mockResolvedValue({ count: 0 });
    await expect(service.eliminar('p-x')).resolves.toBeUndefined();
  });
});