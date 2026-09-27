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
      const message =
        typeof body === 'string'
          ? body
          : typeof body === 'object' && body !== null && 'message' in body
            ? String((body as { message: string }).message)
            : 'error interno';
      response.status(status).json({ error: message });
      return;
    }

    response.status(HttpStatus.INTERNAL_SERVER_ERROR).json({ error: 'error interno' });
  }
}