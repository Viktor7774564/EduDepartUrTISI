import {
    Body,
    Controller,
    Delete,
    Get,
    Param,
    ParseIntPipe,
    Patch,
    Post,
    Req,
    UseGuards,
} from '@nestjs/common';

import { Request } from 'express';

import { AuthService } from './auth.service';

import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { ChangePasswordDto } from './dto/change-password.dto';

import { RefreshTokenGuard } from './guards/refresh-token.guard';
import { AccessTokenGuard } from './guards/access-token.guard';

// Создаем интерфейс, который сообщает TypeScript о наличии поля user
interface AuthenticatedRequest extends Request {
    user: {
        sub: number;
        login: string;
        sid: number;
        refreshToken?: string;
    };
}



@Controller('auth')
export class AuthController {
    constructor(
        private readonly authService: AuthService,
    ) {}

    @Post('register')
    register(@Body() dto: RegisterDto) {
        return this.authService.register(dto);
    }

    @Post('login')
    login(@Body() dto: LoginDto) {
        return this.authService.login(dto);
    }

    @UseGuards(AccessTokenGuard)
    @Get('me')
    me(@Req() req: AuthenticatedRequest) {
        return this.authService.getCurrentUser(req.user.sub);
    }

    @UseGuards(RefreshTokenGuard)
    @Post('refresh')
    refresh(@Req() req: AuthenticatedRequest) { // Используем наш интерфейс
        return this.authService.refresh(
            req.user.sub,
            req.user.refreshToken!,
        );
    }

    @UseGuards(AccessTokenGuard)
    @Get('logout')
    logout(@Req() req: AuthenticatedRequest) {
        return this.authService.logout(
            req.user.sub,
            req.user.sid,
        );
    }

    @UseGuards(AccessTokenGuard)
    @Get('sessions')
    listSessions(@Req() req: AuthenticatedRequest) {
        return this.authService.listUserSessions(
            req.user.sub,
            req.user.sid,
        );
    }

    @UseGuards(AccessTokenGuard)
    @Delete('sessions/:id')
    revokeSession(
        @Req() req: AuthenticatedRequest,
        @Param('id', ParseIntPipe) id: number,
    ) {
        return this.authService.revokeUserSession(
            req.user.sub,
            req.user.sid,
            id,
        );
    }

    @UseGuards(AccessTokenGuard)
    @Patch('password')
    changePassword(
        @Req() req: AuthenticatedRequest,
        @Body() dto: ChangePasswordDto,
    ) {
        return this.authService.changePassword(
            req.user.sub,
            req.user.sid,
            dto,
        );
    }
}
