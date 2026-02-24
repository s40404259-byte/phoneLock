import { Body, Controller, Headers, Post, Req } from '@nestjs/common';
import { Request } from 'express';
import { WebhooksService } from './webhooks.service';

@Controller('webhooks')
export class WebhooksController {
  constructor(private readonly webhooksService: WebhooksService) {}

  @Post('razorpay')
  razorpay(@Headers('x-razorpay-signature') signature: string, @Body() body: any, @Req() req: Request) {
    const rawBody = (req as any).rawBody?.toString?.() ?? JSON.stringify(body);
    return this.webhooksService.handleRazorpay(signature, rawBody, body);
  }
}
