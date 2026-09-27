import { Body, Controller, Get, Param, Post, Req, UseGuards } from '@nestjs/common';
import { Request } from 'express';

import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { ParseUuidPipe } from '../common/pipes/parse-uuid.pipe';
import { CompraResponse } from './compra.mapper';
import { CompraService } from './compra.service';
import { CrearCompraDto } from './dto/crear-compra.dto';

interface RequestConUsuario extends Request {
  user: { usuarioId: string; rol: string };
}

@Controller('api/v1/compras')
@UseGuards(JwtAuthGuard)
export class CompraController {
  constructor(private readonly compraService: CompraService) {}

  // usuario_id sale del JWT (nunca se acepta en el body).
  @Post()
  crear(@Req() req: RequestConUsuario, @Body() dto: CrearCompraDto): Promise<CompraResponse> {
    return this.compraService.crear(req.user.usuarioId, dto);
  }

  @Get()
  listar(): Promise<CompraResponse[] | null> {
    return this.compraService.listar();
  }

  @Get(':id')
  obtenerPorId(@Param('id', ParseUuidPipe) id: string): Promise<CompraResponse> {
    return this.compraService.obtenerPorId(id);
  }
}
