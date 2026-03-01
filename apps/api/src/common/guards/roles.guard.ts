import {
  CanActivate,
  ExecutionContext,
  Injectable,
  ForbiddenException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { PrismaService } from '../../database/prisma.service';
import { ROLES_KEY } from '../decorators/roles.decorator';

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly db: PrismaService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const requiredRoles = this.reflector.getAllAndOverride<string[]>(ROLES_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (!requiredRoles || requiredRoles.length === 0) {
      return true;
    }

    const request = context.switchToHttp().getRequest<Record<string, unknown>>();
    const userId = request['userId'] as string;
    const companyId = request['companyId'] as string;

    if (!userId || !companyId) {
      throw new ForbiddenException('Missing authentication context');
    }

    const user = await this.db.user.findFirst({
      where: { id: userId, company_id: companyId },
      select: { role: true },
    });

    if (!user || !requiredRoles.includes(user.role)) {
      throw new ForbiddenException(
        'Insufficient permissions. Required role: ' + requiredRoles.join(' or '),
      );
    }

    return true;
  }
}
