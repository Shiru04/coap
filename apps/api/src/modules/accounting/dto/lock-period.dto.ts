import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsNotEmpty, IsOptional, IsString, MaxLength } from 'class-validator';

export class LockPeriodDto {
  @ApiPropertyOptional({ description: 'Optional reason for locking the period' })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  reason?: string;
}

export class UnlockPeriodDto {
  @ApiProperty({ description: 'Reason for unlocking — required for audit trail' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(500)
  reason: string;
}
