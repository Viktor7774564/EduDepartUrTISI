import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { TypeOrmModule } from '@nestjs/typeorm';

import { AuthModule } from '../auth/auth.module';
import { User } from '../users/entities/user.entity';
import { ConsultationNotificationPreference } from './consultation-notification-preference.entity';
import { ConsultationNotificationPreferencesService } from './consultation-notification-preferences.service';
import { ConsultationNotificationsService } from './consultation-notifications.service';
import { Notification } from './notification.entity';
import { NotificationsController } from './notifications.controller';
import { NotificationsCleanupService } from './notifications-cleanup.service';
import { NotificationsGateway } from './notifications.gateway';
import { NotificationsService } from './notifications.service';
import { PushNotificationsService } from './push-notifications.service';
import { PushSubscription } from './push-subscription.entity';
import { PushSubscriptionsService } from './push-subscriptions.service';

@Module({
    imports: [
        AuthModule,
        JwtModule,
        TypeOrmModule.forFeature([
            Notification,
            User,
            PushSubscription,
            ConsultationNotificationPreference,
        ]),
    ],
    controllers: [NotificationsController],
    providers: [
        NotificationsService,
        NotificationsGateway,
        NotificationsCleanupService,
        PushSubscriptionsService,
        PushNotificationsService,
        ConsultationNotificationPreferencesService,
        ConsultationNotificationsService,
    ],
    exports: [NotificationsService, ConsultationNotificationsService],
})
export class NotificationsModule {}