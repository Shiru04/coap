import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../../database/prisma.service';

export interface AuditLogData {
  company_id: string;
  user_id: string;
  action: string;
  entity_type: string;
  entity_id: string;
  before?: unknown;
  after?: unknown;
  /** If true, audit failure will propagate and abort the operation. Default: true for financial actions. */
  critical?: boolean;
}

/** Financial actions where audit trail is mandatory */
const CRITICAL_ACTIONS = ['POST', 'VOID', 'LOCK', 'UNLOCK', 'CLOSE', 'DELETE'];

@Injectable()
export class AuditService {
  private readonly logger = new Logger(AuditService.name);

  constructor(private readonly db: PrismaService) {}

  async log(data: AuditLogData): Promise<void> {
    const isCritical = data.critical ?? CRITICAL_ACTIONS.includes(data.action);

    try {
      await this.db.auditLog.create({
        data: {
          company_id: data.company_id,
          user_id: data.user_id,
          action: data.action,
          entity_type: data.entity_type,
          entity_id: data.entity_id,
          before: data.before ? (data.before as object) : undefined,
          after: data.after ? (data.after as object) : undefined,
        },
      });
    } catch (error) {
      this.logger.error(`Audit log failed: ${String(error)}`);
      if (isCritical) {
        throw error;
      }
    }
  }
}
