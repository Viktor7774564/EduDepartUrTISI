import {
    Controller,
    Get,
    Param,
    ParseIntPipe,
    Patch,
    Req,
    UseGuards,
} from '@nestjs/common';
import { Request } from 'express';

import { AccessTokenGuard } from '../auth/guards/access-token.guard';
import { NotificationsService } from './notifications.service';
import { Notification } from './notification.entity';

type AuthRequest = Request & {
    user: {
        sub?: number;
        id?: number;
    };
};

@Controller('notifications')
@UseGuards(AccessTokenGuard)
export class NotificationsController {
    constructor(
        private readonly notificationsService: NotificationsService,
    ) {}

    @Get()
    list(@Req() request: AuthRequest): Promise<Notification[]> {
        return this.notificationsService.listForUser(this.getUserId(request));
    }

    @Patch(':id/read')
    markAsRead(
        @Req() request: AuthRequest,
        @Param('id', ParseIntPipe) id: number,
    ): Promise<void> {
        return this.notificationsService.markAsRead(this.getUserId(request), id);
    }

    @Patch('read-all')
    markAllAsRead(@Req() request: AuthRequest): Promise<void> {
        return this.notificationsService.markAllAsRead(this.getUserId(request));
    }

    private getUserId(request: AuthRequest): number {
        return Number(request.user.sub ?? request.user.id);
    }
}