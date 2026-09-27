import {
  BadRequestException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcryptjs';
import { Prisma } from '@prisma/client';

import { PrismaService } from '../prisma/prisma.service';
import { LoginDto } from './dto/login.dto';
import { RegistroDto } from './dto/registro.dto';

export interface UsuarioRegistrado {
  id: string;
  nombre: string;
  email: string;
  rol: string;
}

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwt: JwtService,
  ) {}

  // Paridad con AuthUsecase.Registrar: respuesta con claves en minúscula,
  // nunca se devuelve el password hash. DUPLICADO de email: el Go dejaba
  // pasar el error SQL crudo; acá se traduce a un mensaje limpio (mejora
  // deliberada, documentada en el feature doc).
  async registrar(dto: RegistroDto): Promise<UsuarioRegistrado> {
    const passwordHash = bcrypt.hashSync(dto.password, 10);

    let usuario: {
      id: string;
      nombre: string;
      email: string;
      rol: string;
    };
    try {
      usuario = await this.prisma.usuario.create({
        data: {
          nombre: dto.nombre,
          email: dto.email,
          passwordHash,
          rol: dto.rol,
          activo: true,
        },
      });
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
        throw new BadRequestException('el email ya está registrado');
      }
      throw error;
    }

    return {
      id: usuario.id,
      nombre: usuario.nombre,
      email: usuario.email,
      rol: usuario.rol,
    };
  }

  // Paridad con AuthUsecase.Login: GetByEmail filtra activo = true, el
  // fallo de usuario inexistente y de password converge en el mismo mensaje.
  async login(dto: LoginDto): Promise<{ token: string }> {
    const usuario = await this.prisma.usuario.findFirst({
      where: { email: dto.email, activo: true },
    });

    if (!usuario || !bcrypt.compareSync(dto.password, usuario.passwordHash)) {
      throw new UnauthorizedException('email o contraseña incorrectos');
    }

    const token = await this.jwt.signAsync(
      { usuario_id: usuario.id, rol: usuario.rol },
      { expiresIn: '24h' },
    );
    return { token };
  }
}