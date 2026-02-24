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

    await this.prisma.$transaction(async (tx) => {
      await tx.device.update({
        where: { imei },
        data: { isLocked: stage > 0, currentLockStage: stage }
      });

      if (stage > 0) {
        await tx.lockHistory.create({ data: { deviceImei: imei, stage, reason } });
      } else {
        const activeLock = await tx.lockHistory.findFirst({
          where: { deviceImei: imei, unlockedAt: null },
          orderBy: { lockedAt: 'desc' }
        });

        if (activeLock) {
          await tx.lockHistory.update({
            where: { id: activeLock.id },
            data: { unlockedAt: new Date(), unlockedBy: 'system', metadata: { reason } }
          });
        }
      }
    });

    if (device.fcmToken) {
      await this.notifications.sendLockCommand(device.fcmToken, imei, stage, reason);
    }

    return { success: true, imei, stage };
  }

  unlockDevice(imei: string, reason: string) {
    return this.triggerLock(imei, 0, reason);
  }
}
