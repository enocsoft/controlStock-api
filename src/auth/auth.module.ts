import { Global, Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';

import { jwtSecret } from '../config/env';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { JwtStrategy } from './jwt.strategy';

// Global: JwtStrategy y JwtModule quedan disponibles para cualquier módulo
// de recursos que use el JwtAuthGuard.
@Global()
@Module({
  imports: [
    PassportModule,
    JwtModule.register({
      secret: jwtSecret,
    }),
  ],
  controllers: [AuthController],
  providers: [AuthService, JwtStrategy],
  exports: [AuthService, JwtStrategy, JwtModule],
})
export class AuthModule {}