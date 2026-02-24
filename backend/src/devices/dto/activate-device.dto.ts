import { IsDateString, IsInt, IsOptional, IsString, Length, Min } from 'class-validator';

export class ActivateDeviceDto {
  @IsString()
  @Length(15, 15)
  imei!: string;

  @IsString()
  mobile!: string;

  @IsString()
  consentHash!: string;

  @IsOptional()
  @IsString()
  aadhaarHash?: string;

  @IsOptional()
  @IsString()
  fcmToken?: string;

  @IsOptional()
  @IsInt()
  @Min(1)
  principalAmount?: number;

  @IsOptional()
  @IsInt()
  @Min(1)
  emiAmount?: number;

  @IsOptional()
  @IsInt()
  @Min(1)
  tenureMonths?: number;

  @IsOptional()
  @IsDateString()
  dueDate?: string;

  @IsOptional()
  @IsDateString()
  nextDueDate?: string;
}
