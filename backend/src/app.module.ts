import { Module } from '@nestjs/common';
import { DataSource, DataSourceOptions } from 'typeorm';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule, ConfigService } from '@nestjs/config';

import { migrateRoleEnumBeforeSync } from './database/role-enum-migration';

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

            dataSourceFactory: async (options) => {
                if (!options) {
                    throw new Error('TypeORM data source options are not configured');
                }

                const dataSourceOptions = options as DataSourceOptions;

                await migrateRoleEnumBeforeSync(dataSourceOptions);

                const dataSource = new DataSource(dataSourceOptions);

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