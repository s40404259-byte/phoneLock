import { Body, Controller, Post } from '@nestjs/common';
import { LocksService } from './locks.service';
import { TriggerLockDto } from './dto/trigger-lock.dto';
import { UnlockDeviceDto } from './dto/unlock-device.dto';

@Controller('locks')
export class LocksController {
  constructor(private readonly locksService: LocksService) {}

  @Post('trigger')
  trigger(@Body() dto: TriggerLockDto) {
    return this.locksService.triggerLock(dto.imei, dto.stage, dto.reason);
  }

  @Post('unlock')
  unlock(@Body() dto: UnlockDeviceDto) {
    return this.locksService.unlockDevice(dto.imei, dto.reason);
  }
}
