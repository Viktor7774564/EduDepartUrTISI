import {
    Injectable,
    UnauthorizedException,
} from '@nestjs/common';

import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';

import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import * as bcrypt from 'bcrypt';

import { UsersService } from '../users/users.service';

import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';

import { RefreshToken } from './entities/refresh-token.entity';
import { mapUserToAuthResponse } from './auth-user.mapper';
import { User } from '../users/entities/user.entity';

@Injectable()
export class AuthService {
    constructor(
        private readonly usersService: UsersService,
        private readonly jwtService: JwtService,
        private readonly configService: ConfigService,

        @InjectRepository(RefreshToken)
        private readonly refreshTokenRepository: Repository<RefreshToken>,
    ) {}

    async register(dto: RegisterDto) {
        const existingUser = await this.usersService.findByLogin(dto.login);

        if (existingUser) {
            throw new UnauthorizedException(
                'Пользователь уже существует',
            );
        }

        const passwordHash = await bcrypt.hash(dto.password, 10);

        const user = await this.usersService.create({
            login: dto.login,
            passwordHash: passwordHash,
        });

        const userWithDetails =
            await this.usersService.findByIdWithDetails(user.id);

        return this.generateTokens(userWithDetails);
    }

    async login(dto: LoginDto) {
        const user = await this.usersService.findByLoginWithDetails(dto.login);

        if (!user) {
            throw new UnauthorizedException(
                'Неверный login или пароль',
            );
        }

        const isPasswordValid = await bcrypt.compare(
            dto.password,
            user.passwordHash,
        );

        if (!isPasswordValid) {
            throw new UnauthorizedException(
                'Неверный login или пароль',
            );
        }

        return this.generateTokens(user);
    }

    async getCurrentUser(userId: number) {
        const user = await this.usersService.findByIdWithDetails(userId);

        return mapUserToAuthResponse(user);
    }

    async refresh(userId: number, refreshToken: string) {
        const storedToken =
            await this.refreshTokenRepository.findOne({
                where: {
                    userId,
                    isActive: true,
                },
            });

        if (!storedToken) {
            throw new UnauthorizedException();
        }

        const isValid = await bcrypt.compare(
            refreshToken,
            storedToken.tokenHash,
        );

        if (!isValid) {
            throw new UnauthorizedException();
        }

        const user = await this.usersService.findByIdWithDetails(userId);

        await this.refreshTokenRepository.update(
            { userId, isActive: true },
            { isActive: false },
        );

        return this.generateTokens(user);
    }

    async logout(userId: number) {
        await this.refreshTokenRepository.update(
            { userId, isActive: true },
            { isActive: false },
        );

        return {
            success: true,
        };
    }

    private async generateTokens(user: User) {
        const payload = {
            sub: user.id,
            login: user.login,
        };

        const accessToken = await this.jwtService.signAsync(
            payload,
            {
                secret: this.configService.get<string>(
                    'JWT_ACCESS_SECRET',
                ),
                expiresIn: '15m',
            },
        );

        const refreshToken = await this.jwtService.signAsync(
            payload,
            {
                secret: this.configService.get<string>(
                    'JWT_REFRESH_SECRET',
                ),
                expiresIn: '30d',
            },
        );

        const tokenHash = await bcrypt.hash(
            refreshToken,
            10,
        );

        await this.refreshTokenRepository.update(
            { userId: user.id, isActive: true },
            { isActive: false },
        );

        await this.refreshTokenRepository.save({
            userId: user.id,
            tokenHash,
            isActive: true,
        });

        return {
            accessToken,
            refreshToken,
            user: mapUserToAuthResponse(user),
        };
    }
}
