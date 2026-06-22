import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule, ConfigService } from '@nestjs/config';

import { UsersModule } from './users/users.module';
import { ScheduleModule } from './schedule/schedule.module';
import { AcademicModule } from './academic/academic.module';

@Module({
    imports: [
        ConfigModule.forRoot({ isGlobal: true }),

        TypeOrmModule.forRootAsync({
            imports: [ConfigModule],
            inject: [ConfigService],

            useFactory: (config: ConfigService) => ({
                type: 'postgres',
                host: config.getOrThrow<string>('DB_HOST'),
                port: parseInt(config.getOrThrow<string>('DB_PORT')),
                username: config.getOrThrow<string>('DB_USERNAME'),
                password: config.getOrThrow<string>('DB_PASSWORD'),
                database: config.getOrThrow<string>('DB_DATABASE'),

                autoLoadEntities: true,
                synchronize: true,
            }),
        }),

        UsersModule,
        ScheduleModule,
        AcademicModule,
    ],
})
export class AppModule {}