import { Module } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule, ConfigService } from '@nestjs/config';

import { buildDatabaseConnectionOptions } from './database/typeorm.config';

import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { ScheduleModule } from './schedule/schedule.module';
import { AcademicModule } from './academic/academic.module';
import { AdminModule } from './admin/admin.module';
import { SessionsModule } from './sessions/sessions.module';
import { NotificationsModule} from './notifications/notifications.module';

@Module({
    imports: [
        ConfigModule.forRoot({
            isGlobal: true,
            envFilePath: ['.env'],
        }),

        TypeOrmModule.forRootAsync({
            imports: [ConfigModule],
            inject: [ConfigService],

            useFactory: (config: ConfigService) => ({
                ...buildDatabaseConnectionOptions({
                    DB_HOST: config.getOrThrow<string>('DB_HOST'),
                    DB_PORT: config.getOrThrow<string>('DB_PORT'),
                    DB_USERNAME: config.getOrThrow<string>('DB_USERNAME'),
                    DB_PASSWORD: config.getOrThrow<string>('DB_PASSWORD'),
                    DB_DATABASE: config.getOrThrow<string>('DB_DATABASE'),
                }),
                autoLoadEntities: true,
            }),

            dataSourceFactory: async (options) => {
                if (!options) {
                    throw new Error('TypeORM data source options are not configured');
                }

                const dataSource = new DataSource(options);

                return dataSource.initialize();
            },
        }),

        AuthModule,
        UsersModule,
        ScheduleModule,
        AcademicModule,
        AdminModule,
        SessionsModule,
        NotificationsModule,
    ],
})
export class AppModule {}