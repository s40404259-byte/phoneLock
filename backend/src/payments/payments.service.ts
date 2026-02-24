import { Injectable } from '@nestjs/common';
import { Prisma, PaymentStatus } from '@prisma/client';
import { LocksService } from '../locks/locks.service';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class PaymentsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly locksService: LocksService
  ) {}

  async processWebhook(emiId: string, userId: string, txnId: string, amount: number, payload: Prisma.JsonObject) {
    await this.prisma.$transaction(async (tx) => {
      await tx.payment.upsert({
        where: { txnId },
        update: { status: PaymentStatus.SUCCESS, amount, razorpayPayload: payload, paidAt: new Date() },
        create: { emiId, userId, txnId, amount, status: PaymentStatus.SUCCESS, razorpayPayload: payload, paidAt: new Date() }
      });
      await tx.emiSchedule.update({ where: { id: emiId }, data: { totalPaid: { increment: amount } } });
    });

    const emi = await this.prisma.emiSchedule.findUnique({ where: { id: emiId } });
    if (emi) await this.locksService.unlockDevice(emi.deviceImei, 'Payment success');
    return { received: true };
  }
}
