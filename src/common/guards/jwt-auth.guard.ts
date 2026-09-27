import { Injectable, UnauthorizedException } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

// Paridad con el middleware Go: faltante → "falta el header Authorization";
// token inválido/expirado → "token inválido o expirado" (401 en ambos).
@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {
  handleRequest<TUser = { usuarioId: string; rol: string }>(
    err: unknown,
    user: TUser | null,
    info: { message?: string } | undefined,
  ): TUser {
    if (err || !user) {
      const message =
        info?.message === 'No auth token'
          ? 'falta el header Authorization'
          : 'token inválido o expirado';
      throw new UnauthorizedException(message);
    }
    return user;
  }
}