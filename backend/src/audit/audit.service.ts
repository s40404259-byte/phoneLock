import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class AuditService {
  constructor(private readonly prisma: PrismaService) {}

  log(action: string, entityType: string, entityId: string, performedBy: string, afterState?: unknown) {
    return this.prisma.auditLog.create({
      data: { action, entityType, entityId, performedBy, afterState }
    });
  }
}
