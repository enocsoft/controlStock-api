import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';

import { PrismaService } from '../prisma/prisma.service';
import { AbrirCajaDto } from './dto/abrir-caja.dto';
import { MovimientoCajaDto } from './dto/movimiento-caja.dto';
import { aCajaResponse, CajaResponse } from './caja.mapper';

@Injectable()
export class CajaService {
  constructor(private readonly prisma: PrismaService) {}

  // Paridad con AbrirCaja: usuario del token; una sola caja abierta (409);
  // saldo < 0 → mensaje envuelto del Go.
  async abrir(usuarioId: string, dto: AbrirCajaDto): Promise<CajaResponse> {
    const abierta = await this.prisma.caja.findFirst({ where: { estado: 'abierta' } });
    if (abierta) {
      throw new ConflictException('ya hay una caja abierta');
    }
    if (dto.saldo_inicial < 0) {
      throw new BadRequestException('no se pudo abrir la caja: el saldo inicial no puede ser negativo');
    }

    const caja = await this.prisma.caja.create({
      data: {
        usuarioId,
        saldoInicial: dto.saldo_inicial,
        estado: 'abierta',
      },
      include: { movimientos: true },
    });
    return aCajaResponse(caja);
  }

  // Paridad con RegistrarMovimiento: orden de errores cerrada → tipo →
  // monto; 404 con el wrapper 'no se encontró la caja: ...'; respuesta 204.
  async registrarMovimiento(cajaId: string, dto: MovimientoCajaDto): Promise<void> {
    const caja = await this.prisma.caja.findUnique({ where: { id: cajaId } });
    if (!caja) {
      throw new NotFoundException('no se encontró la caja: caja no encontrada');
    }
    if (caja.estado !== 'abierta') {
      throw new BadRequestException('la caja ya está cerrada');
    }
    if (dto.tipo !== 'ingreso' && dto.tipo !== 'egreso') {
      throw new BadRequestException("el tipo de movimiento debe ser 'ingreso' o 'egreso'");
    }
    if (dto.monto <= 0) {
      throw new BadRequestException('el monto debe ser mayor a cero');
    }

    await this.prisma.movimientoCaja.create({
      data: {
        cajaId,
        monto: dto.monto,
        tipo: dto.tipo,
        descripcion: dto.descripcion,
      },
    });
  }

  // Paridad con Cerrar: saldo_final = inicial ± Σ (ingreso +, egreso −);
  // respuesta 200 con Movimientos poblado.
  async cerrar(cajaId: string): Promise<CajaResponse> {
    const caja = await this.prisma.caja.findUnique({
      where: { id: cajaId },
      include: { movimientos: { orderBy: { createdAt: 'asc' } } },
    });
    if (!caja) {
      throw new NotFoundException('no se encontró la caja: caja no encontrada');
    }
    if (caja.estado !== 'abierta') {
      throw new BadRequestException('la caja ya está cerrada');
    }

    let saldoFinal = Number(caja.saldoInicial);
    for (const m of caja.movimientos) {
      saldoFinal += m.tipo === 'ingreso' ? Number(m.monto) : -Number(m.monto);
    }

    const cerrada = await this.prisma.caja.update({
      where: { id: cajaId },
      data: { fechaCierre: new Date(), saldoFinal, estado: 'cerrada' },
      include: { movimientos: { orderBy: { createdAt: 'asc' } } },
    });
    return aCajaResponse(cerrada);
  }

  // Paridad: lista sin Movimientos (null), ORDER BY fecha_apertura DESC.
  async listar(): Promise<CajaResponse[] | null> {
    const cajas = await this.prisma.caja.findMany({
      orderBy: { fechaApertura: 'desc' },
    });
    return cajas.length > 0 ? cajas.map((c) => aCajaResponse({ ...c, movimientos: null })) : null;
  }

  // Paridad: detalle con Movimientos (ORDER BY created_at ASC); 404 con
  // mensaje limpio (el Get del Go no envuelve).
  async obtenerPorId(id: string): Promise<CajaResponse> {
    const caja = await this.prisma.caja.findUnique({
      where: { id },
      include: { movimientos: { orderBy: { createdAt: 'asc' } } },
    });
    if (!caja) {
      throw new NotFoundException('caja no encontrada');
    }
    return aCajaResponse(caja);
  }
}