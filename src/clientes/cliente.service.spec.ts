import { BadRequestException, NotFoundException } from '@nestjs/common';
import { Test } from '@nestjs/testing';

import { PrismaService } from '../prisma/prisma.service';
import { ClienteService } from './cliente.service';

describe('ClienteService', () => {
  let service: ClienteService;
  let prisma: { cliente: Record<string, jest.Mock> };

  const fila = (overrides: Record<string, unknown> = {}) => ({
    id: 'c1',
    nombre: 'Cliente Uno',
    cuit: null,
    telefono: null,
    email: null,
    saldoCuentaCorriente: 100.5,
    activo: true,
    createdAt: new Date('2026-09-20T14:32:00Z'),
    updatedAt: new Date('2026-09-20T14:32:00Z'),
    ...overrides,
  });

  beforeEach(async () => {
    prisma = {
      cliente: {
        create: jest.fn(),
        findMany: jest.fn(),
        findUnique: jest.fn(),
        update: jest.fn(),
        updateMany: jest.fn(),
      },
    };

    const moduleRef = await Test.createTestingModule({
      providers: [ClienteService, { provide: PrismaService, useValue: prisma }],
    }).compile();

    service = moduleRef.get(ClienteService);
  });

  it('crear fija saldo 0 y activo true, y los strings faltantes salen como "" (no null)', async () => {
    prisma.cliente.create.mockResolvedValue(fila({ cuit: null, telefono: null, email: null }));

    const result = await service.crear({ nombre: 'Cliente Uno', cuit: '', telefono: '', email: '' });

    expect(prisma.cliente.create).toHaveBeenCalledWith({
      data: {
        nombre: 'Cliente Uno',
        cuit: '',
        telefono: '',
        email: '',
        saldoCuentaCorriente: 0,
        activo: true,
      },
    });
    expect(result).toEqual({
      ID: 'c1',
      Nombre: 'Cliente Uno',
      CUIT: '',
      Telefono: '',
      Email: '',
      SaldoCuentaCorriente: 100.5,
      Activo: true,
    });
  });

  it('listar pide solo activos ordenados por nombre', async () => {
    prisma.cliente.findMany.mockResolvedValue([fila()]);

    await service.listar();

    expect(prisma.cliente.findMany).toHaveBeenCalledWith({
      where: { activo: true },
      orderBy: { nombre: 'asc' },
    });
  });

  it('obtenerPorId lanza 404 con el mensaje del Go si no existe', async () => {
    prisma.cliente.findUnique.mockResolvedValue(null);

    await expect(service.obtenerPorId('c-inexistente')).rejects.toThrow(
      new NotFoundException('cliente no encontrado'),
    );
  });

  it('actualizar aplica full replacement SIN tocar el saldo y devuelve la entidad', async () => {
    prisma.cliente.findUnique.mockResolvedValue(fila());
    prisma.cliente.update.mockResolvedValue(
      fila({ nombre: 'Editado', cuit: '30-12345678-9', saldoCuentaCorriente: 100.5, activo: false }),
    );

    const result = await service.actualizar('c1', {
      nombre: 'Editado',
      cuit: '30-12345678-9',
      telefono: '',
      email: '',
      activo: false,
    });

    expect(prisma.cliente.update).toHaveBeenCalledWith({
      where: { id: 'c1' },
      data: {
        nombre: 'Editado',
        cuit: '30-12345678-9',
        telefono: '',
        email: '',
        activo: false,
      },
    });
    // El saldo intacto sale en la respuesta.
    expect(result.SaldoCuentaCorriente).toBe(100.5);
    expect(result.Nombre).toBe('Editado');
    expect(result.CUIT).toBe('30-12345678-9');
    expect(result.Activo).toBe(false);
  });

  it('registrarPago rechaza monto <= 0 con 400 y el mensaje exacto', async () => {
    prisma.cliente.findUnique.mockResolvedValue(fila({ saldoCuentaCorriente: 100.5 }));

    await expect(service.registrarPago('c1', { monto: 0 })).rejects.toThrow(
      new BadRequestException('el monto debe ser mayor a cero'),
    );
    await expect(service.registrarPago('c1', { monto: -5 })).rejects.toThrow(
      new BadRequestException('el monto debe ser mayor a cero'),
    );
    expect(prisma.cliente.update).not.toHaveBeenCalled();
  });

  it('registrarPago permite saldo negativo (cliente a favor) y devuelve 204 sin body', async () => {
    prisma.cliente.findUnique.mockResolvedValue(fila({ saldoCuentaCorriente: 10 }));

    await expect(service.registrarPago('c1', { monto: 25 })).resolves.toBeUndefined();

    expect(prisma.cliente.update).toHaveBeenCalledWith({
      where: { id: 'c1' },
      data: { saldoCuentaCorriente: -15 },
    });
  });

  it('registrarPago lanza 404 si el cliente no existe, antes de validar el monto', async () => {
    prisma.cliente.findUnique.mockResolvedValue(null);

    await expect(service.registrarPago('c-x', { monto: 0 })).rejects.toThrow(
      new NotFoundException('cliente no encontrado'),
    );
  });

  it('eliminar es borrado lógico ciego (204 siempre, incluso id inexistente)', async () => {
    await service.eliminar('c1');

    expect(prisma.cliente.updateMany).toHaveBeenCalledWith({
      where: { id: 'c1' },
      data: { activo: false },
    });

    // El Go hace UPDATE sin verificar existencia: ningún error para id inexistente.
    prisma.cliente.updateMany.mockResolvedValue({ count: 0 });
    await expect(service.eliminar('c-x')).resolves.toBeUndefined();
  });
});
