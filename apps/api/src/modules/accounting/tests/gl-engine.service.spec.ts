import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException, ForbiddenException, NotFoundException } from '@nestjs/common';
import { JournalEntryStatus } from '@coap/database';
import { GlEngineService } from '../services/gl-engine.service';
import { PrismaService } from '../../../database/prisma.service';

const mockDb = {
  journalEntry: {
    findFirst: jest.fn(),
    update: jest.fn(),
    create: jest.fn(),
  },
  accountingPeriod: {
    findFirst: jest.fn(),
  },
  companySettings: {
    findUnique: jest.fn(),
  },
};

describe('GlEngineService', () => {
  let service: GlEngineService;

  beforeEach(async () => {
    jest.clearAllMocks();
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        GlEngineService,
        { provide: PrismaService, useValue: mockDb },
      ],
    }).compile();

    service = module.get<GlEngineService>(GlEngineService);
  });

  describe('postEntry', () => {
    const companyId = 'comp-1';
    const userId = 'user-1';
    const entryId = 'entry-1';

    const balancedEntry = {
      id: entryId,
      company_id: companyId,
      date: new Date('2025-06-15'),
      status: JournalEntryStatus.DRAFT,
      lines: [
        { debit: { toString: () => '1500.00' }, credit: { toString: () => '0' } },
        { debit: { toString: () => '0' }, credit: { toString: () => '1500.00' } },
      ],
    };

    it('✅ posts a balanced DRAFT entry successfully', async () => {
      mockDb.journalEntry.findFirst.mockResolvedValue(balancedEntry);
      mockDb.accountingPeriod.findFirst.mockResolvedValue({ is_closed: false });
      mockDb.journalEntry.update.mockResolvedValue({
        ...balancedEntry,
        status: JournalEntryStatus.POSTED,
        posted_at: new Date(),
        lines: [],
      });

      const result = await service.postEntry(companyId, entryId, userId);
      expect(result.status).toBe(JournalEntryStatus.POSTED);
    });

    it('❌ throws BadRequestException when entry not found', async () => {
      mockDb.journalEntry.findFirst.mockResolvedValue(null);
      await expect(service.postEntry(companyId, entryId, userId)).rejects.toThrow(
        BadRequestException,
      );
    });

    it('❌ throws ForbiddenException when period is locked', async () => {
      mockDb.journalEntry.findFirst.mockResolvedValue(balancedEntry);
      mockDb.accountingPeriod.findFirst.mockResolvedValue({
        is_closed: true,
        name: 'June 2025',
      });
      await expect(service.postEntry(companyId, entryId, userId)).rejects.toThrow(
        ForbiddenException,
      );
    });

    it('❌ rejects unbalanced entry with BadRequestException', async () => {
      const unbalanced = {
        ...balancedEntry,
        lines: [
          { debit: { toString: () => '1000' }, credit: { toString: () => '0' } },
          { debit: { toString: () => '0' }, credit: { toString: () => '500' } },
        ],
      };
      mockDb.journalEntry.findFirst.mockResolvedValue(unbalanced);
      mockDb.accountingPeriod.findFirst.mockResolvedValue({ is_closed: false });

      await expect(service.postEntry(companyId, entryId, userId)).rejects.toThrow(
        BadRequestException,
      );
    });
  });

  describe('getNextEntryNumber', () => {
    it('✅ returns JE-{year}-00001 when no prior entries', async () => {
      mockDb.companySettings.findUnique.mockResolvedValue({ journal_entry_prefix: 'JE' });
      mockDb.journalEntry.findFirst.mockResolvedValue(null);
      const year = new Date().getFullYear();
      const result = await service.getNextEntryNumber('comp-1');
      expect(result).toBe(`JE-${year}-00001`);
    });

    it('✅ increments from the last entry number', async () => {
      const year = new Date().getFullYear();
      mockDb.companySettings.findUnique.mockResolvedValue({ journal_entry_prefix: 'JE' });
      mockDb.journalEntry.findFirst.mockResolvedValue({ entry_number: `JE-${year}-00042` });
      const result = await service.getNextEntryNumber('comp-1');
      expect(result).toBe(`JE-${year}-00043`);
    });

    it('✅ uses custom prefix from company settings', async () => {
      mockDb.companySettings.findUnique.mockResolvedValue({ journal_entry_prefix: 'MJE' });
      mockDb.journalEntry.findFirst.mockResolvedValue(null);
      const year = new Date().getFullYear();
      const result = await service.getNextEntryNumber('comp-1');
      expect(result).toBe(`MJE-${year}-00001`);
    });

    it('✅ falls back to JE prefix if settings not found', async () => {
      mockDb.companySettings.findUnique.mockResolvedValue(null);
      mockDb.journalEntry.findFirst.mockResolvedValue(null);
      const year = new Date().getFullYear();
      const result = await service.getNextEntryNumber('comp-1');
      expect(result).toBe(`JE-${year}-00001`);
    });
  });

  describe('checkPeriodLock', () => {
    it('✅ passes when period is open', async () => {
      mockDb.accountingPeriod.findFirst.mockResolvedValue({ is_closed: false });
      await expect(service.checkPeriodLock('comp-1', new Date())).resolves.not.toThrow();
    });

    it('✅ passes when no period found (no period configured)', async () => {
      mockDb.accountingPeriod.findFirst.mockResolvedValue(null);
      await expect(service.checkPeriodLock('comp-1', new Date())).resolves.not.toThrow();
    });

    it('❌ throws ForbiddenException when period is locked', async () => {
      mockDb.accountingPeriod.findFirst.mockResolvedValue({
        is_closed: true,
        name: 'January 2025',
      });
      await expect(service.checkPeriodLock('comp-1', new Date('2025-01-15'))).rejects.toThrow(
        ForbiddenException,
      );
    });

    it('❌ error message includes period name', async () => {
      mockDb.accountingPeriod.findFirst.mockResolvedValue({
        is_closed: true,
        name: 'March 2025',
      });
      await expect(
        service.checkPeriodLock('comp-1', new Date('2025-03-10')),
      ).rejects.toThrow(/March 2025/);
    });
  });
});
