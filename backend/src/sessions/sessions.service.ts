import { Injectable } from '@nestjs/common';

import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { RefreshToken } from '../auth/entities/refresh-token.entity';
import { AdminSessionResponse } from './sessions.types';

@Injectable()
export class SessionsService {
    constructor(
        @InjectRepository(RefreshToken)
        private readonly refreshTokenRepository: Repository<RefreshToken>,
    ) {}

    async listActiveSessions(): Promise<AdminSessionResponse[]> {
        const sessions = await this.refreshTokenRepository.find({
            where: { isActive: true },
            relations: ['user', 'user.role'],
            order: { createdAt: 'DESC' },
        });

        return sessions.map((session) => this.mapSession(session));
    }

    async getSessionById(id: number): Promise<AdminSessionResponse | null> {
        const session = await this.refreshTokenRepository.findOne({
            where: { id, isActive: true },
            relations: ['user', 'user.role'],
        });

        if (!session) {
            return null;
        }

        return this.mapSession(session);
    }

    async getActiveSessionIdsByUserId(userId: number): Promise<number[]> {
        const sessions = await this.refreshTokenRepository.find({
            where: { userId, isActive: true },
            select: ['id'],
        });

        return sessions.map((session) => session.id);
    }

    private mapSession(session: RefreshToken): AdminSessionResponse {
        return {
            id: session.id,
            userId: session.userId,
            login: session.user.login,
            fullName: this.formatFullName(session.user),
            role: session.user.role.code,
            createdAt: session.createdAt,
        };
    }

    private formatFullName(user: {
        surname: string;
        name: string;
        patronymic: string;
    }): string {
        const patronymicInitial = user.patronymic
            ? ` ${user.patronymic.charAt(0)}.`
            : '';

        return `${user.surname} ${user.name.charAt(0)}.${patronymicInitial}`.trim();
    }
}
