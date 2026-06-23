import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { RefreshToken } from '../entities/refresh-token.entity';

type AccessTokenPayload = {
    sub: number;
    login: string;
    sid?: number;
};

@Injectable()
export class AccessTokenStrategy extends PassportStrategy(Strategy, 'jwt-access') {
    constructor(
        private readonly configService: ConfigService,

        @InjectRepository(RefreshToken)
        private readonly refreshTokenRepository: Repository<RefreshToken>,
    ) {
        super({
            jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
            ignoreExpiration: false,
            secretOrKey: configService.getOrThrow<string>('JWT_ACCESS_SECRET'),
        });
    }

    async validate(payload: AccessTokenPayload) {
        if (!payload.sid) {
            throw new UnauthorizedException(
                'Сессия недействительна. Войдите снова.',
            );
        }

        const session = await this.refreshTokenRepository.findOne({
            where: {
                id: payload.sid,
                userId: payload.sub,
                isActive: true,
            },
            relations: ['user'],
        });

        if (!session || !session.user.isActive) {
            throw new UnauthorizedException(
                'Сессия завершена. Войдите снова.',
            );
        }

        return payload;
    }
}
