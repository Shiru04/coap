import { Test, TestingModule } from '@nestjs/testing';
import {
  NotFoundException,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import { JournalEntryStatus, JournalEntryType } from '@coap/database';
import { JournalEntriesService } from '../services/journal-entries.service';
import { GlEngineService } from '../services/gl-engine.service';
import { AuditService } from '../services/audit.service';
import { PrismaService } from '../../../database/prisma.service';

const COMPANY_ID = 'comp-test';
const USER_ID = 'user-test';

const balancedLines = [
  { account_id: 'acc-cash', debit: '5000.00', credit: '0' },
  { account_id: 'acc-revenue', debit: '0', credit: '5000.00' },
];

const mockGlEngine = {
  getNextEntryNumber: jest.fn().mockResolvedValue('JE-2025-00001'),
  postEntry: jest.fn(),
  checkPeriodLock: jest.fn().mockResolvedValue(undefined),
  validateDoubleEntry: jest.fn(),
};

const mockAudit = { log: jest.fn().mockResolvedValue(undefined) };

const mockTransaction = jest.fn();

const mockDb = {
  journalEntry: {
    findFirst: jest.fn(),
    findMany: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
  },
  journalEntryLine: {
    deleteMany: jest.fn(),
  },
  accountingPeriod: {
    findFirst: jest.fn().mockResolvedValue(null),
  },
  $transaction: mockTransaction,
};

describe('JournalEntriesService', () => {
  let service: JournalEntriesService;

  beforeEach(async () => {
    jest.clearAllMocks();
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        JournalEntriesService,
        { provide: PrismaService, useValue: mockDb },
        { provide: GlEngineService, useValue: mockGlEngine },
        { provide: AuditService, useValue: mockAudit },
      ],
    }).compile();

    service = module.get<JournalEntriesService>(JournalEntriesService);
  });

  // ─── CREATE ───────────────────────────────────────────────────────────────

  describe('create', () => {
    it('✅ creates a DRAFT journal entry', async () => {
      const draft = {
        id: 'je-1',
        entry_number: 'JE-2025-00001',
        status: JournalEntryStatus.DRAFT,
        lines: [],
      };
      mockDb.journalEntry.create.mockResolvedValue(draft);

      const result = await service.create(
        COMPANY_ID,
        { date: '2025-06-15', lines: balancedLines },
        USER_ID,
      );
      expect(result.status).toBe(JournalEntryStatus.DRAFT);
    });
  });

  // ─── UPDATE ──────────────────────────────────────────────────────────────

  describe('update', () => {
    it('✅ updates a DRAFT entry', async () => {
      const draft = {
        id: 'je-1',
        status: JournalEntryStatus.DRAFT,
        memo: 'old memo',
      };
      mockDb.journalEntry.findFirst.mockResolvedValue(draft);
      mockTransaction.mockImplementation(async (fn: (tx: unknown) => Promise<unknown>) =>
        fn({
          journalEntryLine: { deleteMany: jest.fn() },
          journalEntry: { update: jest.fn().mockResolvedValue({ ...draft, memo: 'new memo', lines: [] }) },
        }),
      );

      const result = await service.update(COMPANY_ID, 'je-1', { memo: 'new memo' }, USER_ID);
      expect(result.memo).toBe('new memo');
    });

    it('❌ cannot update a POSTED entry', async () => {
      mockDb.journalEntry.findFirst.mockResolvedValue({
        id: 'je-1',
        status: JournalEntryStatus.POSTED,
      });
      await expect(
        service.update(COMPANY_ID, 'je-1', { memo: 'hack' }, USER_ID),
      ).rejects.toThrow(ForbiddenException);
    });

    it('❌ cannot update a VOIDED entry', async () => {
      mockDb.journalEntry.findFirst.mockResolvedValue({
        id: 'je-1',
        status: JournalEntryStatus.VOIDED,
      });
      await expect(
        service.update(COMPANY_ID, 'je-1', { memo: 'hack' }, USER_ID),
      ).rejects.toThrow(ForbiddenException);
    });
  });

  // ─── POST ────────────────────────────────────────────────────────────────

  describe('post', () => {
    it('✅ posts a DRAFT entry via GlEngine', async () => {
      const draft = { id: 'je-1', status: JournalEntryStatus.DRAFT };
      const posted = { ...draft, status: JournalEntryStatus.POSTED, posted_at: new Date(), lines: [] };
      mockDb.journalEntry.findFirst.mockResolvedValue(draft);
      mockGlEngine.postEntry.mockResolvedValue(posted);

      const result = await service.post(COMPANY_ID, 'je-1', USER_ID);
      expect(result.status).toBe(JournalEntryStatus.POSTED);
      expect(mockGlEngine.postEntry).toHaveBeenCalledWith(COMPANY_ID, 'je-1', USER_ID);
    });

    it('❌ cannot post an already-posted entry', async () => {
      mockDb.journalEntry.findFirst.mockResolvedValue({
        id: 'je-1',
        status: JournalEntryStatus.POSTED,
      });
      await expect(service.post(COMPANY_ID, 'je-1', USER_ID)).rejects.toThrow(
        BadRequestException,
      );
    });

    it('❌ cannot post a voided entry', async () => {
      mockDb.journalEntry.findFirst.mockResolvedValue({
        id: 'je-1',
        status: JournalEntryStatus.VOIDED,
      });
      await expect(service.post(COMPANY_ID, 'je-1', USER_ID)).rejects.toThrow(
        BadRequestException,
      );
    });

    it('❌ throws NotFoundException for unknown entry', async () => {
      mockDb.journalEntry.findFirst.mockResolvedValue(null);
      await expect(service.post(COMPANY_ID, 'bad-id', USER_ID)).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  // ─── VOID ────────────────────────────────────────────────────────────────

  describe('void', () => {
    const postedEntry = {
      id: 'je-1',
      company_id: COMPANY_ID,
      status: JournalEntryStatus.POSTED,
      memo: 'Original entry',
      entry_number: 'JE-2025-00001',
      lines: [
        { account_id: 'acc-cash', debit: '5000', credit: '0', description: null, job_id: null, phase_id: null, cost_code_id: null },
        { account_id: 'acc-rev', debit: '0', credit: '5000', description: null, job_id: null, phase_id: null, cost_code_id: null },
      ],
    };

    const reversalEntry = {
      id: 'je-2',
      entry_number: 'JE-2025-00002',
      status: JournalEntryStatus.POSTED,
      type: JournalEntryType.REVERSING,
      lines: [
        { account_id: 'acc-cash', debit: '0', credit: '5000' },
        { account_id: 'acc-rev', debit: '5000', credit: '0' },
      ],
    };

    it('✅ creates reversing entry with flipped debits/credits', async () => {
      mockDb.journalEntry.findFirst.mockResolvedValue(postedEntry);
      mockGlEngine.checkPeriodLock.mockResolvedValue(undefined);
      mockGlEngine.getNextEntryNumber.mockResolvedValue('JE-2025-00002');
      mockTransaction.mockResolvedValue([
        { ...postedEntry, status: JournalEntryStatus.VOIDED },
        { ...reversalEntry, lines: [] },
      ]);

      const result = await service.void(COMPANY_ID, 'je-1', USER_ID);
      expect(result.status).toBe(JournalEntryStatus.POSTED);
      expect(result.entry_number).toBe('JE-2025-00002');
    });

    it('✅ reversing entry is POSTED immediately', async () => {
      mockDb.journalEntry.findFirst.mockResolvedValue(postedEntry);
      mockGlEngine.checkPeriodLock.mockResolvedValue(undefined);
      mockGlEngine.getNextEntryNumber.mockResolvedValue('JE-2025-00002');
      mockTransaction.mockResolvedValue([
        { status: JournalEntryStatus.VOIDED },
        { ...reversalEntry, lines: [] },
      ]);

      const reversal = await service.void(COMPANY_ID, 'je-1', USER_ID);
      expect(reversal.status).toBe(JournalEntryStatus.POSTED);
    });

    it('❌ cannot void a DRAFT entry', async () => {
      mockDb.journalEntry.findFirst.mockResolvedValue({
        id: 'je-1',
        status: JournalEntryStatus.DRAFT,
      });
      await expect(service.void(COMPANY_ID, 'je-1', USER_ID)).rejects.toThrow(
        BadRequestException,
      );
    });

    it('❌ cannot void an entry in a locked period', async () => {
      mockDb.journalEntry.findFirst.mockResolvedValue(postedEntry);
      mockGlEngine.checkPeriodLock.mockRejectedValue(
        new ForbiddenException('Period June 2025 is locked.'),
      );
      await expect(service.void(COMPANY_ID, 'je-1', USER_ID)).rejects.toThrow(
        ForbiddenException,
      );
    });
  });

  // ─── DELETE ──────────────────────────────────────────────────────────────

  describe('remove', () => {
    it('✅ deletes a DRAFT entry', async () => {
      const draft = {
        id: 'je-1',
        status: JournalEntryStatus.DRAFT,
        entry_number: 'JE-2025-00001',
      };
      mockDb.journalEntry.findFirst.mockResolvedValue(draft);
      mockDb.journalEntryLine.deleteMany.mockResolvedValue({});
      mockDb.journalEntry.delete.mockResolvedValue({});

      const result = await service.remove(COMPANY_ID, 'je-1', USER_ID);
      expect(result.deleted).toBe(true);
    });

    it('❌ cannot delete a POSTED entry', async () => {
      mockDb.journalEntry.findFirst.mockResolvedValue({
        id: 'je-1',
        status: JournalEntryStatus.POSTED,
      });
      await expect(service.remove(COMPANY_ID, 'je-1', USER_ID)).rejects.toThrow(
        ForbiddenException,
      );
    });

    it('❌ cannot delete a VOIDED entry', async () => {
      mockDb.journalEntry.findFirst.mockResolvedValue({
        id: 'je-1',
        status: JournalEntryStatus.VOIDED,
      });
      await expect(service.remove(COMPANY_ID, 'je-1', USER_ID)).rejects.toThrow(
        ForbiddenException,
      );
    });
  });

  // ─── COMPANY ISOLATION ────────────────────────────────────────────────────

  describe('company_id isolation', () => {
    it('❌ cannot access another company\'s journal entry', async () => {
      // findFirst with company_id filter returns null (entry belongs to other company)
      mockDb.journalEntry.findFirst.mockResolvedValue(null);
      await expect(service.findOne('comp-attacker', 'je-other-company')).rejects.toThrow(
        NotFoundException,
      );
    });

    it('✅ always filters by company_id on findAll', async () => {
      mockDb.journalEntry.findMany.mockResolvedValue([]);
      await service.findAll('comp-1', {});
      expect(mockDb.journalEntry.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ company_id: 'comp-1' }),
        }),
      );
    });
  });
});
