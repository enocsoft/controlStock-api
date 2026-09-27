import { Module } from '@nestjs/common';

import { MovimientoStockController } from './movimiento-stock.controller';
import { MovimientoStockService } from './movimiento-stock.service';

@Module({
  controllers: [MovimientoStockController],
  providers: [MovimientoStockService],
})
export class MovimientosStockModule {}
