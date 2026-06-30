import {
    ConnectedSocket,
    OnGatewayConnection,
    OnGatewayDisconnect,
    WebSocketGateway,
    WebSocketServer,
} from '@nestjs/websockets';
import { Injectable, Logger } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { Server, Socket } from 'socket.io';

import { isAllowedCorsOrigin } from '../config/network';
import { Notification } from './notification.entity';

@Injectable()
@WebSocketGateway({
    namespace: '/notifications/live',
    cors: {
        origin: (origin, callback) => {
            if (isAllowedCorsOrigin(origin)) {
                callback(null, true);
                return;
            }

            callback(new Error('Not allowed by CORS'), false);
        },
        credentials: true,
    },
})
export class NotificationsGateway implements OnGatewayConnection, OnGatewayDisconnect {
    private readonly logger = new Logger(NotificationsGateway.name);

    @WebSocketServer()
    server!: Server;

    constructor(
        private readonly jwtService: JwtService,
        private readonly configService: ConfigService,
    ) {}

    async handleConnection(@ConnectedSocket() client: Socket): Promise<void> {
        const userId = await this.getUserId(client);

        if (!userId) {
            client.disconnect();
            return;
        }

        await client.join(this.getUserRoom(userId));
        this.logger.debug(`Notifications websocket connected ${client.id}`);
    }

    handleDisconnect(@ConnectedSocket() client: Socket): void {
        this.logger.debug(`Notifications websocket disconnected ${client.id}`);
    }

    sendToUser(userId: number, notification: Notification): void {
        this.server?.to(this.getUserRoom(userId)).emit('notification:created', notification);
    }

    private getUserRoom(userId: number): string {
        return `user:${userId}`;
    }

    private async getUserId(client: Socket): Promise<number | null> {
        try {
            const authToken = client.handshake.auth?.token;
            const headerToken = client.handshake.headers.authorization
                ?.replace(/^Bearer\s+/i, '');

            const token = typeof authToken === 'string' ? authToken : headerToken;

            if (!token) {
                return null;
            }

            const payload = await this.jwtService.verifyAsync<{ sub: number }>(token, {
                secret: this.configService.getOrThrow<string>('JWT_ACCESS_SECRET'),
            });

            return payload.sub;
        } catch {
            return null;
        }
    }
}