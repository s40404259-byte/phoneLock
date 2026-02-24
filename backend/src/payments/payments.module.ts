import { Module } from '@nestjs/common';
import { PaymentsService } from './payments.service';
import { LocksModule } from '../locks/locks.module';

@Module({
  imports: [LocksModule],
  providers: [PaymentsService],
  exports: [PaymentsService]
})
export class PaymentsModule {}
