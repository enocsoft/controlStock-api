import { BadRequestException, ConflictException, NotFoundException } from '@nestjs/common';
import { Test } from '@nestjs/testing';

import { PrismaService } from '../prisma/prisma.service';
import { MovimientoStockService } from './movimiento-stock.service';

describe('MovimientoStockService', () => {
  let service: MovimientoStockService;
  let prisma: {
    movimientoStock: { findMany: jest.Mock; findUnique: jest.Mock; create: jest.Mock };
    producto: { findUnique: jest.Mock; updateMany: jest.Mock };
    $transaction: jest.Mock;
  };

  const productoRow = (overrides: Record<string, unknown> = {}) => ({
    id: 'prod-1',
    sku: 'SKU-1',
    stockActual: 10,
    ...overrides,
  });

  const movimientoRow = (overrides: Record<string, unknown> = {}) => ({
    id: 'mov-1',
    productoId: 'prod-1',
    usuarioId: 'user-1',
    cantidad: 5,
    tipo: 'ajuste',
    motivo: 'recuento',
    referenciaId: null,
    createdAt: new Date('2026-09-20T14:32:00.000Z'),
    ...overrides,
  });

  const txMock = () => ({
    producto: { updateMany: jest.fn() },
    movimientoStock: { create: jest.fn() },
  });

  beforeEach(async () => {
    prisma = {
      movimientoStock: { findMany: jest.fn(), findUnique: jest.fn(), create: jest.fn() },
      producto: { findUnique: jest.fn(), updateMany: jest.fn() },
      $transaction: jest.fn(),
    };

    const moduleRef = await Test.createTestingModule({
      providers: [MovimientoStockService, { provide: PrismaService, useValue: prisma }],
    }).compile();

    service = moduleRef.get(MovimientoStockService);
  });

  describe('listar', () => {
    it('sin filtro: lista ordenada por created_at desc (sin where)', async () => {
      prisma.movimientoStock.findMany.mockResolvedValue([movimientoRow()]);
      const result = await service.listar(undefined);
      expect(result).toEqual([
        {
          ID: 'mov-1',
          ProductoID: 'prod-1',
          UsuarioID: 'user-1',
          Cantidad: 5,
          Tipo: 'ajuste',
          Motivo: 'recuento',
          ReferenciaID: null,
          CreatedAt: '2026-09-20T14:32:00Z',
        },
      ]);
      expect(prisma.movimientoStock.findMany).toHaveBeenCalledWith({
        where: undefined,
        orderBy: { createdAt: 'desc' },
      });
    });

    it('con filtro producto_id: agrega el where', async () => {
      prisma.movimientoStock.findMany.mockResolvedValue([]);
      expect(await service.listar('prod-1')).toBeNull();
      expect(prisma.movimientoStock.findMany).toHaveBeenCalledWith({
        where: { productoId: 'prod-1' },
        orderBy: { createdAt: 'desc' },
      });
    });
  });

  describe('crear', () => {
    it('crea movimiento en transacción: updateMany atómico + movimiento con referencia nula', async () => {
      prisma.producto.findUnique.mockResolvedValue(productoRow());
      const tx = txMock();
      tx.producto.updateMany.mockResolvedValue({ count: 1 });
      tx.movimientoStock.create.mockResolvedValue(movimientoRow());
      prisma.$transaction.mockImplementation(async (cb: (t: unknown) => Promise<unknown>) =>
        cb(tx),
      );

      const result = await service.crear('user-1', {
        producto_id: 'prod-1',
        tipo: 'ajuste',
        cantidad: 5,
        motivo: 'recuento',
      });

      expect(prisma.$transaction).toHaveBeenCalled();
      expect(tx.producto.updateMany).toHaveBeenCalledWith({
        where: { id: 'prod-1', stockActual: { gte: -5 } },
        data: { stockActual: { increment: 5 } },
      });
      expect(tx.movimientoStock.create).toHaveBeenCalledWith({
        data: {
          productoId: 'prod-1',
          usuarioId: 'user-1',
          cantidad: 5,
          tipo: 'ajuste',
          motivo: 'recuento',
          referenciaId: null,
        },
      });
      expect(result).toEqual({
        ID: 'mov-1',
        ProductoID: 'prod-1',
        UsuarioID: 'user-1',
        Cantidad: 5,
        Tipo: 'ajuste',
        Motivo: 'recuento',
        ReferenciaID: null,
        CreatedAt: '2026-09-20T14:32:00Z',
      });
    });

    it('delta negativo (merma): gte de la cantidad negada y estado negativo permitido', async () => {
      prisma.producto.findUnique.mockResolvedValue(productoRow({ stockActual: 3 }));
      const tx = txMock();
      tx.producto.updateMany.mockResolvedValue({ count: 1 });
      tx.movimientoStock.create.mockResolvedValue(
        movimientoRow({ cantidad: -2, tipo: 'merma', motivo: null }),
      );
      prisma.$transaction.mockImplementation(async (cb: (t: unknown) => Promise<unknown>) =>
        cb(tx),
      );

      await service.crear('user-1', {
        producto_id: 'prod-1',
        tipo: 'merma',
        cantidad: -2,
      });

      expect(tx.producto.updateMany).toHaveBeenCalledWith({
        where: { id: 'prod-1', stockActual: { gte: 2 } },
        data: { stockActual: { increment: -2 } },
      });
    });

    it('producto inexistente → 404 antes de transar', async () => {
      prisma.producto.findUnique.mockResolvedValue(null);

      await expect(
        service.crear('user-1', { producto_id: 'prod-x', tipo: 'ajuste', cantidad: 1 }),
      ).rejects.toThrow(new NotFoundException('producto no encontrado'));
      expect(prisma.$transaction).not.toHaveBeenCalled();
    });

    it("tipo inválido → 400 'el tipo de movimiento debe ser …'", async () => {
      prisma.producto.findUnique.mockResolvedValue(productoRow());

      await expect(
        service.crear('user-1', { producto_id: 'prod-1', tipo: 'venta', cantidad: 1 }),
      ).rejects.toThrow(
        new BadRequestException("el tipo de movimiento debe ser 'ajuste' o 'merma'"),
      );
    });

    it('cantidad 0 → 400 con el mensaje envuelto', async () => {
      prisma.producto.findUnique.mockResolvedValue(productoRow());

      await expect(
        service.crear('user-1', { producto_id: 'prod-1', tipo: 'ajuste', cantidad: 0 }),
      ).rejects.toThrow(new BadRequestException('la cantidad debe ser distinta de cero'));
    });

    it('stock insuficiente → 409', async () => {
      prisma.producto.findUnique.mockResolvedValue(productoRow({ stockActual: 1 }));
      const tx = txMock();
      tx.producto.updateMany.mockResolvedValue({ count: 0 });
      prisma.$transaction.mockImplementation(async (cb: (t: unknown) => Promise<unknown>) =>
        cb(tx),
      );

      await expect(
        service.crear('user-1', { producto_id: 'prod-1', tipo: 'ajuste', cantidad: -5 }),
      ).rejects.toThrow(new ConflictException('stock insuficiente'));
    });

    it('motivo ausente → null (no cadena vacía)', async () => {
      prisma.producto.findUnique.mockResolvedValue(productoRow());
      const tx = txMock();
      tx.producto.updateMany.mockResolvedValue({ count: 1 });
      tx.movimientoStock.create.mockResolvedValue(movimientoRow({ motivo: null }));
      prisma.$transaction.mockImplementation(async (cb: (t: unknown) => Promise<unknown>) =>
        cb(tx),
      );

      await service.crear('user-1', {
        producto_id: 'prod-1',
        tipo: 'ajuste',
        cantidad: 1,
      });

      expect(tx.movimientoStock.create).toHaveBeenCalledWith({
        data: expect.objectContaining({ motivo: null }),
      });
    });
  });
});
