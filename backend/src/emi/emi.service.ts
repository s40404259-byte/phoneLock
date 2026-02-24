import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class EmiService {
  constructor(private readonly prisma: PrismaService) {}

  statusByImei(imei: string) {
    return this.prisma.emiSchedule.findUnique({ where: { deviceImei: imei } });
  }
}
