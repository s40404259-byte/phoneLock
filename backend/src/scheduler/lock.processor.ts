import { Injectable } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { PrismaService } from '../prisma/prisma.service';
import { LocksService } from '../locks/locks.service';

@Injectable()
export class LockProcessor {
  constructor(private readonly prisma: PrismaService, private readonly locksService: LocksService) {}

  @Cron(CronExpression.EVERY_4_HOURS)
  async checkOverdue() {
    const now = new Date();
    const overdue = await this.prisma.emiSchedule.findMany({ where: { nextDueDate: { lt: now }, status: 'ACTIVE' } });
    await Promise.all(overdue.map((item) => this.locksService.triggerLock(item.deviceImei, 2, 'Automated overdue lock')));
  }
}
