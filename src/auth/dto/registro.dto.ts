import { IsIn, IsNotEmpty, IsString, MinLength } from 'class-validator';

// Paridad con domain.NuevoUsuario del Go: solo requiere nombre/email no vacíos
// (sin validación de formato de email), password >= 8 y rol exacto con acentos.
export class RegistroDto {
  @IsString()
  @IsNotEmpty({ message: 'nombre y email son obligatorios' })
  nombre!: string;

  @IsString()
  @IsNotEmpty({ message: 'nombre y email son obligatorios' })
  email!: string;

  @IsString()
  @MinLength(8, { message: 'la contraseña debe tener al menos 8 caracteres' })
  password!: string;

  @IsString()
  @IsIn(['dueño', 'empleado'], { message: "el rol debe ser 'dueño' o 'empleado'" })
  rol!: string;
}