import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { NotificationsService } from '../notifications/notifications.service';

@Injectable()
export class LocksService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly notifications: NotificationsService
  ) {}

  async triggerLock(imei: string, stage: number, reason: string) {
    const device = await this.prisma.device.findUnique({ where: { imei } });
    if (!device) throw new NotFoundException('Device not found');

    await this.prisma.$transaction([
      this.prisma.device.update({ where: { imei }, data: { isLocked: stage > 0, currentLockStage: stage } }),
      this.prisma.lockHistory.create({ data: { deviceImei: imei, stage, reason } })
    ]);

    if (device.fcmToken) await this.notifications.sendLockCommand(device.fcmToken, imei, stage, reason);
    return { success: true, imei, stage };
  }

  unlockDevice(imei: string, reason: string) {
    return this.triggerLock(imei, 0, reason);
  }
}
