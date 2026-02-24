import { Module } from '@nestjs/common';
import { EmiController } from './emi.controller';
import { EmiService } from './emi.service';

@Module({
  providers: [EmiService],
  controllers: [EmiController],
  exports: [EmiService]
})
export class EmiModule {}
