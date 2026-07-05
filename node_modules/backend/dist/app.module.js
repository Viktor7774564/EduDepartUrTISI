"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AppModule = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("typeorm");
const typeorm_2 = require("@nestjs/typeorm");
const config_1 = require("@nestjs/config");
const role_enum_migration_1 = require("./database/role-enum-migration");
const auth_module_1 = require("./auth/auth.module");
const users_module_1 = require("./users/users.module");
const schedule_module_1 = require("./schedule/schedule.module");
const academic_module_1 = require("./academic/academic.module");
const admin_module_1 = require("./admin/admin.module");
const sessions_module_1 = require("./sessions/sessions.module");
const notifications_module_1 = require("./notifications/notifications.module");
let AppModule = class AppModule {
};
exports.AppModule = AppModule;
exports.AppModule = AppModule = __decorate([
    (0, common_1.Module)({
        imports: [
            config_1.ConfigModule.forRoot({
                isGlobal: true,
                envFilePath: '.env',
            }),
            typeorm_2.TypeOrmModule.forRootAsync({
                imports: [config_1.ConfigModule],
                inject: [config_1.ConfigService],
                useFactory: (config) => ({
                    type: 'postgres',
                    host: config.getOrThrow('DB_HOST'),
                    port: parseInt(config.getOrThrow('DB_PORT'), 10),
                    username: config.getOrThrow('DB_USERNAME'),
                    password: config.getOrThrow('DB_PASSWORD'),
                    database: config.getOrThrow('DB_DATABASE'),
                    autoLoadEntities: true,
                    synchronize: false,
                }),
                dataSourceFactory: async (options) => {
                    if (!options) {
                        throw new Error('TypeORM data source options are not configured');
                    }
                    const dataSourceOptions = options;
                    await (0, role_enum_migration_1.migrateRoleEnumBeforeSync)(dataSourceOptions);
                    const dataSource = new typeorm_1.DataSource(dataSourceOptions);
                    return dataSource.initialize();
                },
            }),
            auth_module_1.AuthModule,
            users_module_1.UsersModule,
            schedule_module_1.ScheduleModule,
            academic_module_1.AcademicModule,
            admin_module_1.AdminModule,
            sessions_module_1.SessionsModule,
            notifications_module_1.NotificationsModule,
        ],
    })
], AppModule);
//# sourceMappingURL=app.module.js.map