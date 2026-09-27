import { Body, Controller, Delete, Get, HttpCode, HttpStatus, Param, Post, Put, UseGuards } from '@nestjs/common';

import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { ParseUuidPipe } from '../common/pipes/parse-uuid.pipe';
import { ActualizarUsuarioDto } from './dto/actualizar-usuario.dto';
import { CrearUsuarioDto } from './dto/crear-usuario.dto';
import { UsuarioGestionResponse } from './usuario.mapper';
import { UsuarioService } from './usuario.service';

@Controller('api/v1/usuarios')
@UseGuards(JwtAuthGuard)
export class UsuarioController {
  constructor(private readonly usuarioService: UsuarioService) {}

  @Post()
  crear(@Body() dto: CrearUsuarioDto): Promise<UsuarioGestionResponse> {
    return this.usuarioService.crear(dto);
  }

  @Get()
  listar(): Promise<UsuarioGestionResponse[] | null> {
    return this.usuarioService.listar();
  }

  @Get(':id')
  obtenerPorId(@Param('id', ParseUuidPipe) id: string): Promise<UsuarioGestionResponse> {
    return this.usuarioService.obtenerPorId(id);
  }

  @Put(':id')
  actualizar(
    @Param('id', ParseUuidPipe) id: string,
    @Body() dto: ActualizarUsuarioDto,
  ): Promise<UsuarioGestionResponse> {
    return this.usuarioService.actualizar(id, dto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  eliminar(@Param('id', ParseUuidPipe) id: string): Promise<void> {
    return this.usuarioService.eliminar(id);
  }
}
