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

    UploadedFile,

    UseGuards,

    UseInterceptors,

} from '@nestjs/common';

import { FileInterceptor } from '@nestjs/platform-express';

import { memoryStorage } from 'multer';



import { Request } from 'express';



import { AccessTokenGuard } from '../auth/guards/access-token.guard';

import { AdminGuard } from './guards/admin.guard';

import { AdminService } from './admin.service';

import {

    avatarUploadOptions,

    parseCreateUserBody,

    parseUpdateUserBody,

} from './dto/multipart.parser';



interface AuthenticatedRequest extends Request {

    user: {

        sub: number;

        login: string;

    };

}



@Controller('admin')

@UseGuards(AccessTokenGuard, AdminGuard)

export class AdminController {

    constructor(

        private readonly adminService: AdminService,

    ) {}



    @Get('users')

    listUsers() {

        return this.adminService.listUsers();

    }



    @Post('users')

    @UseInterceptors(FileInterceptor('photo', {

        storage: memoryStorage(),

        ...avatarUploadOptions,

    }))

    createUser(

        @Body() body: Record<string, unknown>,

        @UploadedFile() photo?: Express.Multer.File,

    ) {

        const dto = parseCreateUserBody(body);



        return this.adminService.createUser(dto, photo);

    }



    @Get('users/:id')

    getUser(@Param('id', ParseIntPipe) id: number) {

        return this.adminService.getUser(id);

    }



    @Patch('users/:id')

    @UseInterceptors(FileInterceptor('photo', {

        storage: memoryStorage(),

        ...avatarUploadOptions,

    }))

    updateUser(

        @Param('id', ParseIntPipe) id: number,

        @Body() body: Record<string, unknown>,

        @UploadedFile() photo: Express.Multer.File | undefined,

        @Req() req: AuthenticatedRequest,

    ) {

        const dto = parseUpdateUserBody(body);



        return this.adminService.updateUser(id, dto, req.user.sub, photo);

    }



    @Delete('users/:id')

    deleteUser(

        @Param('id', ParseIntPipe) id: number,

        @Req() req: AuthenticatedRequest,

    ) {

        return this.adminService.deleteUser(id, req.user.sub);

    }



    @Get('sessions')

    listSessions() {

        return this.adminService.listActiveSessions();

    }



    @Delete('sessions/:id')

    revokeSession(@Param('id', ParseIntPipe) id: number) {

        return this.adminService.revokeSession(id);

    }

}


