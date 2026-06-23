"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.SeedService = void 0;
const common_1 = require("@nestjs/common");
const auth_service_1 = require("../auth/auth.service");
const users_service_1 = require("../users/users.service");
const typeorm_1 = require("typeorm");
let SeedService = class SeedService {
    authService;
    usersService;
    dataSource;
    constructor(authService, usersService, dataSource) {
        this.authService = authService;
        this.usersService = usersService;
        this.dataSource = dataSource;
    }
    async run() {
        console.log('🌱 Запуск Seeder...');
        const testUsers = [
            { login: 'admin', password: 'admin123', roleName: 'admin' },
            { login: 'student', password: '123456', roleName: 'student' },
            { login: 'teacher', password: '123456', roleName: 'teacher' },
            { login: 'edu_depart', password: '123456', roleName: 'education_department' },
        ];
        for (const u of testUsers) {
            try {
                const existing = await this.usersService.findByLogin(u.login);
                if (existing) {
                    console.log(`⏭️ ${u.login} уже существует`);
                    continue;
                }
                const result = await this.dataSource.query(`
          INSERT INTO users (login, password, "roleId", created_at, updated_at)
          SELECT $1, $2, id, NOW(), NOW()
          FROM roles 
          WHERE name = $3
          RETURNING id, login;
        `, [u.login, u.password, u.roleName]);
                if (result.length > 0) {
                    console.log(`✅ Создан: ${u.login} / ${u.password}`);
                }
            }
            catch (error) {
                console.error(`❌ Ошибка ${u.login}:`, error?.message || error);
            }
        }
        console.log('🌱 Seeding завершён!');
    }
};
exports.SeedService = SeedService;
exports.SeedService = SeedService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [auth_service_1.AuthService,
        users_service_1.UsersService,
        typeorm_1.DataSource])
], SeedService);
//# sourceMappingURL=seed.service.js.map