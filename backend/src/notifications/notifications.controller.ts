import {
    Body,
    Controller,
    Delete,
    Get,
    Param,
    ParseIntPipe,
    Patch,
    Post,
    Put,
    Query,
    Req,
    UseGuards,
} from '@nestjs/common';
import { Request } from 'express';

import { AccessTokenGuard } from '../auth/guards/access-token.guard';
import { ConsultationNotificationPreferencesService } from './consultation-notification-preferences.service';
import { UpdateConsultationNotificationPreferenceDto } from './dto/consultation-notification-preference.dto';
import { PushSubscriptionDto, UnsubscribePushDto } from './dto/push-subscription.dto';
import { Notification } from './notification.entity';
import { NotificationsService } from './notifications.service';
import { PushNotificationsService } from './push-notifications.service';
import { PushSubscriptionsService } from './push-subscriptions.service';

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
        private readonly pushNotificationsService: PushNotificationsService,
        private readonly pushSubscriptionsService: PushSubscriptionsService,
        private readonly consultationNotificationPreferencesService: ConsultationNotificationPreferencesService,
    ) {}

    @Get()
    list(@Req() request: AuthRequest): Promise<Notification[]> {
        return this.notificationsService.listForUser(this.getUserId(request));
    }

    @Get('consultation-preferences/teachers')
    listConsultationTeacherOptions() {
        return this.consultationNotificationPreferencesService.listTeacherOptions();
    }

    @Get('consultation-preferences')
    getConsultationPreferences(@Req() request: AuthRequest) {
        return this.consultationNotificationPreferencesService.getForUser(
            this.getUserId(request),
        );
    }

    @Put('consultation-preferences')
    updateConsultationPreferences(
        @Req() request: AuthRequest,
        @Body() dto: UpdateConsultationNotificationPreferenceDto,
    ) {
        return this.consultationNotificationPreferencesService.updateForUser(
            this.getUserId(request),
            dto,
        );
    }

    @Get('push/vapid-public-key')
    getVapidPublicKey(): { publicKey: string | null; enabled: boolean } {
        return {
            publicKey: this.pushNotificationsService.getPublicKey(),
            enabled: this.pushNotificationsService.isEnabled(),
        };
    }

    @Get('push/status')
    async getPushStatus(
        @Req() request: AuthRequest,
        @Query('endpoint') endpoint?: string,
    ): Promise<{ subscribed: boolean }> {
        if (!endpoint?.trim()) {
            return { subscribed: false };
        }

        const subscribed = await this.pushSubscriptionsService.isSubscribed(
            this.getUserId(request),
            endpoint.trim(),
        );

        return { subscribed };
    }

    @Post('push/subscribe')
    subscribe(
        @Req() request: AuthRequest,
        @Body() dto: PushSubscriptionDto,
    ): Promise<void> {
        return this.pushSubscriptionsService.subscribe(this.getUserId(request), dto);
    }

    @Delete('push/unsubscribe')
    unsubscribe(
        @Req() request: AuthRequest,
        @Body() dto: UnsubscribePushDto,
    ): Promise<void> {
        return this.pushSubscriptionsService.unsubscribe(this.getUserId(request), dto.endpoint);
    }

    @Patch('read-all')
    markAllAsRead(@Req() request: AuthRequest): Promise<void> {
        return this.notificationsService.markAllAsRead(this.getUserId(request));
    }

    @Patch(':id/read')
    markAsRead(
        @Req() request: AuthRequest,
        @Param('id', ParseIntPipe) id: number,
    ): Promise<void> {
        return this.notificationsService.markAsRead(this.getUserId(request), id);
    }

    private getUserId(request: AuthRequest): number {
        return Number(request.user.sub ?? request.user.id);
    }
}
