import { BadRequestException, ConflictException, NotFoundException } from '@nestjs/common';
import { Test } from '@nestjs/testing';

import { PrismaService } from '../prisma/prisma.service';
import { CajaService } from './caja.service';

describe('CajaService', () => {
  let service: CajaService;
  let prisma: {
    caja: {
      findFirst: jest.Mock;
      create: jest.Mock;
      findUnique: jest.Mock;
      findMany: jest.Mock;
      update: jest.Mock;
    };
    movimientoCaja: { create: jest.Mock };
  };

  const cajaRow = (overrides: Record<string, unknown> = {}) => ({
    id: 'caja-1',
    usuarioId: 'user-1',
    fechaApertura: new Date('2026-09-20T14:32:00.000Z'),
    fechaCierre: null,
    saldoInicial: 1000,
    saldoFinal: null,
    estado: 'abierta',
    movimientos: [],
    ...overrides,
  });

  beforeEach(async () => {
    prisma = {
      caja: {
        findFirst: jest.fn(),
        create: jest.fn(),
        findUnique: jest.fn(),
        findMany: jest.fn(),
        update: jest.fn(),
      },
      movimientoCaja: { create: jest.fn() },
    };

    const moduleRef = await Test.createTestingModule({
      providers: [CajaService, { provide: PrismaService, useValue: prisma }],
    }).compile();

    service = moduleRef.get(CajaService);
  });

  describe('abrir', () => {
    it('abre caja con usuario del token cuando no hay otra abierta', async () => {
      prisma.caja.findFirst.mockResolvedValue(null);
      prisma.caja.create.mockResolvedValue(cajaRow());

      const result = await service.abrir('user-1', { saldo_inicial: 1000 });

      expect(prisma.caja.create).toHaveBeenCalledWith({
        data: { usuarioId: 'user-1', saldoInicial: 1000, estado: 'abierta' },
        include: { movimientos: true },
      });
      expect(result).toEqual({
        ID: 'caja-1',
        UsuarioID: 'user-1',
        FechaApertura: '2026-09-20T14:32:00Z',
        FechaCierre: null,
        SaldoInicial: 1000,
        SaldoFinal: null,
        Estado: 'abierta',
        Movimientos: null,
      });
    });

    it('409 si ya hay una caja abierta', async () => {
      prisma.caja.findFirst.mockResolvedValue(cajaRow());

      await expect(service.abrir('user-1', { saldo_inicial: 0 })).rejects.toThrow(
        new ConflictException('ya hay una caja abierta'),
      );
    });

    it('saldo negativo → 400 con el mensaje envuelto del Go', async () => {
      prisma.caja.findFirst.mockResolvedValue(null);

      await expect(service.abrir('user-1', { saldo_inicial: -5 })).rejects.toThrow(
        new BadRequestException('no se pudo abrir la caja: el saldo inicial no puede ser negativo'),
      );
    });
  });

  describe('registrarMovimiento', () => {
    it('registra ingreso/egreso válido', async () => {
      prisma.caja.findUnique.mockResolvedValue(cajaRow());

      await service.registrarMovimiento('caja-1', { tipo: 'ingreso', monto: 500, descripcion: 'cobro' });

      expect(prisma.movimientoCaja.create).toHaveBeenCalledWith({
        data: { cajaId: 'caja-1', monto: 500, tipo: 'ingreso', descripcion: 'cobro' },
      });
    });

    it('404 con el wrapper del Go si la caja no existe', async () => {
      prisma.caja.findUnique.mockResolvedValue(null);

      await expect(
        service.registrarMovimiento('caja-x', { tipo: 'ingreso', monto: 1, descripcion: '' }),
      ).rejects.toThrow(new NotFoundException('no se encontró la caja: caja no encontrada'));
    });

    it('400 caja cerrada / tipo inválido / monto <= 0 (orden del Go)', async () => {
      prisma.caja.findUnique.mockResolvedValue(cajaRow({ estado: 'cerrada' }));
      await expect(
        service.registrarMovimiento('caja-1', { tipo: 'ingreso', monto: 1, descripcion: '' }),
      ).rejects.toThrow(new BadRequestException('la caja ya está cerrada'));

      prisma.caja.findUnique.mockResolvedValue(cajaRow());
      await expect(
        service.registrarMovimiento('caja-1', { tipo: 'otro', monto: 1, descripcion: '' }),
      ).rejects.toThrow(
        new BadRequestException("el tipo de movimiento debe ser 'ingreso' o 'egreso'"),
      );

      await expect(
        service.registrarMovimiento('caja-1', { tipo: 'ingreso', monto: 0, descripcion: '' }),
      ).rejects.toThrow(new BadRequestException('el monto debe ser mayor a cero'));
    });
  });

  describe('cerrar', () => {
    it('calcula saldo final (ingreso +, egreso −) y cierra', async () => {
      prisma.caja.findUnique.mockResolvedValue(
        cajaRow({
          movimientos: [
            { id: 'm1', cajaId: 'caja-1', monto: 500, tipo: 'ingreso', descripcion: '', createdAt: new Date() },
            { id: 'm2', cajaId: 'caja-1', monto: 200, tipo: 'egreso', descripcion: '', createdAt: new Date() },
          ],
        }),
      );
      prisma.caja.update.mockResolvedValue(
        cajaRow({
          fechaCierre: new Date('2026-09-20T20:00:00.000Z'),
          saldoFinal: 1300,
          estado: 'cerrada',
          movimientos: [
            { id: 'm1', cajaId: 'caja-1', monto: 500, tipo: 'ingreso', descripcion: '', createdAt: new Date() },
            { id: 'm2', cajaId: 'caja-1', monto: 200, tipo: 'egreso', descripcion: '', createdAt: new Date() },
          ],
        }),
      );

      const result = await service.cerrar('caja-1');

      expect(prisma.caja.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ saldoFinal: 1300, estado: 'cerrada' }),
        }),
      );
      expect(result.SaldoFinal).toBe(1300);
      expect(result.Estado).toBe('cerrada');
      expect(result.Movimientos).toHaveLength(2);
    });

    it('404 wrapper / 400 ya cerrada', async () => {
      prisma.caja.findUnique.mockResolvedValue(null);
      await expect(service.cerrar('caja-x')).rejects.toThrow(
        new NotFoundException('no se encontró la caja: caja no encontrada'),
      );

      prisma.caja.findUnique.mockResolvedValue(cajaRow({ estado: 'cerrada' }));
      await expect(service.cerrar('caja-1')).rejects.toThrow(
        new BadRequestException('la caja ya está cerrada'),
      );
    });
  });

  describe('listar / obtener', () => {
    it('listar: Movimientos null y orderBy fecha_apertura desc', async () => {
      prisma.caja.findMany.mockResolvedValue([cajaRow()]);
      const result = await service.listar();

      expect(prisma.caja.findMany).toHaveBeenCalledWith({ orderBy: { fechaApertura: 'desc' } });
      expect(result![0].Movimientos).toBeNull();
    });

    it('obtenerPorId: 404 con mensaje limpio, Movimientos poblado en detalle', async () => {
      prisma.caja.findUnique.mockResolvedValue(null);
      await expect(service.obtenerPorId('caja-x')).rejects.toThrow(
        new NotFoundException('caja no encontrada'),
      );

      prisma.caja.findUnique.mockResolvedValue(
        cajaRow({ movimientos: [{ id: 'm1', cajaId: 'caja-1', monto: 1, tipo: 'ingreso', descripcion: '', createdAt: new Date() }] }),
      );
      const result = await service.obtenerPorId('caja-1');
      expect(result.Movimientos).toHaveLength(1);
    });
  });
});