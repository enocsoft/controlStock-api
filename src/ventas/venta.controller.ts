import { Body, Controller, Get, HttpCode, HttpStatus, Param, Post, Req, UseGuards } from '@nestjs/common';
import { Request } from 'express';

import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { ParseUuidPipe } from '../common/pipes/parse-uuid.pipe';
import { CrearVentaDto } from './dto/crear-venta.dto';
import { VentaResponse } from './venta.mapper';
import { VentaService } from './venta.service';

interface RequestConUsuario extends Request {
  user: { usuarioId: string; rol: string };
}

@Controller('api/v1/ventas')
@UseGuards(JwtAuthGuard)
export class VentaController {
  constructor(private readonly ventaService: VentaService) {}

  // usuario_id sale del JWT (paridad: nunca se acepta en el body).
  @Post()
  crear(@Req() req: RequestConUsuario, @Body() dto: CrearVentaDto): Promise<VentaResponse> {
    return this.ventaService.crear(req.user.usuarioId, dto);
  }

  @Get()
  listar(): Promise<VentaResponse[] | null> {
    return this.ventaService.listar();
  }

  @Get(':id')
  obtenerPorId(@Param('id', ParseUuidPipe) id: string): Promise<VentaResponse> {
    return this.ventaService.obtenerPorId(id);
  }

  @Post(':id/anular')
  @HttpCode(HttpStatus.OK)
  anular(@Param('id', ParseUuidPipe) id: string): Promise<{ estado: string }> {
    return this.ventaService.anular(id);
  }
}