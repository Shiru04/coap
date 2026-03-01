import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';

/**
 * ClerkAuthGuard — validates Clerk JWT and attaches companyId + userId to request.
 * In development, accepts x-company-id and x-user-id headers as fallback.
 */
@Injectable()
export class ClerkAuthGuard implements CanActivate {
  constructor(private readonly jwtService: JwtService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<Record<string, unknown>>();
    const headers = request['headers'] as Record<string, string>;

    // Development shortcut: accept direct headers
    if (process.env.NODE_ENV !== 'production') {
      const companyId = headers['x-company-id'] ?? process.env.DEFAULT_COMPANY_ID;
      const userId = headers['x-user-id'] ?? 'dev-user';
      if (companyId) {
        request['companyId'] = companyId;
        request['userId'] = userId;
        return true;
      }
    }

    // Production: validate Clerk JWT
    const authorization = headers['authorization'];
    if (!authorization?.startsWith('Bearer ')) {
      throw new UnauthorizedException('Missing authorization token');
    }

    const token = authorization.slice(7);
    try {
      const payload = this.jwtService.verify<{
        sub: string;
        company_id?: string;
        org_id?: string;
      }>(token, { secret: process.env.JWT_SECRET });

      request['userId'] = payload.sub;
      request['companyId'] =
        payload.company_id ?? payload.org_id ?? process.env.DEFAULT_COMPANY_ID;
      return true;
    } catch {
      throw new UnauthorizedException('Invalid token');
    }
  }
}
