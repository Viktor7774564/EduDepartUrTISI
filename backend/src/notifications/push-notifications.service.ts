import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as webpush from 'web-push';

import { Notification } from './notification.entity';
import { PushSubscription } from './push-subscription.entity';
import { PushSubscriptionsService } from './push-subscriptions.service';

@Injectable()
export class PushNotificationsService implements OnModuleInit {
    private readonly logger = new Logger(PushNotificationsService.name);
    private enabled = false;

    constructor(
        private readonly configService: ConfigService,
        private readonly pushSubscriptionsService: PushSubscriptionsService,
    ) {}

    onModuleInit(): void {
        const publicKey = this.configService.get<string>('VAPID_PUBLIC_KEY');
        const privateKey = this.configService.get<string>('VAPID_PRIVATE_KEY');
        const subject = this.configService.get<string>('VAPID_SUBJECT') ?? 'mailto:admin@urtisi.ru';

        if (!publicKey || !privateKey) {
            this.logger.warn('VAPID keys are not configured. Push notifications are disabled.');
            return;
        }

        webpush.setVapidDetails(subject, publicKey, privateKey);
        this.enabled = true;
    }

    getPublicKey(): string | null {
        return this.configService.get<string>('VAPID_PUBLIC_KEY') ?? null;
    }

    isEnabled(): boolean {
        return this.enabled;
    }

    async sendToUser(userId: number, notification: Notification): Promise<void> {
        if (!this.enabled) {
            return;
        }

        const subscriptions = await this.pushSubscriptionsService.findByUserId(userId);

        if (subscriptions.length === 0) {
            return;
        }

        const payload = JSON.stringify({
            title: notification.title,
            body: notification.message,
            data: {
                notificationId: notification.id,
                ...(notification.payload ?? {}),
                url: `/notifications?id=${notification.id}`,
            },
        });

        await Promise.all(
            subscriptions.map((subscription) => this.sendToSubscription(subscription, payload)),
        );
    }

    private async sendToSubscription(
        subscription: PushSubscription,
        payload: string,
    ): Promise<void> {
        try {
            await webpush.sendNotification(
                {
                    endpoint: subscription.endpoint,
                    keys: {
                        p256dh: subscription.p256dh,
                        auth: subscription.auth,
                    },
                },
                payload,
            );
        } catch (error: unknown) {
            const statusCode = this.getStatusCode(error);

            if (statusCode === 404 || statusCode === 410) {
                await this.pushSubscriptionsService.removeById(subscription.id);
                return;
            }

            this.logger.warn(
                `Failed to send push notification to subscription ${subscription.id}: ${this.getErrorMessage(error)}`,
            );
        }
    }

    private getStatusCode(error: unknown): number | null {
        if (
            typeof error === 'object'
            && error !== null
            && 'statusCode' in error
            && typeof (error as { statusCode?: unknown }).statusCode === 'number'
        ) {
            return (error as { statusCode: number }).statusCode;
        }

        return null;
    }

    private getErrorMessage(error: unknown): string {
        if (error instanceof Error) {
            return error.message;
        }

        return 'Unknown error';
    }
}
