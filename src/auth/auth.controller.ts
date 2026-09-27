import { Body, Controller, HttpCode, HttpStatus, Post } from '@nestjs/common';

import { AuthService, UsuarioRegistrado } from './auth.service';
import { LoginDto } from './dto/login.dto';
import { RegistroDto } from './dto/registro.dto';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('registro')
  registrar(@Body() dto: RegistroDto): Promise<UsuarioRegistrado> {
    return this.authService.registrar(dto);
  }

  @Post('login')
  @HttpCode(HttpStatus.OK)
  login(@Body() dto: LoginDto): Promise<{ token: string }> {
    return this.authService.login(dto);
  }
}