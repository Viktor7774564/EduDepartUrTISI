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

import { UsersService } from '../users/users.service';
import { RoleCode } from '../users/entities/role.entity';
import { isLocalNetworkOrigin } from '../config/network';
import { SessionsService } from './sessions.service';
import {
    AdminSessionResponse,
    SessionRemovedPayload,
} from './sessions.types';

@Injectable()
@WebSocketGateway({
    namespace: '/admin/sessions',
    cors: {
        origin: (origin, callback) => {
            if (isLocalNetworkOrigin(origin)) {
                callback(null, true);
                return;
            }

            callback(new Error('Not allowed by CORS'), false);
        },
        credentials: true,
    },
})
export class SessionsGateway
    implements OnGatewayConnection, OnGatewayDisconnect
{
    private readonly logger = new Logger(SessionsGateway.name);

    @WebSocketServer()
    server!: Server;

    constructor(
        private readonly jwtService: JwtService,
        private readonly configService: ConfigService,
        private readonly usersService: UsersService,
        private readonly sessionsService: SessionsService,
    ) {}

    async handleConnection(@ConnectedSocket() client: Socket): Promise<void> {
        const isAdmin = await this.authenticateAdmin(client);

        if (!isAdmin) {
            this.logger.warn(`Rejected websocket connection ${client.id}`);
            client.disconnect();
            return;
        }

        const sessions = await this.sessionsService.listActiveSessions();
        client.emit('sessions:sync', sessions);
    }

    handleDisconnect(@ConnectedSocket() client: Socket): void {
        this.logger.debug(`Websocket disconnected ${client.id}`);
    }

    broadcastSessionsSync(sessions: AdminSessionResponse[]): void {
        this.server?.emit('sessions:sync', sessions);
    }

    broadcastSessionCreated(session: AdminSessionResponse): void {
        this.server?.emit('session:created', session);
    }

    broadcastSessionRemoved(payload: SessionRemovedPayload): void {
        this.server?.emit('session:removed', payload);
    }

    private async authenticateAdmin(client: Socket): Promise<boolean> {
        try {
            const authToken = client.handshake.auth?.token;
            const headerToken = client.handshake.headers.authorization
                ?.replace(/^Bearer\s+/i, '');

            const token = typeof authToken === 'string'
                ? authToken
                : headerToken;

            if (!token) {
                return false;
            }

            const payload = await this.jwtService.verifyAsync<{
                sub: number;
                sid?: number;
            }>(token, {
                secret: this.configService.getOrThrow<string>(
                    'JWT_ACCESS_SECRET',
                ),
            });

            const user =
                await this.usersService.findByIdWithDetails(payload.sub);

            return user.role.code === RoleCode.ADMIN && user.isActive;
        } catch {
            return false;
        }
    }
}
