import { Controller, Get, Param } from '@nestjs/common';
import { EmiService } from './emi.service';
import { PrismaService } from '../prisma/prisma.service';

@Controller('emi')
export class EmiController {
  constructor(private readonly emiService: EmiService, private readonly prisma: PrismaService) {}

  @Get('status/:imei')
  async status(@Param('imei') imei: string) {
    const [device, emi] = await Promise.all([
      this.prisma.device.findUnique({ where: { imei } }),
      this.emiService.statusByImei(imei)
    ]);
    return {
      imei,
      isLocked: device?.isLocked ?? false,
      currentLockStage: device?.currentLockStage ?? 0,
      emi
    };
  }
}
