import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { ClerkAuthGuard } from '../../auth/guards/clerk-auth.guard';
import { CompanyGuard } from '../guards/company.guard';
import { CompanyId, UserId } from '../../../common/decorators/company-context.decorator';
import { FiscalYearsService } from '../services/fiscal-years.service';
import { CreateFiscalYearDto, CloseFiscalYearDto } from '../dto/create-fiscal-year.dto';

@ApiTags('accounting')
@ApiBearerAuth()
@UseGuards(ClerkAuthGuard, CompanyGuard)
@Controller('accounting/fiscal-years')
export class FiscalYearsController {
  constructor(private readonly service: FiscalYearsService) {}

  @Get()
  @ApiOperation({ summary: 'List all fiscal years' })
  findAll(@CompanyId() companyId: string) {
    return this.service.findAll(companyId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get fiscal year with periods' })
  findOne(@CompanyId() companyId: string, @Param('id') id: string) {
    return this.service.findOne(companyId, id);
  }

  @Post()
  @ApiOperation({ summary: 'Create fiscal year with auto-generated 12 periods' })
  create(
    @CompanyId() companyId: string,
    @UserId() userId: string,
    @Body() dto: CreateFiscalYearDto,
  ) {
    return this.service.create(companyId, dto, userId);
  }

  @Post(':id/close')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Close fiscal year — all 12 periods must be locked first' })
  close(
    @CompanyId() companyId: string,
    @UserId() userId: string,
    @Param('id') id: string,
    @Body() _dto: CloseFiscalYearDto,
  ) {
    return this.service.close(companyId, id, userId);
  }
}
