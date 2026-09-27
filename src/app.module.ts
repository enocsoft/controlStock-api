import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';

import { AuthModule } from './auth/auth.module';
import { ClientesModule } from './clientes/cliente.module';
import { HealthModule } from './health/health.module';
import { PrismaModule } from './prisma/prisma.module';
import { ProductosModule } from './productos/producto.module';
import { ProveedoresModule } from './proveedores/proveedor.module';
import { UsuariosModule } from './usuarios/usuario.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    PrismaModule,
    HealthModule,
    AuthModule,
    ProductosModule,
    UsuariosModule,
    ClientesModule,
    ProveedoresModule,
  ],
})
export class AppModule {}