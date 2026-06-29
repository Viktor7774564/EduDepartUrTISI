import { Request } from 'express';
import { NotificationsService } from './notifications.service';
import { Notification } from './notification.entity';
type AuthRequest = Request & {
    user: {
        sub?: number;
        id?: number;
    };
};
export declare class NotificationsController {
    private readonly notificationsService;
    constructor(notificationsService: NotificationsService);
    list(request: AuthRequest): Promise<Notification[]>;
    markAsRead(request: AuthRequest, id: number): Promise<void>;
    markAllAsRead(request: AuthRequest): Promise<void>;
    private getUserId;
}
export {};
