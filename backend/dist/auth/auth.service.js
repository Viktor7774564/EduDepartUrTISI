"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuthService = void 0;
const common_1 = require("@nestjs/common");
const jwt_1 = require("@nestjs/jwt");
const config_1 = require("@nestjs/config");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const bcrypt = __importStar(require("bcrypt"));
const users_service_1 = require("../users/users.service");
const refresh_token_entity_1 = require("./entities/refresh-token.entity");
const auth_user_mapper_1 = require("./auth-user.mapper");
const sessions_notifier_service_1 = require("../sessions/sessions-notifier.service");
let AuthService = class AuthService {
    usersService;
    jwtService;
    configService;
    refreshTokenRepository;
    sessionsNotifier;
    constructor(usersService, jwtService, configService, refreshTokenRepository, sessionsNotifier) {
        this.usersService = usersService;
        this.jwtService = jwtService;
        this.configService = configService;
        this.refreshTokenRepository = refreshTokenRepository;
        this.sessionsNotifier = sessionsNotifier;
    }
    async register(dto) {
        const existingUser = await this.usersService.findByLogin(dto.login);
        if (existingUser) {
            throw new common_1.UnauthorizedException('Пользователь уже существует');
        }
        const passwordHash = await bcrypt.hash(dto.password, 10);
        const user = await this.usersService.create({
            login: dto.login,
            passwordHash: passwordHash,
        });
        const userWithDetails = await this.usersService.findByIdWithDetails(user.id);
        return this.generateTokens(userWithDetails);
    }
    async login(dto) {
        const user = await this.usersService.findByLoginWithDetails(dto.login);
        if (!user) {
            throw new common_1.UnauthorizedException('Неверный login или пароль');
        }
        const isPasswordValid = await bcrypt.compare(dto.password, user.passwordHash);
        if (!isPasswordValid) {
            throw new common_1.UnauthorizedException('Неверный login или пароль');
        }
        return this.generateTokens(user);
    }
    async getCurrentUser(userId) {
        const user = await this.usersService.findByIdWithDetails(userId);
        return (0, auth_user_mapper_1.mapUserToAuthResponse)(user);
    }
    async refresh(userId, refreshToken) {
        const storedToken = await this.refreshTokenRepository.findOne({
            where: {
                userId,
                isActive: true,
            },
        });
        if (!storedToken) {
            throw new common_1.UnauthorizedException();
        }
        const isValid = await bcrypt.compare(refreshToken, storedToken.tokenHash);
        if (!isValid) {
            throw new common_1.UnauthorizedException();
        }
        const user = await this.usersService.findByIdWithDetails(userId);
        await this.refreshTokenRepository.update({ userId, isActive: true }, { isActive: false });
        return this.generateTokens(user);
    }
    async logout(userId) {
        await this.sessionsNotifier.notifyUserSessionsRemoved(userId);
        await this.refreshTokenRepository.update({ userId, isActive: true }, { isActive: false });
        return {
            success: true,
        };
    }
    async generateTokens(user) {
        const payload = {
            sub: user.id,
            login: user.login,
        };
        const refreshToken = await this.jwtService.signAsync(payload, {
            secret: this.configService.get('JWT_REFRESH_SECRET'),
            expiresIn: '30d',
        });
        const tokenHash = await bcrypt.hash(refreshToken, 10);
        await this.sessionsNotifier.notifyUserSessionsRemoved(user.id);
        await this.refreshTokenRepository.update({ userId: user.id, isActive: true }, { isActive: false });
        const session = await this.refreshTokenRepository.save({
            userId: user.id,
            tokenHash,
            isActive: true,
        });
        await this.sessionsNotifier.notifySessionCreated(session.id);
        const accessToken = await this.jwtService.signAsync({
            ...payload,
            sid: session.id,
        }, {
            secret: this.configService.get('JWT_ACCESS_SECRET'),
            expiresIn: '15m',
        });
        return {
            accessToken,
            refreshToken,
            user: (0, auth_user_mapper_1.mapUserToAuthResponse)(user),
        };
    }
};
exports.AuthService = AuthService;
exports.AuthService = AuthService = __decorate([
    (0, common_1.Injectable)(),
    __param(3, (0, typeorm_1.InjectRepository)(refresh_token_entity_1.RefreshToken)),
    __metadata("design:paramtypes", [users_service_1.UsersService,
        jwt_1.JwtService,
        config_1.ConfigService,
        typeorm_2.Repository,
        sessions_notifier_service_1.SessionsNotifierService])
], AuthService);
//# sourceMappingURL=auth.service.js.map