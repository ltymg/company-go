import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';

@Injectable()
export class SuperAdminGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const req = context.switchToHttp().getRequest();
    const user = req.user;

    // 仅允许 role=ADMIN 且 isSuperAdmin=true 的用户
    if (!user || user.role !== 'ADMIN' || user.isSuperAdmin !== true) {
      throw new ForbiddenException('Super admin only');
    }

    return true;
  }
}
