import { Injectable } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { EmiStatus } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { LocksService } from '../locks/locks.service';

@Injectable()
export class LockProcessor {
  constructor(
    private readonly prisma: PrismaService,
    private readonly locksService: LocksService
  ) {}

  @Cron(CronExpression.EVERY_4_HOURS)
  async checkOverdue() {
    const now = new Date();
    const schedules = await this.prisma.emiSchedule.findMany({
      where: { status: { in: [EmiStatus.ACTIVE, EmiStatus.OVERDUE] } }
    });

    for (const item of schedules) {
      const graceMs = item.graceDays * 24 * 60 * 60 * 1000;
      const overdueAt = new Date(item.nextDueDate.getTime() + graceMs);
      if (now > overdueAt) {
        await this.prisma.emiSchedule.update({
          where: { id: item.id },
          data: { status: EmiStatus.OVERDUE }
        });
        await this.locksService.triggerLock(item.deviceImei, 2, 'Automated overdue lock');
      }
    }
  }
}
