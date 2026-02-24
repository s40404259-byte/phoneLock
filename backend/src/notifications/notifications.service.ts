import { Injectable, Logger } from '@nestjs/common';
import * as admin from 'firebase-admin';

@Injectable()
export class NotificationsService {
  private readonly logger = new Logger(NotificationsService.name);

  constructor() {
    if (!admin.apps.length && process.env.FCM_PROJECT_ID && process.env.FCM_CLIENT_EMAIL && process.env.FCM_PRIVATE_KEY) {
      admin.initializeApp({
        credential: admin.credential.cert({
          projectId: process.env.FCM_PROJECT_ID,
          clientEmail: process.env.FCM_CLIENT_EMAIL,
          privateKey: process.env.FCM_PRIVATE_KEY.replace(/\\n/g, '\n')
        })
      });
    }
  }

  async sendLockCommand(token: string, imei: string, stage: number, reason: string) {
    if (!admin.apps.length) {
      this.logger.warn('FCM not configured; skipping send');
      return;
    }

    await admin.messaging().send({
      token,
      android: { priority: 'high' },
      data: { type: 'LOCK_UPDATE', imei, stage: String(stage), reason }
    });
  }
}
