import { BadRequestException, ConflictException, NotFoundException } from '@nestjs/common';
import { Test } from '@nestjs/testing';

import { PrismaService } from '../prisma/prisma.service';
import { VentaService } from './venta.service';

describe('VentaService', () => {
  let service: VentaService;
  let prisma: {
    venta: { create: jest.Mock; findMany: jest.Mock; findUnique: jest.Mock; update: jest.Mock };
    producto: { findUnique: jest.Mock; updateMany: jest.Mock; update: jest.Mock };
    movimientoStock: { create: jest.Mock };
    $transaction: jest.Mock;
  };

  const productoRow = (overrides: Record<string, unknown> = {}) => ({
    id: 'prod-1',
    sku: 'SKU-1',
    precioVenta: 100,
    stockActual: 10,
    activo: true,
    ...overrides,
  });

  const ventaRow = (overrides: Record<string, unknown> = {}) => ({
    id: 'venta-1',
    clienteId: null,
    usuarioId: 'user-1',
    fecha: new Date('2026-09-20T14:32:00.000Z'),
    total: 200,
    estado: 'confirmada',
    items: [
      { id: 'item-1', ventaId: 'venta-1', productoId: 'prod-1', cantidad: 2, precioUnitario: 100 },
    ],
    ...overrides,
  });

  const txMock = () => ({
    venta: { create: jest.fn(), update: jest.fn() },
    producto: { updateMany: jest.fn(), update: jest.fn(), findUnique: jest.fn() },
    movimientoStock: { create: jest.fn() },
  });

  beforeEach(async () => {
    prisma = {
      venta: { create: jest.fn(), findMany: jest.fn(), findUnique: jest.fn(), update: jest.fn() },
      producto: { findUnique: jest.fn(), updateMany: jest.fn(), update: jest.fn() },
      movimientoStock: { create: jest.fn() },
      $transaction: jest.fn(),
    };

    const moduleRef = await Test.createTestingModule({
      providers: [VentaService, { provide: PrismaService, useValue: prisma }],
    }).compile();

    service = moduleRef.get(VentaService);
  });

  describe('crear', () => {
    it('registra venta en transacción: snapshot de precio, stock atómico, movimiento negativo', async () => {
      prisma.producto.findUnique.mockResolvedValue(productoRow());
      const tx = txMock();
      tx.venta.create.mockResolvedValue(ventaRow());
      tx.producto.updateMany.mockResolvedValue({ count: 1 });
      prisma.$transaction.mockImplementation(async (cb: (t: unknown) => Promise<unknown>) =>
        cb(tx),
      );

      const result = await service.crear('user-1', {
        cliente_id: null,
        items: [{ producto_id: 'prod-1', cantidad: 2 }],
      });

      expect(prisma.$transaction).toHaveBeenCalled();
      expect(tx.venta.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            clienteId: null,
            usuarioId: 'user-1',
            total: 200,
            estado: 'confirmada',
          }),
        }),
      );
      expect(tx.producto.updateMany).toHaveBeenCalledWith({
        where: { id: 'prod-1', stockActual: { gte: 2 } },
        data: { stockActual: { decrement: 2 } },
      });
      expect(tx.movimientoStock.create).toHaveBeenCalledWith({
        data: {
          productoId: 'prod-1',
          usuarioId: 'user-1',
          cantidad: -2,
          tipo: 'venta',
          motivo: 'Venta registrada',
          referenciaId: 'venta-1',
        },
      });
      expect(result).toEqual({
        ID: 'venta-1',
        ClienteID: null,
        UsuarioID: 'user-1',
        Fecha: '2026-09-20T14:32:00Z',
        Total: 200,
        Estado: 'confirmada',
        Items: [
          { ID: 'item-1', ProductoID: 'prod-1', Cantidad: 2, PrecioUnitario: 100 },
        ],
      });
    });

    it('producto inexistente → 400 con el mensaje envuelto del Go (no 404)', async () => {
      prisma.producto.findUnique.mockResolvedValue(null);

      await expect(
        service.crear('user-1', { items: [{ producto_id: 'prod-x', cantidad: 1 }] }),
      ).rejects.toThrow(
        new BadRequestException('producto prod-x: producto no encontrado'),
      );
    });

    it('items vacíos → 400 con el mensaje envuelto', async () => {
      await expect(service.crear('user-1', { items: [] })).rejects.toThrow(
        new BadRequestException(
          'no se pudo armar la venta: una venta necesita al menos un producto',
        ),
      );
    });

    it('cantidad <= 0 → 400 con el mensaje envuelto', async () => {
      prisma.producto.findUnique.mockResolvedValue(productoRow());

      await expect(
        service.crear('user-1', { items: [{ producto_id: 'prod-1', cantidad: 0 }] }),
      ).rejects.toThrow(
        new BadRequestException(
          'no se pudo armar la venta: la cantidad de cada item debe ser mayor a cero',
        ),
      );
    });

    it('stock insuficiente → 409 y la transacción revierte', async () => {
      prisma.producto.findUnique.mockResolvedValue(productoRow());
      const tx = txMock();
      tx.venta.create.mockResolvedValue(ventaRow());
      tx.producto.updateMany.mockResolvedValue({ count: 0 });
      prisma.$transaction.mockImplementation(async (cb: (t: unknown) => Promise<unknown>) =>
        cb(tx),
      );

      await expect(
        service.crear('user-1', { items: [{ producto_id: 'prod-1', cantidad: 99 }] }),
      ).rejects.toThrow(new ConflictException('producto prod-1: stock insuficiente'));
    });
  });

  describe('listar / obtener', () => {
    it('listar devuelve Items: null (el Go no carga items en la lista)', async () => {
      prisma.venta.findMany.mockResolvedValue([ventaRow({ items: undefined })]);
      const result = await service.listar();
      expect(result![0].Items).toBeNull();
      expect(prisma.venta.findMany).toHaveBeenCalledWith({ orderBy: { fecha: 'desc' } });
    });

    it('listar sin ventas → null', async () => {
      prisma.venta.findMany.mockResolvedValue([]);
      expect(await service.listar()).toBeNull();
    });

    it('obtenerPorId lanza 404 venta no encontrada', async () => {
      prisma.venta.findUnique.mockResolvedValue(null);
      await expect(service.obtenerPorId('v-x')).rejects.toThrow(
        new NotFoundException('venta no encontrada'),
      );
    });
  });

  describe('anular', () => {
    it('restaura stock y marca anulada, de forma atómica', async () => {
      prisma.venta.findUnique.mockResolvedValue(ventaRow());
      const tx = txMock();
      tx.producto.findUnique.mockResolvedValue(productoRow());
      prisma.$transaction.mockImplementation(async (cb: (t: unknown) => Promise<unknown>) =>
        cb(tx),
      );

      const result = await service.anular('venta-1');

      expect(tx.producto.update).toHaveBeenCalledWith({
        where: { id: 'prod-1' },
        data: { stockActual: { increment: 2 } },
      });
      expect(tx.venta.update).toHaveBeenCalledWith({
        where: { id: 'venta-1' },
        data: { estado: 'anulada' },
      });
      expect(result).toEqual({ estado: 'anulada' });
    });

    it('404 si la venta no existe; 400 si ya está anulada', async () => {
      prisma.venta.findUnique.mockResolvedValue(null);
      await expect(service.anular('v-x')).rejects.toThrow(
        new NotFoundException('venta no encontrada'),
      );

      prisma.venta.findUnique.mockResolvedValue(ventaRow({ estado: 'anulada' }));
      await expect(service.anular('venta-1')).rejects.toThrow(
        new BadRequestException('la venta ya está anulada'),
      );
    });
  });
});