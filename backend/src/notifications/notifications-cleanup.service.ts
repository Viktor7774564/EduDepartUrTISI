import { Injectable, Logger, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { Notification } from './notification.entity';

@Injectable()
export class NotificationsCleanupService implements OnModuleInit, OnModuleDestroy {
    private static readonly RETENTION_DAYS = 90;
    private static readonly CLEANUP_INTERVAL_MS = 24 * 60 * 60 * 1000;

    private readonly logger = new Logger(NotificationsCleanupService.name);
    private cleanupTimer: NodeJS.Timeout | null = null;

    constructor(
        @InjectRepository(Notification)
        private readonly notificationsRepository: Repository<Notification>,
    ) {}

    onModuleInit(): void {
        void this.cleanupExpiredNotifications();

        this.cleanupTimer = setInterval(() => {
            void this.cleanupExpiredNotifications();
        }, NotificationsCleanupService.CLEANUP_INTERVAL_MS);
    }

    onModuleDestroy(): void {
        if (this.cleanupTimer) {
            clearInterval(this.cleanupTimer);
            this.cleanupTimer = null;
        }
    }

    async cleanupExpiredNotifications(): Promise<number> {
        const cutoff = new Date();
        cutoff.setDate(cutoff.getDate() - NotificationsCleanupService.RETENTION_DAYS);

        const result = await this.notificationsRepository
            .createQueryBuilder()
            .delete()
            .where('"createdAt" < :cutoff', { cutoff })
            .execute();

        const deletedCount = result.affected ?? 0;

        if (deletedCount > 0) {
            this.logger.log(`Removed ${deletedCount} notifications older than ${NotificationsCleanupService.RETENTION_DAYS} days`);
        }

        return deletedCount;
    }
}
