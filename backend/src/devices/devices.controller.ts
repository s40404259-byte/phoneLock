import { Body, Controller, Post } from '@nestjs/common';
import { ActivateDeviceDto } from './dto/activate-device.dto';
import { DevicesService } from './devices.service';

@Controller('devices')
export class DevicesController {
  constructor(private readonly devicesService: DevicesService) {}

  @Post('activate')
  activate(@Body() dto: ActivateDeviceDto) {
    return this.devicesService.activate(dto);
  }
}
