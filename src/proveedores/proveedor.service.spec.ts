import { NotFoundException } from '@nestjs/common';
import { Test } from '@nestjs/testing';

import { PrismaService } from '../prisma/prisma.service';
import { ProveedorService } from './proveedor.service';

describe('ProveedorService', () => {
  let service: ProveedorService;
  let prisma: { proveedor: Record<string, jest.Mock> };

  const fila = (overrides: Record<string, unknown> = {}) => ({
    id: 'pr1',
    nombre: 'Proveedor Uno',
    cuit: null,
    telefono: null,
    email: null,
    activo: true,
    createdAt: new Date('2026-09-20T14:32:00Z'),
    updatedAt: new Date('2026-09-20T14:32:00Z'),
    ...overrides,
  });

  beforeEach(async () => {
    prisma = {
      proveedor: {
        create: jest.fn(),
        findMany: jest.fn(),
        findUnique: jest.fn(),
        update: jest.fn(),
        updateMany: jest.fn(),
      },
    };

    const moduleRef = await Test.createTestingModule({
      providers: [ProveedorService, { provide: PrismaService, useValue: prisma }],
    }).compile();

    service = moduleRef.get(ProveedorService);
  });

  it('crear fija activo true y los strings faltantes salen como "" (no null)', async () => {
    prisma.proveedor.create.mockResolvedValue(fila({ cuit: null, telefono: null, email: null }));

    const result = await service.crear({ nombre: 'Proveedor Uno', cuit: '', telefono: '', email: '' });

    expect(prisma.proveedor.create).toHaveBeenCalledWith({
      data: {
        nombre: 'Proveedor Uno',
        cuit: '',
        telefono: '',
        email: '',
        activo: true,
      },
    });
    expect(result).toEqual({
      ID: 'pr1',
      Nombre: 'Proveedor Uno',
      CUIT: '',
      Telefono: '',
      Email: '',
      Activo: true,
    });
  });

  it('listar pide solo activos ordenados por nombre', async () => {
    prisma.proveedor.findMany.mockResolvedValue([fila()]);

    await service.listar();

    expect(prisma.proveedor.findMany).toHaveBeenCalledWith({
      where: { activo: true },
      orderBy: { nombre: 'asc' },
    });
  });

  it('obtenerPorId lanza 404 con el mensaje del Go si no existe', async () => {
    prisma.proveedor.findUnique.mockResolvedValue(null);

    await expect(service.obtenerPorId('pr-inexistente')).rejects.toThrow(
      new NotFoundException('proveedor no encontrado'),
    );
  });

  it('actualizar aplica full replacement y devuelve la entidad', async () => {
    prisma.proveedor.findUnique.mockResolvedValue(fila());
    prisma.proveedor.update.mockResolvedValue(
      fila({ nombre: 'Editado', cuit: '30-98765432-1', activo: false }),
    );

    const result = await service.actualizar('pr1', {
      nombre: 'Editado',
      cuit: '30-98765432-1',
      telefono: '',
      email: '',
      activo: false,
    });

    expect(prisma.proveedor.update).toHaveBeenCalledWith({
      where: { id: 'pr1' },
      data: {
        nombre: 'Editado',
        cuit: '30-98765432-1',
        telefono: '',
        email: '',
        activo: false,
      },
    });
    expect(result.Nombre).toBe('Editado');
    expect(result.CUIT).toBe('30-98765432-1');
    expect(result.Activo).toBe(false);
  });

  it('eliminar es borrado lógico ciego (204 siempre, incluso id inexistente)', async () => {
    await service.eliminar('pr1');

    expect(prisma.proveedor.updateMany).toHaveBeenCalledWith({
      where: { id: 'pr1' },
      data: { activo: false },
    });

    prisma.proveedor.updateMany.mockResolvedValue({ count: 0 });
    await expect(service.eliminar('pr-x')).resolves.toBeUndefined();
  });
});
