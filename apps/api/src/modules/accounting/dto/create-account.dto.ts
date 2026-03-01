import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsString,
  IsEnum,
  IsOptional,
  IsBoolean,
  MaxLength,
  Matches,
} from 'class-validator';
import { AccountType } from '@coap/database';

export class CreateAccountDto {
  @ApiProperty({ example: '1050' })
  @IsString()
  @Matches(/^\d{4,6}$/, { message: 'accountNumber must be 4–6 digits' })
  code: string;

  @ApiProperty({ example: 'Cash — Operations' })
  @IsString()
  @MaxLength(200)
  name: string;

  @ApiProperty({ enum: AccountType })
  @IsEnum(AccountType)
  type: AccountType;

  @ApiPropertyOptional({ example: 'Checking' })
  @IsOptional()
  @IsString()
  sub_type?: string;

  @ApiPropertyOptional({ description: 'Parent account ID for sub-accounts' })
  @IsOptional()
  @IsString()
  parent_id?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(500)
  description?: string;

  @ApiPropertyOptional({ default: false })
  @IsOptional()
  @IsBoolean()
  is_bank_account?: boolean;
}
