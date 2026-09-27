import { Body, Controller, Get, HttpCode, HttpStatus, Param, Post, Req, UseGuards } from '@nestjs/common';
import { Request } from 'express';

import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { ParseUuidPipe } from '../common/pipes/parse-uuid.pipe';
import { CajaResponse } from './caja.mapper';
import { CajaService } from './caja.service';
import { AbrirCajaDto } from './dto/abrir-caja.dto';
import { MovimientoCajaDto } from './dto/movimiento-caja.dto';

interface RequestConUsuario extends Request {
  user: { usuarioId: string; rol: string };
}

@Controller('api/v1/caja')
@UseGuards(JwtAuthGuard)
export class CajaController {
  constructor(private readonly cajaService: CajaService) {}

  @Post('apertura')
  abrir(@Req() req: RequestConUsuario, @Body() dto: AbrirCajaDto): Promise<CajaResponse> {
    return this.cajaService.abrir(req.user.usuarioId, dto);
  }

  @Post(':id/movimientos')
  @HttpCode(HttpStatus.NO_CONTENT)
  registrarMovimiento(
    @Param('id', ParseUuidPipe) id: string,
    @Body() dto: MovimientoCajaDto,
  ): Promise<void> {
    return this.cajaService.registrarMovimiento(id, dto);
  }

  @Post(':id/cierre')
  @HttpCode(HttpStatus.OK)
  cerrar(@Param('id', ParseUuidPipe) id: string): Promise<CajaResponse> {
    return this.cajaService.cerrar(id);
  }

  @Get()
  listar(): Promise<CajaResponse[] | null> {
    return this.cajaService.listar();
  }

  @Get(':id')
  obtenerPorId(@Param('id', ParseUuidPipe) id: string): Promise<CajaResponse> {
    return this.cajaService.obtenerPorId(id);
  }
}