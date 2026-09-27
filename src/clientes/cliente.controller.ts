import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Post,
  Put,
  UseGuards,
} from '@nestjs/common';

import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { ParseUuidPipe } from '../common/pipes/parse-uuid.pipe';
import { ActualizarClienteDto, RegistrarPagoDto } from './dto/actualizar-cliente.dto';
import { CrearClienteDto } from './dto/crear-cliente.dto';
import { ClienteResponse } from './cliente.mapper';
import { ClienteService } from './cliente.service';

@Controller('api/v1/clientes')
@UseGuards(JwtAuthGuard)
export class ClienteController {
  constructor(private readonly clienteService: ClienteService) {}

  @Post()
  crear(@Body() dto: CrearClienteDto): Promise<ClienteResponse> {
    return this.clienteService.crear(dto);
  }

  @Get()
  listar(): Promise<ClienteResponse[] | null> {
    return this.clienteService.listar();
  }

  @Get(':id')
  obtenerPorId(@Param('id', ParseUuidPipe) id: string): Promise<ClienteResponse> {
    return this.clienteService.obtenerPorId(id);
  }

  // Paridad: "registrar un pago" es una operación con significado propio,
  // no un reemplazo de campos; por eso vive fuera del PUT.
  @Post(':id/pagos')
  @HttpCode(HttpStatus.NO_CONTENT)
  registrarPago(@Param('id', ParseUuidPipe) id: string, @Body() dto: RegistrarPagoDto): Promise<void> {
    return this.clienteService.registrarPago(id, dto);
  }

  @Put(':id')
  actualizar(
    @Param('id', ParseUuidPipe) id: string,
    @Body() dto: ActualizarClienteDto,
  ): Promise<ClienteResponse> {
    return this.clienteService.actualizar(id, dto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  eliminar(@Param('id', ParseUuidPipe) id: string): Promise<void> {
    return this.clienteService.eliminar(id);
  }
}
