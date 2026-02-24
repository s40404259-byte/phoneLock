import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class UsersService {
  constructor(private readonly prisma: PrismaService) {}

  findByMobile(mobile: string) {
    return this.prisma.user.findUnique({ where: { mobile } });
  }
}
