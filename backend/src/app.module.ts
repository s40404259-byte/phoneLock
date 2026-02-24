import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ScheduleModule } from '@nestjs/schedule';
import configuration from './config/configuration';
import { PrismaModule } from './prisma/prisma.module';
import { UsersModule } from './users/users.module';
import { DevicesModule } from './devices/devices.module';
import { EmiModule } from './emi/emi.module';
import { PaymentsModule } from './payments/payments.module';
import { LocksModule } from './locks/locks.module';
import { WebhooksModule } from './webhooks/webhooks.module';
import { NotificationsModule } from './notifications/notifications.module';
import { SchedulerModule } from './scheduler/scheduler.module';
import { AdminModule } from './admin/admin.module';
import { AuditModule } from './audit/audit.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true, load: [configuration] }),
    ScheduleModule.forRoot(),
    PrismaModule,
    AuditModule,
    UsersModule,
    DevicesModule,
    EmiModule,
    PaymentsModule,
    LocksModule,
    WebhooksModule,
    NotificationsModule,
    SchedulerModule,
    AdminModule
  ]
})
export class AppModule {}
