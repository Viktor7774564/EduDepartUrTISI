import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule, ConfigService } from '@nestjs/config';

import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { ScheduleModule } from './schedule/schedule.module';
import { AcademicModule } from './academic/academic.module';

@Module({
    imports: [
        ConfigModule.forRoot({
            isGlobal: true,
            envFilePath: '.env',
        }),

        TypeOrmModule.forRootAsync({
            imports: [ConfigModule],
            inject: [ConfigService],

            useFactory: (config: ConfigService) => ({
                type: 'postgres',

                host: config.getOrThrow<string>('DB_HOST'),
                port: parseInt(config.getOrThrow<string>('DB_PORT'), 10),

                username: config.getOrThrow<string>('DB_USERNAME'),
                password: config.getOrThrow<string>('DB_PASSWORD'),
                database: config.getOrThrow<string>('DB_DATABASE'),

                autoLoadEntities: true,

                synchronize: true,
            }),
        }),

        AuthModule,
        UsersModule,
        ScheduleModule,
        AcademicModule,
    ],
})
export class AppModule {}