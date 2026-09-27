import { BadRequestException, ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import * as bcrypt from 'bcryptjs';

import { listaONull } from '../common/utils/lista-o-null';
import { PrismaService } from '../prisma/prisma.service';
import { ActualizarUsuarioDto } from './dto/actualizar-usuario.dto';
import { CrearUsuarioDto } from './dto/crear-usuario.dto';
import { aUsuarioResponse, UsuarioGestionResponse } from './usuario.mapper';

// Mensajes de dominio del Go (internal/domain/usuario.go), verbatim.
const MSG_OBLIGATORIOS = 'nombre y email son obligatorios';
const MSG_PASSWORD = 'la contraseña debe tener al menos 8 caracteres';
const MSG_ROL = "el rol debe ser 'dueño' o 'empleado'";
const MSG_EMAIL_EN_USO = 'ya existe un usuario con ese email';
const MSG_NO_ENCONTRADO = 'usuario no encontrado';

@Injectable()
export class UsuarioService {
  constructor(private readonly prisma: PrismaService) {}

  async crear(dto: CrearUsuarioDto): Promise<UsuarioGestionResponse> {
    // Paridad de orden con el Go: el 400 por email duplicado tiene
    // prioridad sobre las validaciones de NuevoUsuario.
    await this.verificarEmailDisponible(dto.email, null);
    const password = dto.password ?? '';
    this.validarDatos(dto.nombre, dto.email, password, dto.rol, true);

    const usuario = await this.prisma.usuario.create({
      data: {
        nombre: dto.nombre,
        email: dto.email,
        passwordHash: bcrypt.hashSync(password, 10),
        rol: dto.rol,
        activo: true,
      },
    });
    return aUsuarioResponse(usuario);
  }

  // Paridad: TODOS los usuarios (activos e inactivos, el frontend de
  // gestión quiere poder reactivar), ORDER BY nombre.
  async listar(): Promise<UsuarioGestionResponse[] | null> {
    const usuarios = await this.prisma.usuario.findMany({
      orderBy: { nombre: 'asc' },
    });
    return listaONull(usuarios.map(aUsuarioResponse));
  }

  // Paridad: devuelve cualquier usuario, activo o no.
  async obtenerPorId(id: string): Promise<UsuarioGestionResponse> {
    const usuario = await this.prisma.usuario.findUnique({ where: { id } });
    if (!usuario) {
      throw new NotFoundException(MSG_NO_ENCONTRADO);
    }
    return aUsuarioResponse(usuario);
  }

  // Paridad con ActualizarUsuario: valida igual que el alta (email
  // incluido), excluyendo al propio usuario del chequeo de duplicado.
  // password vacío = no cambiar la contraseña.
  async actualizar(id: string, dto: ActualizarUsuarioDto): Promise<UsuarioGestionResponse> {
    const usuario = await this.prisma.usuario.findUnique({ where: { id } });
    if (!usuario) {
      throw new NotFoundException(MSG_NO_ENCONTRADO);
    }

    const password = dto.password ?? '';
    await this.verificarEmailDisponible(dto.email, id);
    this.validarDatos(dto.nombre, dto.email, password, dto.rol, false);

    // password ausente o vacío → conserva el hash existente.
    const passwordHash = password !== '' ? bcrypt.hashSync(password, 10) : usuario.passwordHash;

    const actualizado = await this.prisma.usuario.update({
      where: { id },
      data: {
        nombre: dto.nombre,
        email: dto.email,
        passwordHash,
        rol: dto.rol,
        activo: dto.activo,
      },
    });
    return aUsuarioResponse(actualizado);
  }

  // Paridad: borrado lógico (activo=false); PUT con activo:true lo
  // reactiva. Nunca borramos el historial de ventas/cajas.
  async eliminar(id: string): Promise<void> {
    const usuario = await this.prisma.usuario.findUnique({ where: { id } });
    if (!usuario) {
      throw new NotFoundException(MSG_NO_ENCONTRADO);
    }
    await this.prisma.usuario.update({ where: { id }, data: { activo: false } });
  }

  // verificarEmailDisponible: el propio usuario no cuenta como duplicado,
  // y el alta responde 400 (ErrEmailEnUso del usecase Go, que no distingue
  // no-encontrado de duplicado) mientras la edición responde 409. El
  // chequeo con activo = true replica GetByEmail del repo Go.
  private async verificarEmailDisponible(email: string, propioId: string | null): Promise<void> {
    const existente = await this.prisma.usuario.findFirst({
      where: { email, activo: true },
      select: { id: true },
    });
    if (existente && existente.id !== propioId) {
      if (propioId === null) {
        throw new BadRequestException(MSG_EMAIL_EN_USO);
      }
      throw new ConflictException(MSG_EMAIL_EN_USO);
    }
  }

  // NuevoUsuario/ActualizarUsuario: mismos mensajes y mismo orden. En el
  // alta el Go exige len >= 8 SIEMPRE (vacío incluido); en la actualización
  // un password vacío significa "no cambiar" y solo se valida si viene.
  private validarDatos(
    nombre: string,
    email: string,
    password: string,
    rol: string,
    esAlta: boolean,
  ): void {
    if (nombre === '' || email === '') {
      throw new BadRequestException(MSG_OBLIGATORIOS);
    }
    if (esAlta && password.length < 8) {
      throw new BadRequestException(MSG_PASSWORD);
    }
    if (rol !== 'dueño' && rol !== 'empleado') {
      throw new BadRequestException(MSG_ROL);
    }
    if (!esAlta && password !== '' && password.length < 8) {
      throw new BadRequestException(MSG_PASSWORD);
    }
  }
}
