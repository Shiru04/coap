import { Test, TestingModule } from '@nestjs/testing';
import {
  ForbiddenException,
  NotFoundException,
  ConflictException,
  BadRequestException,
} from '@nestjs/common';
import { PeriodsService } from '../services/periods.service';
import { FiscalYearsService } from '../services/fiscal-years.service';
import { AuditService } from '../services/audit.service';
import { GlEngineService } from '../services/gl-engine.service';
import { PrismaService } from '../../../database/prisma.service';

const mockDb = {
  accountingPeriod: {
    findFirst: jest.fn(),
    findMany: jest.fn(),
    update: jest.fn(),
  },
  fiscalYear: {
    findFirst: jest.fn(),
    create: jest.fn(),
    findMany: jest.fn(),
    update: jest.fn(),
  },
  auditLog: { create: jest.fn() },
};

const mockAudit = { log: jest.fn().mockResolvedValue(undefined) };

describe('Period Locking', () => {
  let periodsService: PeriodsService;
  let fiscalYearsService: FiscalYearsService;
  let glEngine: GlEngineService;

  beforeEach(async () => {
    jest.clearAllMocks();
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PeriodsService,
        FiscalYearsService,
        GlEngineService,
        { provide: PrismaService, useValue: mockDb },
        { provide: AuditService, useValue: mockAudit },
      ],
    }).compile();

    periodsService = module.get<PeriodsService>(PeriodsService);
    fiscalYearsService = module.get<FiscalYearsService>(FiscalYearsService);
    glEngine = module.get<GlEngineService>(GlEngineService);
  });

  describe('PeriodsService.lock', () => {
    it('✅ locks an open period', async () => {
      const period = { id: 'p-1', company_id: 'comp-1', is_closed: false, name: 'January 2025' };
      mockDb.accountingPeriod.findFirst.mockResolvedValue(period);
      mockDb.accountingPeriod.update.mockResolvedValue({ ...period, is_closed: true });

      const result = await periodsService.lock('comp-1', 'p-1', 'user-1', {});
      expect(result.is_closed).toBe(true);
    });

    it('❌ throws ConflictException if period already locked', async () => {
      mockDb.accountingPeriod.findFirst.mockResolvedValue({
        id: 'p-1',
        company_id: 'comp-1',
        is_closed: true,
        name: 'January 2025',
      });
      await expect(periodsService.lock('comp-1', 'p-1', 'user-1', {})).rejects.toThrow(
        ConflictException,
      );
    });

    it('❌ throws NotFoundException for unknown period', async () => {
      mockDb.accountingPeriod.findFirst.mockResolvedValue(null);
      await expect(periodsService.lock('comp-1', 'bad-id', 'user-1', {})).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('PeriodsService.unlock', () => {
    it('✅ unlocks a locked period in an open fiscal year', async () => {
      mockDb.accountingPeriod.findFirst.mockResolvedValue({
        id: 'p-1',
        company_id: 'comp-1',
        is_closed: true,
        name: 'January 2025',
        fiscal_year_id: 'fy-1',
      });
      mockDb.fiscalYear.findFirst.mockResolvedValue({ id: 'fy-1', is_closed: false, name: 'FY2025' });
      mockDb.accountingPeriod.update.mockResolvedValue({ is_closed: false });

      const result = await periodsService.unlock('comp-1', 'p-1', 'user-1', {});
      expect(result.is_closed).toBe(false);
    });

    it('❌ throws ForbiddenException when fiscal year is already closed', async () => {
      mockDb.accountingPeriod.findFirst.mockResolvedValue({
        id: 'p-1',
        company_id: 'comp-1',
        is_closed: true,
        name: 'January 2025',
        fiscal_year_id: 'fy-1',
      });
      mockDb.fiscalYear.findFirst.mockResolvedValue({ id: 'fy-1', is_closed: true, name: 'FY2025' });

      await expect(periodsService.unlock('comp-1', 'p-1', 'user-1', {})).rejects.toThrow(
        ForbiddenException,
      );
    });

    it('❌ throws ConflictException if period is not locked', async () => {
      mockDb.accountingPeriod.findFirst.mockResolvedValue({
        id: 'p-1',
        company_id: 'comp-1',
        is_closed: false,
        name: 'January 2025',
      });
      await expect(periodsService.unlock('comp-1', 'p-1', 'user-1', {})).rejects.toThrow(
        ConflictException,
      );
    });
  });

  describe('GL Engine period lock integration', () => {
    it('❌ posting to locked period throws ForbiddenException', async () => {
      mockDb.accountingPeriod.findFirst.mockResolvedValue({
        is_closed: true,
        name: 'February 2025',
      });
      await expect(
        glEngine.checkPeriodLock('comp-1', new Date('2025-02-15')),
      ).rejects.toThrow(ForbiddenException);
    });

    it('✅ posting to open period succeeds', async () => {
      mockDb.accountingPeriod.findFirst.mockResolvedValue({ is_closed: false });
      await expect(
        glEngine.checkPeriodLock('comp-1', new Date('2025-02-15')),
      ).resolves.not.toThrow();
    });
  });

  describe('FiscalYearsService.create — period generation', () => {
    it('✅ creates fiscal year starting January with correct 12 periods', async () => {
      mockDb.fiscalYear.findFirst.mockResolvedValue(null);
      const mockFy = {
        id: 'fy-1',
        name: 'FY2025',
        start_date: new Date('2025-01-01'),
        end_date: new Date('2025-12-31'),
        periods: Array.from({ length: 12 }, (_, i) => ({
          period_number: i + 1,
          name: new Date(2025, i, 1).toLocaleString('en-US', { month: 'long', year: 'numeric' }),
        })),
      };
      mockDb.fiscalYear.create.mockResolvedValue(mockFy);

      const result = await fiscalYearsService.create(
        'comp-1',
        { name: 'FY2025', start_date: '2025-01-01' },
        'user-1',
      );
      expect(result.periods).toHaveLength(12);
      expect(result.periods[0].period_number).toBe(1);
      expect(result.periods[11].period_number).toBe(12);
    });

    it('✅ creates fiscal year starting July with correct period names', async () => {
      mockDb.fiscalYear.findFirst.mockResolvedValue(null);
      const mockFy = {
        id: 'fy-1',
        name: 'FY2025',
        periods: [
          { period_number: 1, name: 'July 2025', start_date: new Date('2025-07-01') },
          { period_number: 12, name: 'June 2026', start_date: new Date('2026-06-01') },
        ],
      };
      mockDb.fiscalYear.create.mockResolvedValue(mockFy);

      const result = await fiscalYearsService.create(
        'comp-1',
        { name: 'FY2025', start_date: '2025-07-01' },
        'user-1',
      );
      expect(result.periods[0].name).toBe('July 2025');
      expect(result.periods[1].name).toBe('June 2026');
    });

    it('✅ close fiscal year locks all 12 periods', async () => {
      const closedPeriods = Array.from({ length: 12 }, (_, i) => ({
        id: `p-${i}`,
        period_number: i + 1,
        is_closed: true,
      }));
      mockDb.fiscalYear.findFirst.mockResolvedValue({
        id: 'fy-1',
        name: 'FY2025',
        is_closed: false,
        periods: closedPeriods,
      });
      mockDb.fiscalYear.update.mockResolvedValue({
        id: 'fy-1',
        is_closed: true,
        periods: closedPeriods,
      });

      const result = await fiscalYearsService.close('comp-1', 'fy-1', 'user-1');
      expect(result.is_closed).toBe(true);
    });

    it('❌ cannot close fiscal year with open periods', async () => {
      mockDb.fiscalYear.findFirst.mockResolvedValue({
        id: 'fy-1',
        name: 'FY2025',
        is_closed: false,
        periods: [
          { id: 'p-1', is_closed: true },
          { id: 'p-2', is_closed: false }, // still open
        ],
      });

      await expect(fiscalYearsService.close('comp-1', 'fy-1', 'user-1')).rejects.toThrow(
        BadRequestException,
      );
    });
  });
});
