import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Query,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiQuery } from '@nestjs/swagger';
import { IsOptional, IsString } from 'class-validator';
import { ClerkAuthGuard } from '../../auth/guards/clerk-auth.guard';
import { CompanyGuard } from '../guards/company.guard';
import { CompanyId, UserId } from '../../../common/decorators/company-context.decorator';
import { PeriodsService } from '../services/periods.service';
import { LockPeriodDto, UnlockPeriodDto } from '../dto/lock-period.dto';

class PeriodQueryDto {
  @IsOptional()
  @IsString()
  fiscal_year_id?: string;
}

@ApiTags('accounting')
@ApiBearerAuth()
@UseGuards(ClerkAuthGuard, CompanyGuard)
@Controller('accounting/periods')
export class PeriodsController {
  constructor(private readonly service: PeriodsService) {}

  @Get()
  @ApiOperation({ summary: 'List periods, optionally filtered by fiscal year' })
  @ApiQuery({ name: 'fiscal_year_id', required: false })
  findAll(@CompanyId() companyId: string, @Query() query: PeriodQueryDto) {
    return this.service.findAll(companyId, query.fiscal_year_id);
  }

  @Post(':id/lock')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Lock a period — prevents all GL writes to this period' })
  lock(
    @CompanyId() companyId: string,
    @UserId() userId: string,
    @Param('id') id: string,
    @Body() dto: LockPeriodDto,
  ) {
    return this.service.lock(companyId, id, userId, dto);
  }

  @Post(':id/unlock')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Unlock a period (admin only)' })
  unlock(
    @CompanyId() companyId: string,
    @UserId() userId: string,
    @Param('id') id: string,
    @Body() dto: UnlockPeriodDto,
  ) {
    return this.service.unlock(companyId, id, userId, dto);
  }
}
