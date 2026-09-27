import { Body, Controller, Delete, Get, HttpCode, HttpStatus, Param, Post, Put, UseGuards } from '@nestjs/common';

import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { ParseUuidPipe } from '../common/pipes/parse-uuid.pipe';
import { ActualizarProveedorDto } from './dto/actualizar-proveedor.dto';
import { CrearProveedorDto } from './dto/crear-proveedor.dto';
import { ProveedorResponse } from './proveedor.mapper';
import { ProveedorService } from './proveedor.service';

@Controller('api/v1/proveedores')
@UseGuards(JwtAuthGuard)
export class ProveedorController {
  constructor(private readonly proveedorService: ProveedorService) {}

  @Post()
  crear(@Body() dto: CrearProveedorDto): Promise<ProveedorResponse> {
    return this.proveedorService.crear(dto);
  }

  @Get()
  listar(): Promise<ProveedorResponse[] | null> {
    return this.proveedorService.listar();
  }

  @Get(':id')
  obtenerPorId(@Param('id', ParseUuidPipe) id: string): Promise<ProveedorResponse> {
    return this.proveedorService.obtenerPorId(id);
  }

  @Put(':id')
  actualizar(
    @Param('id', ParseUuidPipe) id: string,
    @Body() dto: ActualizarProveedorDto,
  ): Promise<ProveedorResponse> {
    return this.proveedorService.actualizar(id, dto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  eliminar(@Param('id', ParseUuidPipe) id: string): Promise<void> {
    return this.proveedorService.eliminar(id);
  }
}
