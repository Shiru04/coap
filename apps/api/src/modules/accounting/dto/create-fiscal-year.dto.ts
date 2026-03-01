import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsDateString, IsOptional, Matches, MaxLength } from 'class-validator';

export class CreateFiscalYearDto {
  @ApiProperty({ example: 'FY2025', description: 'Fiscal year name' })
  @IsString()
  @MaxLength(20)
  @Matches(/^FY\d{4}$/, { message: 'name must be in format FY{YYYY}, e.g. FY2025' })
  name: string;

  @ApiProperty({
    example: '2025-01-01',
    description: 'First day of the fiscal year. Month determines the fiscal year start.',
  })
  @IsDateString()
  start_date: string;
}

export class CloseFiscalYearDto {
  @ApiPropertyOptional({ description: 'Optional reason for closing the fiscal year' })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  reason?: string;
}
