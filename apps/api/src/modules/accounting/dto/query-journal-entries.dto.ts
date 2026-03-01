import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsOptional, IsString, IsDateString, IsInt, Min, Max } from 'class-validator';
import { Type } from 'class-transformer';
import { JournalEntryStatus, JournalEntryType } from '@coap/database';

export class QueryJournalEntriesDto {
  @ApiPropertyOptional({ description: 'Number of records to return', default: 50 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(1000)
  take?: number;

  @ApiPropertyOptional({ description: 'Number of records to skip', default: 0 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  skip?: number;

  @ApiPropertyOptional({ enum: JournalEntryStatus })
  @IsOptional()
  @IsEnum(JournalEntryStatus)
  status?: JournalEntryStatus;

  @ApiPropertyOptional({ enum: JournalEntryType })
  @IsOptional()
  @IsEnum(JournalEntryType)
  type?: JournalEntryType;

  @ApiPropertyOptional({ example: '2025-01-01' })
  @IsOptional()
  @IsDateString()
  date_from?: string;

  @ApiPropertyOptional({ example: '2025-12-31' })
  @IsOptional()
  @IsDateString()
  date_to?: string;

  @ApiPropertyOptional({ description: 'Source module: AR, AP, PAYROLL, etc.' })
  @IsOptional()
  @IsString()
  source_type?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  search?: string;
}
