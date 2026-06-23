import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule, ConfigService } from '@nestjs/config';

import { UsersModule } from '../users/users.module';
import { RefreshToken } from '../auth/entities/refresh-token.entity';

import { SessionsGateway } from './sessions.gateway';
import { SessionsService } from './sessions.service';
import { SessionsNotifierService } from './sessions-notifier.service';

@Module({
    imports: [
        ConfigModule,
        UsersModule,
        TypeOrmModule.forFeature([RefreshToken]),
        JwtModule.registerAsync({
            inject: [ConfigService],
            useFactory: (config: ConfigService) => ({
                secret: config.get<string>('JWT_ACCESS_SECRET'),
            }),
        }),
    ],
    providers: [
        SessionsGateway,
        SessionsService,
        SessionsNotifierService,
    ],
    exports: [SessionsService, SessionsNotifierService],
})
export class SessionsModule {}
