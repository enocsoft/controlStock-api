import { BadRequestException, NotFoundException } from '@nestjs/common';
import { Test } from '@nestjs/testing';

import { PrismaService } from '../prisma/prisma.service';
import { CompraService } from './compra.service';

describe('CompraService', () => {
  let service: CompraService;
  let prisma: {
    compra: { create: jest.Mock; findMany: jest.Mock; findUnique: jest.Mock };
    proveedor: { findUnique: jest.Mock };
    producto: { findUnique: jest.Mock; update: jest.Mock };
    movimientoStock: { create: jest.Mock };
    $transaction: jest.Mock;
  };

  const proveedorRow = () => ({ id: 'prov-1', nombre: 'Proveedor 1', activo: true });

  const productoRow = () => ({
    id: 'prod-1',
    sku: 'SKU-1',
    stockActual: 10,
    precioVenta: 100,
  });

  const compraRow = (overrides: Record<string, unknown> = {}) => ({
    id: 'compra-1',
    proveedorId: 'prov-1',
    usuarioId: 'user-1',
    fecha: new Date('2026-09-20T14:32:00.000Z'),
    total: 200,
    items: [
      { id: 'item-1', compraId: 'compra-1', productoId: 'prod-1', cantidad: 2, precioUnitario: 100 },
    ],
    ...overrides,
  });

  const txMock = () => ({
    compra: { create: jest.fn() },
    producto: { update: jest.fn() },
    movimientoStock: { create: jest.fn() },
  });

  beforeEach(async () => {
    prisma = {
      compra: { create: jest.fn(), findMany: jest.fn(), findUnique: jest.fn() },
      proveedor: { findUnique: jest.fn() },
      producto: { findUnique: jest.fn(), update: jest.fn() },
      movimientoStock: { create: jest.fn() },
      $transaction: jest.fn(),
    };

    const moduleRef = await Test.createTestingModule({
      providers: [CompraService, { provide: PrismaService, useValue: prisma }],
    }).compile();

    service = moduleRef.get(CompraService);
  });

  describe('crear', () => {
    it('registra compra en transacción: total, increment de stock, movimiento positivo con referencia', async () => {
      prisma.proveedor.findUnique.mockResolvedValue(proveedorRow());
      prisma.producto.findUnique.mockResolvedValue(productoRow());
      const tx = txMock();
      tx.compra.create.mockResolvedValue(compraRow());
      prisma.$transaction.mockImplementation(async (cb: (t: unknown) => Promise<unknown>) =>
        cb(tx),
      );

      const result = await service.crear('user-1', {
        proveedor_id: 'prov-1',
        items: [{ producto_id: 'prod-1', cantidad: 2, precio_unitario: 100 }],
      });

      expect(prisma.$transaction).toHaveBeenCalled();
      // precio_unitario delcliente: no se snapshottea del producto.
      expect(tx.compra.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            proveedorId: 'prov-1',
            usuarioId: 'user-1',
            total: 200,
            items: {
              create: [
                { productoId: 'prod-1', cantidad: 2, precioUnitario: 100 },
              ],
            },
          }),
        }),
      );
      expect(tx.producto.update).toHaveBeenCalledWith({
        where: { id: 'prod-1' },
        data: { stockActual: { increment: 2 } },
      });
      expect(tx.movimientoStock.create).toHaveBeenCalledWith({
        data: {
          productoId: 'prod-1',
          usuarioId: 'user-1',
          cantidad: 2,
          tipo: 'compra',
          motivo: 'Compra registrada',
          referenciaId: 'compra-1',
        },
      });
      expect(result).toEqual({
        ID: 'compra-1',
        ProveedorID: 'prov-1',
        UsuarioID: 'user-1',
        Fecha: '2026-09-20T14:32:00Z',
        Total: 200,
        Items: [
          { ID: 'item-1', ProductoID: 'prod-1', Cantidad: 2, PrecioUnitario: 100 },
        ],
      });
    });

    it('proveedor inexistente → 404 antes de transar', async () => {
      prisma.proveedor.findUnique.mockResolvedValue(null);

      await expect(
        service.crear('user-1', {
          proveedor_id: 'prov-x',
          items: [{ producto_id: 'prod-1', cantidad: 1, precio_unitario: 10 }],
        }),
      ).rejects.toThrow(new NotFoundException('proveedor no encontrado'));
      expect(prisma.$transaction).not.toHaveBeenCalled();
    });

    it('items vacíos → 400 con el mensaje envuelto', async () => {
      prisma.proveedor.findUnique.mockResolvedValue(proveedorRow());

      await expect(
        service.crear('user-1', { proveedor_id: 'prov-1', items: [] }),
      ).rejects.toThrow(
        new BadRequestException(
          'no se pudo armar la compra: una compra necesita al menos un producto',
        ),
      );
    });

    it('producto inexistente → 404 limpio', async () => {
      prisma.proveedor.findUnique.mockResolvedValue(proveedorRow());
      prisma.producto.findUnique.mockResolvedValue(null);

      await expect(
        service.crear('user-1', {
          proveedor_id: 'prov-1',
          items: [{ producto_id: 'prod-x', cantidad: 1, precio_unitario: 10 }],
        }),
      ).rejects.toThrow(new NotFoundException('producto no encontrado'));
    });

    it('cantidad <= 0 → 400 con el mensaje envuelto', async () => {
      prisma.proveedor.findUnique.mockResolvedValue(proveedorRow());
      prisma.producto.findUnique.mockResolvedValue(productoRow());

      await expect(
        service.crear('user-1', {
          proveedor_id: 'prov-1',
          items: [{ producto_id: 'prod-1', cantidad: 0, precio_unitario: 10 }],
        }),
      ).rejects.toThrow(
        new BadRequestException(
          'no se pudo armar la compra: la cantidad de cada item debe ser mayor a cero',
        ),
      );
    });

    it('precio_unitario < 0 → 400 con el mensaje envuelto', async () => {
      prisma.proveedor.findUnique.mockResolvedValue(proveedorRow());
      prisma.producto.findUnique.mockResolvedValue(productoRow());

      await expect(
        service.crear('user-1', {
          proveedor_id: 'prov-1',
          items: [{ producto_id: 'prod-1', cantidad: 1, precio_unitario: -5 }],
        }),
      ).rejects.toThrow(
        new BadRequestException(
          'no se pudo armar la compra: el precio unitario no puede ser negativo',
        ),
      );
    });
  });

  describe('listar / obtener', () => {
    it('listar devuelve Items: null siempre (mismo patrón que ventas)', async () => {
      prisma.compra.findMany.mockResolvedValue([compraRow({ items: undefined })]);
      const result = await service.listar();
      expect(result![0].Items).toBeNull();
      expect(prisma.compra.findMany).toHaveBeenCalledWith({ orderBy: { fecha: 'desc' } });
    });

    it('listar sin compras → null', async () => {
      prisma.compra.findMany.mockResolvedValue([]);
      expect(await service.listar()).toBeNull();
    });

    it('obtenerPorId lanza 404 compra no encontrada', async () => {
      prisma.compra.findUnique.mockResolvedValue(null);
      await expect(service.obtenerPorId('c-x')).rejects.toThrow(
        new NotFoundException('compra no encontrada'),
      );
    });
  });
});
