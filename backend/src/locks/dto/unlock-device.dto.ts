import { IsString, Length } from 'class-validator';

export class UnlockDeviceDto {
  @IsString()
  @Length(15, 15)
  imei!: string;

  @IsString()
  reason!: string;
}
