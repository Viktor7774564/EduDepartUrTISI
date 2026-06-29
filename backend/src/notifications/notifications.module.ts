import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { TypeOrmModule } from '@nestjs/typeorm';

import { User } from '../users/entities/user.entity';
import { Notification } from './notification.entity';
import { NotificationsController } from './notifications.controller';
import { NotificationsCleanupService } from './notifications-cleanup.service';
import { NotificationsGateway } from './notifications.gateway';
import { NotificationsService } from './notifications.service';

@Module({
    imports: [
        JwtModule,
        TypeOrmModule.forFeature([
            Notification,
            User,
        ]),
    ],
    controllers: [NotificationsController],
    providers: [NotificationsService, NotificationsGateway, NotificationsCleanupService],
    exports: [NotificationsService],
})
export class NotificationsModule {}