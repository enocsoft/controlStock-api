import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';

import { jwtSecret } from '../config/env';

export interface JwtPayload {
  usuario_id: string;
  rol: string;
}

export interface UsuarioAutenticado {
  usuarioId: string;
  rol: string;
}

// Claims exactos del Go: { usuario_id, rol } + iat/exp (sin sub/iss/aud/jti).
@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor() {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: jwtSecret,
    });
  }

  validate(payload: JwtPayload): UsuarioAutenticado {
    return { usuarioId: payload.usuario_id, rol: payload.rol };
  }
}