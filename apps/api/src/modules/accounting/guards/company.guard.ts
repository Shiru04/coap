import {
  CanActivate,
  ExecutionContext,
  Injectable,
  BadRequestException,
} from '@nestjs/common';

/**
 * CompanyGuard — ensures every request carries a valid company_id.
 * Works in tandem with ClerkAuthGuard (which sets request.companyId).
 * Run AFTER ClerkAuthGuard in the guard chain.
 */
@Injectable()
export class CompanyGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest<Record<string, unknown>>();
    const companyId = request['companyId'] as string | undefined;

    if (!companyId || typeof companyId !== 'string' || companyId.trim() === '') {
      throw new BadRequestException('company_id is required');
    }

    return true;
  }
}
