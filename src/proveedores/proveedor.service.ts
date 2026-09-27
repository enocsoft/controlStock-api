import { Injectable, NotFoundException } from '@nestjs/common';

import { listaONull } from '../common/utils/lista-o-null';
import { PrismaService } from '../prisma/prisma.service';
import { ActualizarProveedorDto } from './dto/actualizar-proveedor.dto';
import { CrearProveedorDto } from './dto/crear-proveedor.dto';
import { aProveedorResponse, ProveedorResponse } from './proveedor.mapper';

// Mensaje de dominio del Go (internal/domain/proveedor.go), verbatim.
const MSG_NO_ENCONTRADO = 'proveedor no encontrado';

@Injectable()
export class ProveedorService {
  constructor(private readonly prisma: PrismaService) {}

  // Paridad: el alta no recibe activo; el server fija Activo true.
  async crear(dto: CrearProveedorDto): Promise<ProveedorResponse> {
    const proveedor = await this.prisma.proveedor.create({
      data: {
        nombre: dto.nombre,
        cuit: dto.cuit,
        telefono: dto.telefono,
        email: dto.email,
        activo: true,
      },
    });
    return aProveedorResponse(proveedor);
  }

  // Paridad: solo activos, ORDER BY nombre; lista vacía serializa null.
  async listar(): Promise<ProveedorResponse[] | null> {
    const proveedores = await this.prisma.proveedor.findMany({
      where: { activo: true },
      orderBy: { nombre: 'asc' },
    });
    return listaONull(proveedores.map(aProveedorResponse));
  }

  // Paridad: devuelve cualquier proveedor, activo o no.
  async obtenerPorId(id: string): Promise<ProveedorResponse> {
    const proveedor = await this.prisma.proveedor.findUnique({ where: { id } });
    if (!proveedor) {
      throw new NotFoundException(MSG_NO_ENCONTRADO);
    }
    return aProveedorResponse(proveedor);
  }

  // Paridad con ActualizarProveedor: full replacement validada.
  async actualizar(id: string, dto: ActualizarProveedorDto): Promise<ProveedorResponse> {
    const proveedor = await this.prisma.proveedor.findUnique({ where: { id } });
    if (!proveedor) {
      throw new NotFoundException(MSG_NO_ENCONTRADO);
    }

    const actualizado = await this.prisma.proveedor.update({
      where: { id },
      data: {
        nombre: dto.nombre,
        cuit: dto.cuit,
        telefono: dto.telefono,
        email: dto.email,
        activo: dto.activo,
      },
    });
    return aProveedorResponse(actualizado);
  }

  // Paridad: borrado lógico CIEGO (el Go hace UPDATE sin verificar →
  // cualquier id responde 204, incluso inexistente).
  async eliminar(id: string): Promise<void> {
    await this.prisma.proveedor.updateMany({ where: { id }, data: { activo: false } });
  }
}
