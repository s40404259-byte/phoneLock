import { Controller, Get } from '@nestjs/common';
import { ReportsService } from './reports.service';

@Controller('admin/reports')
export class AdminController {
  constructor(private readonly reportsService: ReportsService) {}

  @Get('overdue')
  overdue() {
    return this.reportsService.overdue();
  }
}
