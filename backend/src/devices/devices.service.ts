import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { ActivateDeviceDto } from './dto/activate-device.dto';
import { AuditService } from '../audit/audit.service';

@Injectable()
export class DevicesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly auditService: AuditService
  ) {}

  async activate(dto: ActivateDeviceDto) {
    const result = await this.prisma.$transaction(async (tx) => {
      const user = await tx.user.upsert({
        where: { mobile: dto.mobile },
        update: { consentHash: dto.consentHash, aadhaarHash: dto.aadhaarHash },
        create: { mobile: dto.mobile, consentHash: dto.consentHash, aadhaarHash: dto.aadhaarHash }
      });

      const device = await tx.device.create({
        data: { imei: dto.imei, userId: user.id, fcmToken: dto.fcmToken }
      });

      const emi = await tx.emiSchedule.create({
        data: {
          userId: user.id,
          deviceImei: dto.imei,
          principalAmount: dto.principalAmount ?? 0,
          emiAmount: dto.emiAmount ?? 0,
          tenureMonths: dto.tenureMonths ?? 1,
          dueDate: dto.dueDate ? new Date(dto.dueDate) : new Date(),
          nextDueDate: dto.nextDueDate ? new Date(dto.nextDueDate) : new Date()
        }
      });

      return { user, device, emi };
    });

    await this.auditService.log('ACTIVATE_DEVICE', 'Device', result.device.imei, 'retailer', result);

    return { success: true, userId: result.user.id, imei: result.device.imei, emiId: result.emi.id };
  }
}
