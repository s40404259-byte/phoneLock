import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class ReportsService {
  constructor(private readonly prisma: PrismaService) {}

  async overdue() {
    const items = await this.prisma.emiSchedule.findMany({ where: { status: 'OVERDUE' }, include: { device: true, user: true } });
    return {
      summary: {
        totalOverdueAccounts: items.length,
        totalOutstanding: items.reduce((sum, item) => sum + Number(item.emiAmount), 0)
      },
      items: items.map((item) => ({
        imei: item.deviceImei,
        mobile: item.user.mobile,
        lockStage: item.device.currentLockStage,
        outstanding: Number(item.emiAmount)
      }))
    };
  }
}
