import { BadRequestException, Injectable, PipeTransform } from '@nestjs/common';
import { isUUID } from 'class-validator';

// Paridad con el Go: cualquier {id} que no sea UUID → 400 "id inválido".
@Injectable()
export class ParseUuidPipe implements PipeTransform<string, string> {
  transform(value: string): string {
    if (!isUUID(value)) {
      throw new BadRequestException('id inválido');
    }
    return value;
  }
}