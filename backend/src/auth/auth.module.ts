import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule, ConfigService } from '@nestjs/config';

import { UsersModule } from '../users/users.module';
import { SessionsModule } from '../sessions/sessions.module';

import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';

import { RefreshToken } from './entities/refresh-token.entity';

import { AccessTokenGuard } from './guards/access-token.guard';
import { RefreshTokenGuard } from './guards/refresh-token.guard';
import { AccessTokenStrategy } from './strategies/access-token.strategy';
import { RefreshTokenStrategy } from './strategies/refresh-token.strategy';

@Module({
    imports: [
        ConfigModule,

        UsersModule,
        SessionsModule,

        PassportModule,

        TypeOrmModule.forFeature([
            RefreshToken,
        ]),

        JwtModule.registerAsync({
            inject: [ConfigService],
            useFactory: (config: ConfigService) => ({
                secret: config.get<string>('JWT_ACCESS_SECRET'),
                signOptions: {
                    expiresIn: '15m',
                },
            }),
        }),
    ],
    controllers: [AuthController],
    providers: [
        AuthService,
        AccessTokenStrategy,
        RefreshTokenStrategy,
        AccessTokenGuard,
        RefreshTokenGuard,
    ],
    exports: [AuthService, AccessTokenGuard, RefreshTokenGuard],
})
export class AuthModule {}