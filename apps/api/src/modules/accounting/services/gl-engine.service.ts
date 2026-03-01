import {
  Injectable,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import Decimal from 'decimal.js';
import { PrismaService } from '../../../database/prisma.service';
import { CreateJournalEntryDto, JournalLineDto } from '../dto/create-journal-entry.dto';
import { JournalEntryType } from '@coap/database';

export interface GlLine {
  debit: string | number | Decimal;
  credit: string | number | Decimal;
}

/**
 * GlEngineService — the core double-entry posting machine.
 * All modules (AR, AP, Payroll, etc.) call this to post to the General Ledger.
 */
@Injectable()
export class GlEngineService {
  constructor(private readonly db: PrismaService) {}

  /**
   * Post an existing DRAFT journal entry.
   * Validates double-entry balance and period lock, then sets status to POSTED.
   */
  async postEntry(companyId: string, entryId: string, userId: string) {
    const entry = await this.db.journalEntry.findFirst({
      where: { id: entryId, company_id: companyId },
      include: { lines: true },
    });

    if (!entry) {
      throw new BadRequestException(`Journal entry ${entryId} not found`);
    }

    await this.checkPeriodLock(companyId, entry.date);
    this.validateDoubleEntry(entry.lines);

    const now = new Date();
    return this.db.journalEntry.update({
      where: { id: entryId },
      data: {
        status: 'POSTED',
        posted_at: now,
        posted_by: userId,
      },
      include: { lines: { include: { account: true } } },
    });
  }

  /**
   * Create a journal entry and immediately post it in one transaction.
   * Called by AR, AP, Payroll, and other modules.
   */
  async createAndPostEntry(
    companyId: string,
    data: CreateJournalEntryDto,
    userId: string,
  ) {
    const entryDate = new Date(data.date);
    await this.checkPeriodLock(companyId, entryDate);
    this.validateDoubleEntry(data.lines);

    const entryNumber = await this.getNextEntryNumber(companyId);
    const period = await this.findPeriodForDate(companyId, entryDate);
    const now = new Date();

    return this.db.journalEntry.create({
      data: {
        company_id: companyId,
        entry_number: entryNumber,
        date: entryDate,
        period_id: period?.id,
        status: 'POSTED',
        type: data.type ?? JournalEntryType.STANDARD,
        memo: data.memo,
        reference: data.reference,
        source_type: data.source_type,
        source_id: data.source_id,
        created_by: userId,
        posted_at: now,
        posted_by: userId,
        lines: {
          create: data.lines.map((line) => this.buildLineData(companyId, line)),
        },
      },
      include: { lines: { include: { account: true } } },
    });
  }

  /**
   * Validate that debits === credits and no negative amounts or zero totals.
   * Throws BadRequestException on any violation.
   */
  validateDoubleEntry(lines: GlLine[]): void {
    if (!lines || lines.length === 0) {
      throw new BadRequestException('Journal entry must have at least one line');
    }

    let totalDebits = new Decimal(0);
    let totalCredits = new Decimal(0);

    for (const line of lines) {
      const debit = new Decimal(line.debit.toString());
      const credit = new Decimal(line.credit.toString());

      if (debit.isNegative() || credit.isNegative()) {
        throw new BadRequestException('Journal entry line amounts cannot be negative');
      }

      totalDebits = totalDebits.plus(debit);
      totalCredits = totalCredits.plus(credit);
    }

    if (totalDebits.isZero() && totalCredits.isZero()) {
      throw new BadRequestException('Journal entry total cannot be zero');
    }

    if (!totalDebits.equals(totalCredits)) {
      throw new BadRequestException(
        `Journal entry is not balanced. Debits: ${totalDebits.toFixed(4)}, Credits: ${totalCredits.toFixed(4)}`,
      );
    }
  }

  /**
   * Check if the period containing the given date is locked.
   * Throws ForbiddenException if locked.
   */
  async checkPeriodLock(companyId: string, date: Date): Promise<void> {
    const period = await this.findPeriodForDate(companyId, date);
    if (period?.is_closed) {
      throw new ForbiddenException(`Period ${period.name} is locked.`);
    }
  }

  /**
   * Generate the next sequential journal entry number for the company.
   * Format: {prefix}-{YYYY}-{NNNNN}, e.g. JE-2025-00001
   */
  async getNextEntryNumber(companyId: string): Promise<string> {
    const settings = await this.db.companySettings.findUnique({
      where: { company_id: companyId },
      select: { journal_entry_prefix: true },
    });
    const prefix = settings?.journal_entry_prefix ?? 'JE';
    const year = new Date().getFullYear();

    const latest = await this.db.journalEntry.findFirst({
      where: {
        company_id: companyId,
        entry_number: { startsWith: `${prefix}-${year}-` },
      },
      orderBy: { entry_number: 'desc' },
      select: { entry_number: true },
    });

    const lastNum = latest
      ? parseInt(latest.entry_number.split('-').pop() ?? '0', 10)
      : 0;

    return `${prefix}-${year}-${String(lastNum + 1).padStart(5, '0')}`;
  }

  private async findPeriodForDate(companyId: string, date: Date) {
    return this.db.accountingPeriod.findFirst({
      where: {
        company_id: companyId,
        start_date: { lte: date },
        end_date: { gte: date },
      },
    });
  }

  private buildLineData(companyId: string, line: JournalLineDto) {
    return {
      company_id: companyId,
      account_id: line.account_id,
      description: line.description,
      debit: new Decimal(line.debit),
      credit: new Decimal(line.credit),
      job_id: line.job_id,
      phase_id: line.phase_id,
      cost_code_id: line.cost_code_id,
    };
  }
}
