import { Injectable } from '@nestjs/common';

import { SessionsGateway } from './sessions.gateway';
import { SessionsService } from './sessions.service';

@Injectable()
export class SessionsNotifierService {
    constructor(
        private readonly sessionsService: SessionsService,
        private readonly sessionsGateway: SessionsGateway,
    ) {}

    async notifySessionsSync(): Promise<void> {
        const sessions = await this.sessionsService.listActiveSessions();
        this.sessionsGateway.broadcastSessionsSync(sessions);
    }

    async notifySessionCreated(sessionId: number): Promise<void> {
        const session =
            await this.sessionsService.getSessionById(sessionId);

        if (!session) {
            return;
        }

        this.sessionsGateway.broadcastSessionCreated(session);
    }

    notifySessionRemoved(sessionId: number): void {
        this.sessionsGateway.broadcastSessionRemoved({ id: sessionId });
    }

    async notifyUserSessionsRemoved(userId: number): Promise<void> {
        const sessionIds =
            await this.sessionsService.getActiveSessionIdsByUserId(userId);

        for (const sessionId of sessionIds) {
            this.notifySessionRemoved(sessionId);
        }
    }
}
