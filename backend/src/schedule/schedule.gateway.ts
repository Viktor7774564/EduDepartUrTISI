import {
    ConnectedSocket,
    OnGatewayConnection,
    OnGatewayDisconnect,
    WebSocketGateway,
    WebSocketServer
} from "@nestjs/websockets";
import {Injectable, Logger} from "@nestjs/common";
import {Server, Socket} from "socket.io";
import {isAllowedCorsOrigin} from "../config/network";

export type ScheduleChangedPayload = {
    reason:
        | 'item-created'
        | 'item-updated'
        | 'item-disabled'
        | 'item-deleted'
        | 'preholiday-updated'
}

@Injectable()
@WebSocketGateway({
    namespace: `/schedules/live`,
    cors: {
        origin: (origin: string | undefined, callback: (err: Error | null, allow?: boolean) => void) => {
            if (!origin || isAllowedCorsOrigin(origin)) {
                callback(null, true);
                return;
            }
            callback(new Error(`Not allowed by CORS`), false);
        },
        credentials: true
    },
})
export class ScheduleGateway implements OnGatewayConnection, OnGatewayDisconnect {
    private readonly logger = new Logger(ScheduleGateway.name);
    @WebSocketServer()
    server!: Server;

    handleConnection(@ConnectedSocket() client: Socket): void {
        this.logger.debug(`Schedule a websocket connected ${client.id}`);
    }

    handleDisconnect(@ConnectedSocket() client: Socket): void {
        this.logger.debug(`Schedule a websocket disconnected ${client.id}`);
    }

    broadcastScheduleChanged(payload: ScheduleChangedPayload): void {
        this.server?.emit(`schedule:changed`, payload);
    }

    broadcastPreholidayDaysUpdated(preholidayDays: string[]): void {
        this.server?.emit('schedule:preholiday-days-updated', {
            preholidayDays,
        })
    }

}


