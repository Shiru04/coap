import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, MaxLength } from 'class-validator';

export class LockPeriodDto {
  @ApiPropertyOptional({ description: 'Optional reason for locking the period' })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  reason?: string;
}

export class UnlockPeriodDto {
  @ApiPropertyOptional({ description: 'Reason for unlocking — required for audit trail' })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  reason?: string;
}
