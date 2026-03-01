import { BadRequestException } from '@nestjs/common';
import Decimal from 'decimal.js';
import { GlEngineService } from '../services/gl-engine.service';

describe('Double-Entry Validation', () => {
  let glEngine: GlEngineService;

  beforeEach(() => {
    // GlEngineService only needs PrismaService for DB ops; validateDoubleEntry is pure.
    glEngine = new GlEngineService(null as never);
  });

  describe('validateDoubleEntry', () => {
    it('✅ balanced entry posts successfully', () => {
      expect(() =>
        glEngine.validateDoubleEntry([
          { debit: '1500.00', credit: '0' },
          { debit: '0', credit: '1500.00' },
        ]),
      ).not.toThrow();
    });

    it('✅ multi-line balanced entry passes', () => {
      expect(() =>
        glEngine.validateDoubleEntry([
          { debit: '1000.00', credit: '0' },
          { debit: '500.00', credit: '0' },
          { debit: '0', credit: '750.00' },
          { debit: '0', credit: '750.00' },
        ]),
      ).not.toThrow();
    });

    it('✅ decimal precision — balanced at 4 decimal places', () => {
      expect(() =>
        glEngine.validateDoubleEntry([
          { debit: '1000.0001', credit: '0' },
          { debit: '0', credit: '1000.0001' },
        ]),
      ).not.toThrow();
    });

    it('❌ unbalanced entry rejects with clear error', () => {
      expect(() =>
        glEngine.validateDoubleEntry([
          { debit: '1500.00', credit: '0' },
          { debit: '0', credit: '1000.00' },
        ]),
      ).toThrow(BadRequestException);
    });

    it('❌ unbalanced entry error message includes amounts', () => {
      const fn = () =>
        glEngine.validateDoubleEntry([
          { debit: '300.00', credit: '0' },
          { debit: '0', credit: '200.00' },
        ]);
      expect(fn).toThrow(/Debits:.*Credits:/);
    });

    it('❌ entry with zero total rejects', () => {
      expect(() =>
        glEngine.validateDoubleEntry([
          { debit: '0', credit: '0' },
          { debit: '0', credit: '0' },
        ]),
      ).toThrow(BadRequestException);
    });

    it('❌ entry with negative debit rejects', () => {
      expect(() =>
        glEngine.validateDoubleEntry([
          { debit: '-100.00', credit: '0' },
          { debit: '0', credit: '-100.00' },
        ]),
      ).toThrow(BadRequestException);
    });

    it('❌ entry with negative credit rejects', () => {
      expect(() =>
        glEngine.validateDoubleEntry([
          { debit: '100.00', credit: '0' },
          { debit: '0', credit: '-100.00' },
        ]),
      ).toThrow(BadRequestException);
    });

    it('❌ empty lines array rejects', () => {
      expect(() => glEngine.validateDoubleEntry([])).toThrow(BadRequestException);
    });

    it('❌ null lines rejects', () => {
      expect(() => glEngine.validateDoubleEntry(null as never)).toThrow(BadRequestException);
    });

    it('✅ Decimal instances are accepted', () => {
      expect(() =>
        glEngine.validateDoubleEntry([
          { debit: new Decimal('2500.50'), credit: new Decimal(0) },
          { debit: new Decimal(0), credit: new Decimal('2500.50') },
        ]),
      ).not.toThrow();
    });
  });
});
