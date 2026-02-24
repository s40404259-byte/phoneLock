import { IsInt, IsString, Length, Max, Min } from 'class-validator';

export class TriggerLockDto {
  @IsString()
  @Length(15, 15)
  imei!: string;

  @IsInt()
  @Min(0)
  @Max(3)
  stage!: number;

  @IsString()
  reason!: string;
}
