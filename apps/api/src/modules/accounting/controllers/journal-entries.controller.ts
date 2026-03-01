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
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { ClerkAuthGuard } from '../../auth/guards/clerk-auth.guard';
import { CompanyGuard } from '../guards/company.guard';
import { CompanyId, UserId } from '../../../common/decorators/company-context.decorator';
import { JournalEntriesService } from '../services/journal-entries.service';
import { CreateJournalEntryDto } from '../dto/create-journal-entry.dto';
import { UpdateJournalEntryDto } from '../dto/update-journal-entry.dto';
import { QueryJournalEntriesDto } from '../dto/query-journal-entries.dto';

@ApiTags('accounting')
@ApiBearerAuth()
@UseGuards(ClerkAuthGuard, CompanyGuard)
@Controller('accounting/journal-entries')
export class JournalEntriesController {
  constructor(private readonly service: JournalEntriesService) {}

  @Get()
  @ApiOperation({ summary: 'List journal entries with filters' })
  findAll(@CompanyId() companyId: string, @Query() query: QueryJournalEntriesDto) {
    return this.service.findAll(companyId, query);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get full journal entry with lines' })
  findOne(@CompanyId() companyId: string, @Param('id') id: string) {
    return this.service.findOne(companyId, id);
  }

  @Post()
  @ApiOperation({ summary: 'Create journal entry as DRAFT' })
  create(
    @CompanyId() companyId: string,
    @UserId() userId: string,
    @Body() dto: CreateJournalEntryDto,
  ) {
    return this.service.create(companyId, dto, userId);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update DRAFT journal entry' })
  update(
    @CompanyId() companyId: string,
    @UserId() userId: string,
    @Param('id') id: string,
    @Body() dto: UpdateJournalEntryDto,
  ) {
    return this.service.update(companyId, id, dto, userId);
  }

  @Post(':id/post')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Post journal entry (validates balance + period lock)' })
  post(
    @CompanyId() companyId: string,
    @UserId() userId: string,
    @Param('id') id: string,
  ) {
    return this.service.post(companyId, id, userId);
  }

  @Post(':id/void')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Void posted entry — creates reversing entry' })
  void(
    @CompanyId() companyId: string,
    @UserId() userId: string,
    @Param('id') id: string,
  ) {
    return this.service.void(companyId, id, userId);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Delete DRAFT journal entry' })
  remove(
    @CompanyId() companyId: string,
    @UserId() userId: string,
    @Param('id') id: string,
  ) {
    return this.service.remove(companyId, id, userId);
  }
}
