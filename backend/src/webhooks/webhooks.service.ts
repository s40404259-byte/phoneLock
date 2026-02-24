import { Injectable, UnauthorizedException } from '@nestjs/common';
import * as crypto from 'crypto';
import { PaymentsService } from '../payments/payments.service';

@Injectable()
export class WebhooksService {
  constructor(private readonly paymentsService: PaymentsService) {}

  async handleRazorpay(signature: string, rawBody: string, parsed: any) {
    const expected = crypto
      .createHmac('sha256', process.env.RAZORPAY_WEBHOOK_SECRET || '')
      .update(rawBody)
      .digest('hex');

    if (expected !== signature) throw new UnauthorizedException('Invalid signature');

    const entity = parsed?.payload?.payment?.entity;
    return this.paymentsService.processWebhook(
      parsed?.payload?.payment?.entity?.notes?.emiId,
      parsed?.payload?.payment?.entity?.notes?.userId,
      entity?.id,
      Number(entity?.amount || 0) / 100,
      parsed
    );
  }
}
