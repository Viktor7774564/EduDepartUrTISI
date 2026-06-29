import { Request } from 'express';
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
export declare class NotificationsController {
    private readonly notificationsService;
    private readonly pushNotificationsService;
    private readonly pushSubscriptionsService;
    constructor(notificationsService: NotificationsService, pushNotificationsService: PushNotificationsService, pushSubscriptionsService: PushSubscriptionsService);
    list(request: AuthRequest): Promise<Notification[]>;
    getVapidPublicKey(): {
        publicKey: string | null;
        enabled: boolean;
    };
    subscribe(request: AuthRequest, dto: PushSubscriptionDto): Promise<void>;
    unsubscribe(request: AuthRequest, dto: UnsubscribePushDto): Promise<void>;
    markAsRead(request: AuthRequest, id: number): Promise<void>;
    markAllAsRead(request: AuthRequest): Promise<void>;
    private getUserId;
}
export {};
