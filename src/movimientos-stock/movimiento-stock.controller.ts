import {
  Body,
  Controller,
  Get,
  Post,
  Query,
  Req,
  UseGuards,
  BadRequestException,
} from '@nestjs/common';
import { Request } from 'express';
import { isUUID } from 'class-validator';

import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { MovimientoStockResponse } from './movimiento-stock.mapper';
import { MovimientoStockService } from './movimiento-stock.service';
import { CrearMovimientoStockDto } from './dto/movimiento-stock.dto';

interface RequestConUsuario extends Request {
  user: { usuarioId: string; rol: string };
}

@Controller('api/v1/movimientos-stock')
@UseGuards(JwtAuthGuard)
export class MovimientoStockController {
  constructor(private readonly movimientoStockService: MovimientoStockService) {}

  @Get()
  listar(@Query('producto_id') productoId?: string): Promise<MovimientoStockResponse[] | null> {
    if (productoId !== undefined && productoId !== '' && !isUUID(productoId)) {
      throw new BadRequestException('id inválido');
    }
    return this.movimientoStockService.listar(productoId || undefined);
  }

  // usuario_id sale del JWT (nunca se acepta en el body).
  @Post()
  crear(
    @Req() req: RequestConUsuario,
    @Body() dto: CrearMovimientoStockDto,
  ): Promise<MovimientoStockResponse> {
    return this.movimientoStockService.crear(req.user.usuarioId, dto);
  }
}
