import { Module } from '@nestjs/common';
import { LocksModule } from '../locks/locks.module';
import { LockProcessor } from './lock.processor';

@Module({
  imports: [LocksModule],
  providers: [LockProcessor]
})
export class SchedulerModule {}
