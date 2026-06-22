"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.UsersModule = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const user_entity_1 = require("./entities/user.entity");
const role_entity_1 = require("./entities/role.entity");
const refresh_token_entity_1 = require("./entities/refresh-token.entity");
const student_profile_entity_1 = require("./entities/student-profile.entity");
const teacher_profile_entity_1 = require("./entities/teacher-profile.entity");
const staff_profile_entity_1 = require("./entities/staff-profile.entity");
let UsersModule = class UsersModule {
};
exports.UsersModule = UsersModule;
exports.UsersModule = UsersModule = __decorate([
    (0, common_1.Module)({
        imports: [
            typeorm_1.TypeOrmModule.forFeature([
                user_entity_1.User,
                role_entity_1.Role,
                refresh_token_entity_1.RefreshToken,
                student_profile_entity_1.StudentProfile,
                teacher_profile_entity_1.TeacherProfile,
                staff_profile_entity_1.StaffProfile,
            ]),
        ],
        exports: [typeorm_1.TypeOrmModule],
    })
], UsersModule);
//# sourceMappingURL=users.module.js.map