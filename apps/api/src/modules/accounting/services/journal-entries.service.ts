import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import Decimal from 'decimal.js';
import { JournalEntryStatus, JournalEntryType } from '@coap/database';
import { PrismaService } from '../../../database/prisma.service';
import { AuditService } from './audit.service';
import { GlEngineService } from './gl-engine.service';
import { CreateJournalEntryDto } from '../dto/create-journal-entry.dto';
import { UpdateJournalEntryDto } from '../dto/update-journal-entry.dto';
import { QueryJournalEntriesDto } from '../dto/query-journal-entries.dto';

@Injectable()
export class JournalEntriesService {
  constructor(
    private readonly db: PrismaService,
    private readonly glEngine: GlEngineService,
    private readonly audit: AuditService,
  ) {}

  async findAll(companyId: string, query: QueryJournalEntriesDto) {
    return this.db.journalEntry.findMany({
      where: {
        company_id: companyId,
        ...(query.status ? { status: query.status } : {}),
        ...(query.type ? { type: query.type } : {}),
        ...(query.source_type ? { source_type: query.source_type } : {}),
        ...(query.date_from || query.date_to
          ? {
              date: {
                ...(query.date_from ? { gte: new Date(query.date_from) } : {}),
                ...(query.date_to ? { lte: new Date(query.date_to) } : {}),
              },
            }
          : {}),
        ...(query.search
          ? {
              OR: [
                { entry_number: { contains: query.search, mode: 'insensitive' } },
                { memo: { contains: query.search, mode: 'insensitive' } },
                { reference: { contains: query.search, mode: 'insensitive' } },
              ],
            }
          : {}),
      },
      orderBy: { date: 'desc' },
      include: {
        lines: { include: { account: { select: { code: true, name: true } } } },
        period: { select: { name: true } },
      },
    });
  }

  async findOne(companyId: string, id: string) {
    const entry = await this.db.journalEntry.findFirst({
      where: { id, company_id: companyId },
      include: {
        lines: { include: { account: true } },
        period: true,
      },
    });
    if (!entry) throw new NotFoundException(`Journal entry ${id} not found`);
    return entry;
  }

  async create(companyId: string, dto: CreateJournalEntryDto, userId: string) {
    await this.glEngine.validateAccountOwnership(
      companyId,
      dto.lines.map((l) => l.account_id),
    );

    const entryNumber = await this.glEngine.getNextEntryNumber(companyId);
    const entryDate = new Date(dto.date);

    const period = await this.db.accountingPeriod.findFirst({
      where: {
        company_id: companyId,
        start_date: { lte: entryDate },
        end_date: { gte: entryDate },
      },
    });

    const entry = await this.db.journalEntry.create({
      data: {
        company_id: companyId,
        entry_number: entryNumber,
        date: entryDate,
        period_id: period?.id,
        status: JournalEntryStatus.DRAFT,
        type: dto.type ?? JournalEntryType.STANDARD,
        memo: dto.memo,
        reference: dto.reference,
        source_type: dto.source_type,
        source_id: dto.source_id,
        created_by: userId,
        lines: {
          create: dto.lines.map((line) => ({
            company_id: companyId,
            account_id: line.account_id,
            description: line.description,
            debit: new Decimal(line.debit),
            credit: new Decimal(line.credit),
            job_id: line.job_id,
            phase_id: line.phase_id,
            cost_code_id: line.cost_code_id,
          })),
        },
      },
      include: { lines: { include: { account: true } } },
    });

    await this.audit.log({
      company_id: companyId,
      user_id: userId,
      action: 'CREATE',
      entity_type: 'JournalEntry',
      entity_id: entry.id,
      after: { entry_number: entry.entry_number, status: entry.status },
    });

    return entry;
  }

  async update(
    companyId: string,
    id: string,
    dto: UpdateJournalEntryDto,
    userId: string,
  ) {
    const entry = await this.db.journalEntry.findFirst({
      where: { id, company_id: companyId },
    });
    if (!entry) throw new NotFoundException(`Journal entry ${id} not found`);
    if (entry.status !== JournalEntryStatus.DRAFT) {
      throw new ForbiddenException(
        'Only DRAFT journal entries can be modified. Use a reversing entry to correct a posted entry.',
      );
    }

    if (dto.lines) {
      await this.glEngine.validateAccountOwnership(
        companyId,
        dto.lines.map((l) => l.account_id),
      );
    }

    const before = { id: entry.id, status: entry.status, memo: entry.memo };

    const updated = await this.db.$transaction(async (tx) => {
      if (dto.lines) {
        await tx.journalEntryLine.deleteMany({ where: { journal_entry_id: id } });
      }

      return tx.journalEntry.update({
        where: { id },
        data: {
          date: dto.date ? new Date(dto.date) : undefined,
          memo: dto.memo,
          reference: dto.reference,
          ...(dto.lines
            ? {
                lines: {
                  create: dto.lines.map((line) => ({
                    company_id: companyId,
                    account_id: line.account_id,
                    description: line.description,
                    debit: new Decimal(line.debit),
                    credit: new Decimal(line.credit),
                    job_id: line.job_id,
                    phase_id: line.phase_id,
                    cost_code_id: line.cost_code_id,
                  })),
                },
              }
            : {}),
        },
        include: { lines: { include: { account: true } } },
      });
    });

    await this.audit.log({
      company_id: companyId,
      user_id: userId,
      action: 'UPDATE',
      entity_type: 'JournalEntry',
      entity_id: id,
      before,
      after: { memo: updated.memo, line_count: updated.lines.length },
    });

    return updated;
  }

