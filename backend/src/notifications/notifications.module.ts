import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { TypeOrmModule } from '@nestjs/typeorm';

import { AuthModule } from '../auth/auth.module';
import { User } from '../users/entities/user.entity';
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
        ]),
    ],
    controllers: [NotificationsController],
    providers: [
        NotificationsService,
        NotificationsGateway,
        NotificationsCleanupService,
        PushSubscriptionsService,
        PushNotificationsService,
    ],
    exports: [NotificationsService],
})
export class NotificationsModule {}
