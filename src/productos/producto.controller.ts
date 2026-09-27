import { Body, Controller, Delete, Get, HttpCode, HttpStatus, Param, Post, Put, UseGuards } from '@nestjs/common';

import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { ParseUuidPipe } from '../common/pipes/parse-uuid.pipe';
import { ActualizarProductoDto } from './dto/actualizar-producto.dto';
import { CrearProductoDto } from './dto/crear-producto.dto';
import { ProductoResponse } from './producto.mapper';
import { ProductoService } from './producto.service';

@Controller('api/v1/productos')
@UseGuards(JwtAuthGuard)
export class ProductoController {
  constructor(private readonly productoService: ProductoService) {}

  @Post()
  crear(@Body() dto: CrearProductoDto): Promise<ProductoResponse> {
    return this.productoService.crear(dto);
  }

  @Get()
  listar(): Promise<ProductoResponse[]> {
    return this.productoService.listar();
  }

  @Get(':id')
  obtenerPorId(@Param('id', ParseUuidPipe) id: string): Promise<ProductoResponse> {
    return this.productoService.obtenerPorId(id);
  }

  @Put(':id')
  actualizar(
    @Param('id', ParseUuidPipe) id: string,
    @Body() dto: ActualizarProductoDto,
  ): Promise<ProductoResponse> {
    return this.productoService.actualizar(id, dto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  eliminar(@Param('id', ParseUuidPipe) id: string): Promise<void> {
    return this.productoService.eliminar(id);
  }
}