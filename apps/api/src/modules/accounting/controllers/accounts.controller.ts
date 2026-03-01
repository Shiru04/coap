import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { ClerkAuthGuard } from '../../auth/guards/clerk-auth.guard';
import { CompanyGuard } from '../guards/company.guard';
import { CompanyId, UserId } from '../../../common/decorators/company-context.decorator';
import { AccountsService } from '../services/accounts.service';
import { CreateAccountDto } from '../dto/create-account.dto';
import { UpdateAccountDto } from '../dto/update-account.dto';
import { QueryAccountsDto } from '../dto/query-accounts.dto';

@ApiTags('accounting')
@ApiBearerAuth()
@UseGuards(ClerkAuthGuard, CompanyGuard)
@Controller('accounting/accounts')
export class AccountsController {
  constructor(private readonly accountsService: AccountsService) {}

  @Get()
  @ApiOperation({ summary: 'List all accounts' })
  findAll(@CompanyId() companyId: string, @Query() query: QueryAccountsDto) {
    return this.accountsService.findAll(companyId, query);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get account with current balance' })
  findOne(@CompanyId() companyId: string, @Param('id') id: string) {
    return this.accountsService.findOne(companyId, id);
  }

  @Post()
  @ApiOperation({ summary: 'Create a new account' })
  @ApiResponse({ status: 201, description: 'Account created' })
  create(
    @CompanyId() companyId: string,
    @UserId() userId: string,
    @Body() dto: CreateAccountDto,
  ) {
    return this.accountsService.create(companyId, dto, userId);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update account (name, description, active status)' })
  update(
    @CompanyId() companyId: string,
    @UserId() userId: string,
    @Param('id') id: string,
    @Body() dto: UpdateAccountDto,
  ) {
    return this.accountsService.update(companyId, id, dto, userId);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Deactivate account (soft delete if journal lines exist)' })
  remove(
    @CompanyId() companyId: string,
    @UserId() userId: string,
    @Param('id') id: string,
  ) {
    return this.accountsService.deactivate(companyId, id, userId);
  }
}
