import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { Response } from 'express';

/**
 * Re-da forma a TODAS las respuestas de error al envelope del contrato Go:
 * `{ "error": "<mensaje>" }` con su status HTTP. Los 500 internos no filtran
 * detalles (paridad con el Go: "error interno").
 */
@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  catch(exception: unknown, host: ArgumentsHost): void {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();

    if (exception instanceof HttpException) {
      const status = exception.getStatus();
      const body = exception.getResponse();
      let message = 'error interno';
      if (typeof body === 'string') {
        message = body;
      } else if (typeof body === 'object' && body !== null && 'message' in body) {
        const raw = (body as { message: string | string[] }).message;
        // ValidationPipe agrupa los errores; el contrato Go devuelve UN mensaje,
        // así que tomamos el primero (mismo orden que class-validator).
        message = Array.isArray(raw) ? raw[0] : String(raw);
      }
      response.status(status).json({ error: message });
      return;
    }

    response.status(HttpStatus.INTERNAL_SERVER_ERROR).json({ error: 'error interno' });
  }
}