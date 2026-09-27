import { BadRequestException, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Test } from '@nestjs/testing';
import * as bcrypt from 'bcryptjs';
import { Prisma } from '@prisma/client';

import { PrismaService } from '../prisma/prisma.service';
import { AuthService } from './auth.service';

describe('AuthService', () => {
  let service: AuthService;
  let prisma: {
    usuario: {
      create: jest.Mock;
      findFirst: jest.Mock;
    };
  };
  let jwt: { signAsync: jest.Mock };

  beforeEach(async () => {
    prisma = {
      usuario: {
        create: jest.fn(),
        findFirst: jest.fn(),
      },
    };
    jwt = { signAsync: jest.fn().mockResolvedValue('token-fake') };

    const moduleRef = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: PrismaService, useValue: prisma },
        { provide: JwtService, useValue: jwt },
      ],
    }).compile();

    service = moduleRef.get(AuthService);
  });

  describe('registrar', () => {
    it('crea el usuario con hash bcrypt (costo 10) y responde sin el hash', async () => {
      prisma.usuario.create.mockResolvedValue({
        id: 'u1',
        nombre: 'Ana',
        email: 'ana@test.com',
        rol: 'empleado',
        passwordHash: 'hash',
      });

      const result = await service.registrar({
        nombre: 'Ana',
        email: 'ana@test.com',
        password: 'clave123',
        rol: 'empleado',
      });

      const data = prisma.usuario.create.mock.calls[0][0].data;
      expect(data.passwordHash).not.toBe('clave123');
      expect(bcrypt.compareSync('clave123', data.passwordHash)).toBe(true);
      expect(result).toEqual({
        id: 'u1',
        nombre: 'Ana',
        email: 'ana@test.com',
        rol: 'empleado',
      });
      expect(result).not.toHaveProperty('passwordHash');
    });

    it('rechaza email duplicado con 400 y mensaje limpio', async () => {
      prisma.usuario.create.mockRejectedValue(
        new Prisma.PrismaClientKnownRequestError('duplicado', {
          code: 'P2002',
          clientVersion: '7.10.0',
        }),
      );

      await expect(
        service.registrar({
          nombre: 'Ana',
          email: 'ana@test.com',
          password: 'clave123',
          rol: 'empleado',
        }),
      ).rejects.toThrow(new BadRequestException('el email ya está registrado'));
    });
  });

  describe('login', () => {
    const hash = bcrypt.hashSync('clave123', 10);

    it('devuelve token con claims usuario_id y rol cuando las credenciales son válidas', async () => {
      prisma.usuario.findFirst.mockResolvedValue({
        id: 'u1',
        rol: 'dueño',
        passwordHash: hash,
      });

      const result = await service.login({ email: 'ana@test.com', password: 'clave123' });

      expect(result).toEqual({ token: 'token-fake' });
      expect(jwt.signAsync).toHaveBeenCalledWith(
        { usuario_id: 'u1', rol: 'dueño' },
        { expiresIn: '24h' },
      );
    });

    it('rechaza password incorrecta con 401', async () => {
      prisma.usuario.findFirst.mockResolvedValue({
        id: 'u1',
        rol: 'empleado',
        passwordHash: hash,
      });

      await expect(
        service.login({ email: 'ana@test.com', password: 'mal-clave' }),
      ).rejects.toThrow(new UnauthorizedException('email o contraseña incorrectos'));
    });

    it('rechaza usuario inexistente o desactivado con el mismo mensaje 401', async () => {
      prisma.usuario.findFirst.mockResolvedValue(null);

      await expect(
        service.login({ email: 'noexiste@test.com', password: 'clave123' }),
      ).rejects.toThrow(new UnauthorizedException('email o contraseña incorrectos'));
      expect(prisma.usuario.findFirst).toHaveBeenCalledWith({
        where: { email: 'noexiste@test.com', activo: true },
      });
    });
  });
});