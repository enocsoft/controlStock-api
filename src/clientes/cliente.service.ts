import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';

import { listaONull } from '../common/utils/lista-o-null';
import { PrismaService } from '../prisma/prisma.service';
import { ActualizarClienteDto, RegistrarPagoDto } from './dto/actualizar-cliente.dto';
import { CrearClienteDto } from './dto/crear-cliente.dto';
import { aClienteResponse, ClienteResponse } from './cliente.mapper';

// Mensajes de dominio del Go (internal/domain/cliente.go), verbatim.
// ('el nombre no puede estar vacío' vive en los DTOs, que son la barrera
// de validación del pipe, igual que en productos.)
const MSG_MONTO = 'el monto debe ser mayor a cero';
const MSG_NO_ENCONTRADO = 'cliente no encontrado';

@Injectable()
export class ClienteService {
  constructor(private readonly prisma: PrismaService) {}

  // Paridad: el alta no recibe saldo/activo; el server fija Saldo 0 y
  // Activo true.
  async crear(dto: CrearClienteDto): Promise<ClienteResponse> {
    const cliente = await this.prisma.cliente.create({
      data: {
        nombre: dto.nombre,
        cuit: dto.cuit,
        telefono: dto.telefono,
        email: dto.email,
        saldoCuentaCorriente: 0,
        activo: true,
      },
    });
    return aClienteResponse(cliente);
  }

  // Paridad: solo activos, ORDER BY nombre; lista vacía serializa null.
  async listar(): Promise<ClienteResponse[] | null> {
    const clientes = await this.prisma.cliente.findMany({
      where: { activo: true },
      orderBy: { nombre: 'asc' },
    });
    return listaONull(clientes.map(aClienteResponse));
  }

  // Paridad: devuelve cualquier cliente, activo o no.
  async obtenerPorId(id: string): Promise<ClienteResponse> {
    const cliente = await this.prisma.cliente.findUnique({ where: { id } });
    if (!cliente) {
      throw new NotFoundException(MSG_NO_ENCONTRADO);
    }
    return aClienteResponse(cliente);
  }

  // Paridad con ActualizarCliente: full replacement validada; el saldo
  // NO se toca (solo cambia vía pagos/compras a fiado).
  async actualizar(id: string, dto: ActualizarClienteDto): Promise<ClienteResponse> {
    const cliente = await this.prisma.cliente.findUnique({ where: { id } });
    if (!cliente) {
      throw new NotFoundException(MSG_NO_ENCONTRADO);
    }

    const actualizado = await this.prisma.cliente.update({
      where: { id },
      data: {
        nombre: dto.nombre,
        cuit: dto.cuit,
        telefono: dto.telefono,
        email: dto.email,
        activo: dto.activo,
      },
    });
    return aClienteResponse(actualizado);
  }

  // Paridad con RegistrarPago: el saldo SÍ puede quedar negativo (el
  // cliente pagó de más, queda a favor); solo se rechaza monto <= 0.
  async registrarPago(id: string, dto: RegistrarPagoDto): Promise<void> {
    const cliente = await this.prisma.cliente.findUnique({ where: { id } });
    if (!cliente) {
      throw new NotFoundException(MSG_NO_ENCONTRADO);
    }
    if (dto.monto <= 0) {
      throw new BadRequestException(MSG_MONTO);
    }

    await this.prisma.cliente.update({
      where: { id },
      data: {
        saldoCuentaCorriente: Number(cliente.saldoCuentaCorriente) - dto.monto,
      },
    });
  }

  // Paridad: borrado lógico CIEGO (el Go hace UPDATE sin verificar →
  // cualquier id responde 204, incluso inexistente).
  async eliminar(id: string): Promise<void> {
    await this.prisma.cliente.updateMany({ where: { id }, data: { activo: false } });
  }
}
