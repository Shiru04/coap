import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsString,
  IsDateString,
  IsOptional,
  IsArray,
  ValidateNested,
  IsEnum,
  MaxLength,
  IsNumberString,
} from 'class-validator';
import { Type } from 'class-transformer';
import { JournalEntryType } from '@coap/database';

export class JournalLineDto {
  @ApiProperty({ description: 'Account ID' })
  @IsString()
  account_id: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(500)
  description?: string;

  @ApiProperty({ description: 'Debit amount (Decimal string, e.g. "1500.00")' })
  @IsNumberString()
  debit: string;

  @ApiProperty({ description: 'Credit amount (Decimal string, e.g. "1500.00")' })
  @IsNumberString()
  credit: string;

  @ApiPropertyOptional({ description: 'Job ID for job costing' })
  @IsOptional()
  @IsString()
  job_id?: string;

  @ApiPropertyOptional({ description: 'Phase ID for job costing' })
  @IsOptional()
  @IsString()
  phase_id?: string;

  @ApiPropertyOptional({ description: 'Cost code ID for job costing' })
  @IsOptional()
  @IsString()
  cost_code_id?: string;
}

export class CreateJournalEntryDto {
  @ApiProperty({ example: '2025-01-15' })
  @IsDateString()
  date: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(1000)
  memo?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(100)
  reference?: string;

  @ApiPropertyOptional({ enum: JournalEntryType, default: JournalEntryType.STANDARD })
  @IsOptional()
  @IsEnum(JournalEntryType)
  type?: JournalEntryType;

  @ApiPropertyOptional({ description: 'Source module (AR, AP, PAYROLL, etc.)' })
  @IsOptional()
  @IsString()
  source_type?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  source_id?: string;

  @ApiProperty({ type: [JournalLineDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => JournalLineDto)
  lines: JournalLineDto[];
}
