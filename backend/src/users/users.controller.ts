import { Controller, Get, Param } from '@nestjs/common';
import { UsersService } from './users.service';

@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get(':mobile')
  getByMobile(@Param('mobile') mobile: string) {
    return this.usersService.findByMobile(mobile);
  }
}
