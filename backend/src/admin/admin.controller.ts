import { Body, Controller, Delete, Get, Param, ParseIntPipe, Patch, Post, Req, UploadedFile, UseGuards, UseInterceptors, } from '@nestjs/common';

import { FileInterceptor } from '@nestjs/platform-express';

import { memoryStorage } from 'multer';



import { Request } from 'express';



import { AccessTokenGuard } from '../auth/guards/access-token.guard';

import { AdminGuard } from './guards/admin.guard';

import { AdminService } from './admin.service';
import { AdminAcademicService } from './admin-academic.service';

import {

    avatarUploadOptions,

    parseCreateUserBody,

    parseUpdateUserBody,

} from './dto/multipart.parser';

import { SetDepartmentHeadDto } from './dto/set-department-head.dto';
import { CreateDirectionDto } from './dto/create-direction.dto';
import { CreateGroupDto } from './dto/create-group.dto';
import { CreateTeacherDepartmentDto } from './dto/create-teacher-department.dto';
import { CreateStaffDepartmentDto } from './dto/create-staff-department.dto';



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

        private readonly adminAcademicService: AdminAcademicService,

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



    @Get('academic/overview')

    getAcademicOverview() {

        return this.adminAcademicService.getOverview();

    }



    @Post('academic/directions')

    createAcademicDirection(@Body() dto: CreateDirectionDto) {

        return this.adminAcademicService.createDirection(dto);

    }



    @Post('academic/directions/:directionId/groups')

    createAcademicGroup(

        @Param('directionId', ParseIntPipe) directionId: number,

        @Body() dto: CreateGroupDto,

    ) {

        return this.adminAcademicService.createGroup(directionId, dto);

    }



    @Post('academic/departments/teacher')

    createTeacherDepartment(@Body() dto: CreateTeacherDepartmentDto) {

        return this.adminAcademicService.createTeacherDepartment(dto);

    }



    @Post('academic/departments/staff')

    createStaffDepartment(@Body() dto: CreateStaffDepartmentDto) {

        return this.adminAcademicService.createStaffDepartment(dto);

    }



    @Patch('academic/departments/:id/head')

    setDepartmentHead(

        @Param('id', ParseIntPipe) id: number,

        @Body() dto: SetDepartmentHeadDto,

    ) {

        return this.adminAcademicService.setDepartmentHead(

            id,

            dto.headUserId ?? null,

        );

    }



    @Delete('academic/groups/:id')

    deleteAcademicGroup(@Param('id', ParseIntPipe) id: number) {

        return this.adminAcademicService.deleteGroup(id);

    }



    @Delete('academic/directions/:id')

    deleteAcademicDirection(@Param('id', ParseIntPipe) id: number) {

        return this.adminAcademicService.deleteDirection(id);

    }



    @Delete('academic/departments/:id')

    deleteAcademicDepartment(@Param('id', ParseIntPipe) id: number) {

        return this.adminAcademicService.deleteDepartment(id);

    }



    @Get('academic/departments/staff')

    listStaffDepartments() {

        return this.adminService.listStaffDepartments();

    }



    @Post('academic/directions/:sourceId/merge-into/:targetId')

    mergeAcademicDirections(

        @Param('sourceId', ParseIntPipe) sourceId: number,

        @Param('targetId', ParseIntPipe) targetId: number,

    ) {

        return this.adminAcademicService.mergeDirections(sourceId, targetId);

    }

}


