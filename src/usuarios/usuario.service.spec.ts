import { BadRequestException, ConflictException, NotFoundException } from '@nestjs/common';
import { Test } from '@nestjs/testing';

import { PrismaService } from '../prisma/prisma.service';
import { UsuarioService } from './usuario.service';

describe('UsuarioService', () => {
  let service: UsuarioService;
  let prisma: { usuario: Record<string, jest.Mock> };

  const fila = (overrides: Record<string, unknown> = {}) => ({
    id: 'u1',
    nombre: 'Ana',
    email: 'ana@test.local',
    passwordHash: '$2a$10$hashfalso',
    rol: 'empleado',
    activo: true,
    createdAt: new Date('2026-09-20T14:32:00Z'),
    updatedAt: new Date('2026-09-20T14:32:00Z'),
    ...overrides,
  });

  beforeEach(async () => {
    prisma = {
      usuario: {
        create: jest.fn(),
        findFirst: jest.fn(),
        findMany: jest.fn(),
        findUnique: jest.fn(),
        update: jest.fn(),
      },
    };

    const moduleRef = await Test.createTestingModule({
      providers: [UsuarioService, { provide: PrismaService, useValue: prisma }],
    }).compile();

    service = moduleRef.get(UsuarioService);
  });

  it('crear hashea la contraseña, fija activo true y responde PascalCase sin PasswordHash', async () => {
    prisma.usuario.findFirst.mockResolvedValue(null);
    prisma.usuario.create.mockResolvedValue(fila({ rol: 'dueño' }));

    const result = await service.crear({
      nombre: 'Ana',
      email: 'ana@test.local',
      password: 'secreta123',
      rol: 'dueño',
    });

    expect(prisma.usuario.create).toHaveBeenCalledTimes(1);
    const llamada = prisma.usuario.create.mock.calls[0][0];
    expect(llamada.data.nombre).toBe('Ana');
    expect(llamada.data.email).toBe('ana@test.local');
    expect(llamada.data.rol).toBe('dueño');
    expect(llamada.data.activo).toBe(true);
    // bcrypt costo 10, y NUNCA la contraseña en claro.
    expect(llamada.data.passwordHash).toMatch(/^\$2[aby]\$10\$/);
    expect(llamada.data.passwordHash).not.toBe('secreta123');
    expect(result).toEqual({
      ID: 'u1',
      Nombre: 'Ana',
      Email: 'ana@test.local',
      Rol: 'dueño',
      Activo: true,
    });
    expect(Object.keys(result)).not.toContain('PasswordHash');
  });

  it('crear rechaza email duplicado con 400 y el mensaje exacto del Go', async () => {
    prisma.usuario.findFirst.mockResolvedValue({ id: 'otro' });

    await expect(
      service.crear({ nombre: 'Ana', email: 'ana@test.local', password: 'secreta123', rol: 'dueño' }),
    ).rejects.toThrow(new BadRequestException('ya existe un usuario con ese email'));
    expect(prisma.usuario.create).not.toHaveBeenCalled();
  });

  it('crear respeta el orden y los mensajes del Go: obligatorios, password y rol', async () => {
    prisma.usuario.findFirst.mockResolvedValue(null);

    await expect(
      service.crear({ nombre: '', email: 'a@b.c', password: 'secreta123', rol: 'dueño' }),
    ).rejects.toThrow(new BadRequestException('nombre y email son obligatorios'));

    await expect(
      service.crear({ nombre: 'Ana', email: 'a@b.c', password: 'corta', rol: 'dueño' }),
    ).rejects.toThrow(new BadRequestException('la contraseña debe tener al menos 8 caracteres'));

    await expect(
      service.crear({ nombre: 'Ana', email: 'a@b.c', password: 'secreta123', rol: 'admin' }),
    ).rejects.toThrow(new BadRequestException("el rol debe ser 'dueño' o 'empleado'"));
  });

  it('listar devuelve TODOS los usuarios (sin filtro de activo) ordenados por nombre', async () => {
    prisma.usuario.findMany.mockResolvedValue([fila({ activo: false })]);

    const result = await service.listar();

    expect(prisma.usuario.findMany).toHaveBeenCalledWith({
      orderBy: { nombre: 'asc' },
    });
    expect(result).toHaveLength(1);
    expect(result![0].Activo).toBe(false);
  });

  it('obtenerPorId lanza 404 con el mensaje del Go si no existe', async () => {
    prisma.usuario.findUnique.mockResolvedValue(null);

    await expect(service.obtenerPorId('u-inexistente')).rejects.toThrow(
      new NotFoundException('usuario no encontrado'),
    );
  });

  it('actualizar con email duplicado (otro usuario) lanza 409 y no guarda', async () => {
    prisma.usuario.findUnique.mockResolvedValue(fila());
    prisma.usuario.findFirst.mockResolvedValue({ id: 'otro' });

    await expect(
      service.actualizar('u1', {
        nombre: 'Ana',
        email: 'ana@test.local',
        password: '',
        rol: 'empleado',
        activo: true,
      }),
    ).rejects.toThrow(new ConflictException('ya existe un usuario con ese email'));
    expect(prisma.usuario.update).not.toHaveBeenCalled();
  });

  it('actualizar full replacement: password vacío conserva el hash, y activo reactiva', async () => {
    prisma.usuario.findUnique.mockResolvedValue(fila({ activo: false }));
    prisma.usuario.findFirst.mockResolvedValue({ id: 'u1' });
    prisma.usuario.update.mockResolvedValue(
      fila({ nombre: 'Ana Editada', email: 'ana2@test.local', rol: 'dueño', activo: true }),
    );

    const result = await service.actualizar('u1', {
      nombre: 'Ana Editada',
      email: 'ana2@test.local',
      password: '',
      rol: 'dueño',
      activo: true,
    });

    expect(prisma.usuario.update).toHaveBeenCalledWith({
      where: { id: 'u1' },
      data: {
        nombre: 'Ana Editada',
        email: 'ana2@test.local',
        passwordHash: '$2a$10$hashfalso',
        rol: 'dueño',
        activo: true,
      },
    });
    expect(result.Nombre).toBe('Ana Editada');
    expect(result.Activo).toBe(true);
  });

  it('actualizar con nueva contraseña la re-hashea y 404 si no existe', async () => {
    prisma.usuario.findUnique.mockResolvedValue(fila());
    prisma.usuario.findFirst.mockResolvedValue({ id: 'u1' });
    prisma.usuario.update.mockResolvedValue(fila());

    await service.actualizar('u1', {
      nombre: 'Ana',
      email: 'ana@test.local',
      password: 'nueva-secreta',
      rol: 'empleado',
      activo: true,
    });

    const llamada = prisma.usuario.update.mock.calls[0][0];
    expect(llamada.data.passwordHash).toMatch(/^\$2[aby]\$10\$/);
    expect(llamada.data.passwordHash).not.toBe('$2a$10$hashfalso');

    prisma.usuario.findUnique.mockResolvedValue(null);
    await expect(
      service.actualizar('u-x', {
        nombre: 'Ana',
        email: 'ana@test.local',
        password: '',
        rol: 'empleado',
        activo: true,
      }),
    ).rejects.toThrow(new NotFoundException('usuario no encontrado'));
  });

  it('eliminar hace borrado lógico (activo=false) y 404 si no existe', async () => {
    prisma.usuario.findUnique.mockResolvedValue(fila());

    await service.eliminar('u1');

    expect(prisma.usuario.update).toHaveBeenCalledWith({
      where: { id: 'u1' },
      data: { activo: false },
    });

    prisma.usuario.findUnique.mockResolvedValue(null);
    await expect(service.eliminar('u-x')).rejects.toThrow(
      new NotFoundException('usuario no encontrado'),
    );
  });
});