  async post(companyId: string, id: string, userId: string) {
    const entry = await this.db.journalEntry.findFirst({
      where: { id, company_id: companyId },
    });
    if (!entry) throw new NotFoundException(`Journal entry ${id} not found`);
    if (entry.status === JournalEntryStatus.POSTED) {
      throw new BadRequestException('Journal entry is already posted');
    }
    if (entry.status === JournalEntryStatus.VOIDED) {
      throw new BadRequestException('Voided entries cannot be posted');
    }

    const before = { status: entry.status };
    const posted = await this.glEngine.postEntry(companyId, id, userId);

    await this.audit.log({
      company_id: companyId,
      user_id: userId,
      action: 'POST',
      entity_type: 'JournalEntry',
      entity_id: id,
      before,
      after: { status: JournalEntryStatus.POSTED, posted_at: posted.posted_at },
    });

    return posted;
  }

  async void(companyId: string, id: string, userId: string) {
    const entry = await this.db.journalEntry.findFirst({
      where: { id, company_id: companyId },
      include: { lines: true },
    });
    if (!entry) throw new NotFoundException(`Journal entry ${id} not found`);
    if (entry.status !== JournalEntryStatus.POSTED) {
      throw new BadRequestException('Only POSTED journal entries can be voided');
    }

    const today = new Date();
    // Check the reversal date period is not locked — also capture the period for the reversal
    const reversalPeriod = await this.glEngine.checkPeriodLock(companyId, today);

    const reversalNumber = await this.glEngine.getNextEntryNumber(companyId);

    const [, reversal] = await this.db.$transaction([
      // Mark original as VOIDED
      this.db.journalEntry.update({
        where: { id },
        data: {
          status: JournalEntryStatus.VOIDED,
          voided_at: today,
          voided_by: userId,
        },
      }),
      // Create reversing entry (flip debits/credits)
      this.db.journalEntry.create({
        data: {
          company_id: companyId,
          entry_number: reversalNumber,
          date: today,
          period_id: reversalPeriod?.id,
          status: JournalEntryStatus.POSTED,
          type: JournalEntryType.REVERSING,
          memo: `VOID: ${entry.memo ?? entry.entry_number}`,
          reverses_id: entry.id,
          is_reversing: true,
          created_by: userId,
          posted_at: today,
          posted_by: userId,
          lines: {
            create: entry.lines.map((line) => ({
              company_id: companyId,
              account_id: line.account_id,
              description: line.description,
              debit: line.credit,   // Flipped
              credit: line.debit,   // Flipped
              job_id: line.job_id,
              phase_id: line.phase_id,
              cost_code_id: line.cost_code_id,
            })),
          },
        },
        include: { lines: { include: { account: true } } },
      }),
    ]);

    await this.audit.log({
      company_id: companyId,
      user_id: userId,
      action: 'VOID',
      entity_type: 'JournalEntry',
      entity_id: id,
      before: { status: JournalEntryStatus.POSTED },
      after: {
        status: JournalEntryStatus.VOIDED,
        reversal_entry_id: reversal.id,
        reversal_number: reversal.entry_number,
      },
    });

    return reversal;
  }

  async remove(companyId: string, id: string, userId: string) {
    const entry = await this.db.journalEntry.findFirst({
      where: { id, company_id: companyId },
    });
    if (!entry) throw new NotFoundException(`Journal entry ${id} not found`);
    if (entry.status !== JournalEntryStatus.DRAFT) {
      throw new ForbiddenException('Only DRAFT journal entries can be deleted');
    }

    await this.db.journalEntryLine.deleteMany({ where: { journal_entry_id: id } });
    await this.db.journalEntry.delete({ where: { id } });

    await this.audit.log({
      company_id: companyId,
      user_id: userId,
      action: 'DELETE',
      entity_type: 'JournalEntry',
      entity_id: id,
      before: { entry_number: entry.entry_number, status: entry.status },
    });

    return { deleted: true, id };
  }
}
