import {
  Injectable,
  NotFoundException,
  ConflictException,
  BadRequestException,
} from '@nestjs/common';
import Decimal from 'decimal.js';
import { PrismaService } from '../../../database/prisma.service';
import { AuditService } from './audit.service';
import { CreateAccountDto } from '../dto/create-account.dto';
import { UpdateAccountDto } from '../dto/update-account.dto';
import { QueryAccountsDto } from '../dto/query-accounts.dto';

@Injectable()
export class AccountsService {
  constructor(
    private readonly db: PrismaService,
    private readonly audit: AuditService,
  ) {}

  async findAll(companyId: string, query: QueryAccountsDto) {
    return this.db.account.findMany({
      where: {
        company_id: companyId,
        ...(query.type !== undefined ? { type: query.type } : {}),
        ...(query.is_active !== undefined ? { is_active: query.is_active } : {}),
        ...(query.root_only ? { parent_id: null } : {}),
        ...(query.search
          ? {
              OR: [
                { name: { contains: query.search, mode: 'insensitive' } },
                { code: { contains: query.search } },
              ],
            }
          : {}),
      },
      orderBy: { code: 'asc' },
      include: {
        children: {
          where: { is_active: true },
          orderBy: { code: 'asc' },
        },
      },
    });
  }

  async findOne(companyId: string, id: string) {
    const account = await this.db.account.findFirst({
      where: { id, company_id: companyId },
      include: {
        parent: { select: { id: true, code: true, name: true } },
        children: { orderBy: { code: 'asc' } },
      },
    });
    if (!account) throw new NotFoundException(`Account ${id} not found`);

    // Compute running balance from journal lines
    const lines = await this.db.journalEntryLine.findMany({
      where: {
        account_id: id,
        company_id: companyId,
        journal_entry: { status: 'POSTED' },
      },
      select: { debit: true, credit: true },
    });

    const balance = lines.reduce((acc, line) => {
      return acc.plus(new Decimal(line.debit.toString())).minus(new Decimal(line.credit.toString()));
    }, new Decimal(0));

    return { ...account, balance: balance.toFixed(2) };
  }

  async create(companyId: string, dto: CreateAccountDto, userId: string) {
    const existing = await this.db.account.findFirst({
      where: { company_id: companyId, code: dto.code },
    });
    if (existing) {
      throw new ConflictException(`Account with code ${dto.code} already exists`);
    }

    if (dto.parent_id) {
      const parent = await this.db.account.findFirst({
        where: { id: dto.parent_id, company_id: companyId },
      });
      if (!parent) throw new NotFoundException(`Parent account ${dto.parent_id} not found`);
    }

    const account = await this.db.account.create({
      data: {
        company_id: companyId,
        code: dto.code,
        name: dto.name,
        type: dto.type,
        sub_type: dto.sub_type,
        parent_id: dto.parent_id,
        description: dto.description,
        is_active: true,
      },
    });

    await this.audit.log({
      company_id: companyId,
      user_id: userId,
      action: 'CREATE',
      entity_type: 'Account',
      entity_id: account.id,
      after: account,
    });

    return account;
  }

  async update(companyId: string, id: string, dto: UpdateAccountDto, userId: string) {
    const account = await this.db.account.findFirst({
      where: { id, company_id: companyId },
    });
    if (!account) throw new NotFoundException(`Account ${id} not found`);

    if (account.is_system) {
      throw new BadRequestException('System accounts cannot be modified');
    }

    const before = { ...account };
    const updated = await this.db.account.update({
      where: { id },
      data: {
        name: dto.name,
        sub_type: dto.sub_type,
        description: dto.description,
        is_active: dto.is_active,
      },
    });

    await this.audit.log({
      company_id: companyId,
      user_id: userId,
      action: 'UPDATE',
      entity_type: 'Account',
      entity_id: id,
      before,
      after: updated,
    });

    return updated;
  }

  async deactivate(companyId: string, id: string, userId: string) {
    const account = await this.db.account.findFirst({
      where: { id, company_id: companyId },
    });
    if (!account) throw new NotFoundException(`Account ${id} not found`);
    if (account.is_system) {
      throw new BadRequestException('System accounts cannot be deactivated');
    }

    // Hard delete only if no journal lines reference this account
    const lineCount = await this.db.journalEntryLine.count({
      where: { account_id: id, company_id: companyId },
    });

    if (lineCount > 0) {
      // Soft deactivate
      const before = { ...account };
      const updated = await this.db.account.update({
        where: { id },
        data: { is_active: false },
      });
      await this.audit.log({
        company_id: companyId,
        user_id: userId,
        action: 'DEACTIVATE',
        entity_type: 'Account',
        entity_id: id,
        before,
        after: updated,
      });
      return updated;
    }

    // No journal lines — safe to hard delete
    await this.db.account.delete({ where: { id } });
    await this.audit.log({
      company_id: companyId,
      user_id: userId,
      action: 'DELETE',
      entity_type: 'Account',
      entity_id: id,
      before: account,
    });
    return { deleted: true, id };
  }
}
