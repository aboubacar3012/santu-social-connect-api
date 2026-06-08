import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import type { Request } from 'express';

import { UserRole, type User } from '../generated/prisma/client';

type AuthenticatedRequest = Request & {
  user?: User | { id: string; phoneE164?: string | null };
};

@Injectable()
export class AdminGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const req = context.switchToHttp().getRequest<AuthenticatedRequest>();
    const user = req.user;

    const userId =
      user && typeof user === 'object' && 'id' in user ? user.id : undefined;
    if (!userId) {
      throw new UnauthorizedException();
    }

    const role =
      user && typeof user === 'object' && 'role' in user
        ? user.role
        : undefined;
    if (role !== UserRole.admin) {
      throw new ForbiddenException('Accès réservé aux administrateurs');
    }

    return true;
  }
}
