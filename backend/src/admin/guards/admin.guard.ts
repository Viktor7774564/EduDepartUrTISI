import {
    CanActivate,
    ExecutionContext,
    ForbiddenException,
    Injectable,
    UnauthorizedException,
} from '@nestjs/common';

import { Request } from 'express';

import { UsersService } from '../../users/users.service';
import { RoleCode } from '../../users/entities/role.entity';

@Injectable()
export class AdminGuard implements CanActivate {
    constructor(
        private readonly usersService: UsersService,
    ) {}

    async canActivate(context: ExecutionContext): Promise<boolean> {
        const request = context
            .switchToHttp()
            .getRequest<Request & { user?: { sub?: number } }>();

        const userId = request.user?.sub;

        if (!userId) {
            throw new UnauthorizedException();
        }

        const user = await this.usersService.findByIdWithDetails(userId);

        if (user.role.code !== RoleCode.ADMIN) {
            throw new ForbiddenException(
                'Доступ только для администратора',
            );
        }

        return true;
    }
}
