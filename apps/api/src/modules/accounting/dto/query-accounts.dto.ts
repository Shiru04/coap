import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsOptional, IsString, IsBoolean, IsInt, Min, Max } from 'class-validator';
import { Transform, Type } from 'class-transformer';
import { AccountType } from '@coap/database';

export class QueryAccountsDto {
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

  @ApiPropertyOptional({ enum: AccountType })
  @IsOptional()
  @IsEnum(AccountType)
  type?: AccountType;

  @ApiPropertyOptional()
  @IsOptional()
  @Transform(({ value }: { value: string }) => value === 'true')
  @IsBoolean()
  is_active?: boolean;

  @ApiPropertyOptional({ description: 'Search by name or code' })
  @IsOptional()
  @IsString()
  search?: string;

  @ApiPropertyOptional({ description: 'Filter to top-level accounts only (no parent)' })
  @IsOptional()
  @Transform(({ value }: { value: string }) => value === 'true')
  @IsBoolean()
  root_only?: boolean;
}
