import {
    Controller,
    Delete,
    Get,
    Param,
    ParseIntPipe,
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
import { EducationDepartmentGuard } from './guards/education-department.guard';
import { ScheduleUploadService } from './schedule-upload.service';

interface AuthenticatedRequest extends Request {
    user: {
        sub: number;
        login: string;
    };
}

@Controller('education-department/schedules')
@UseGuards(AccessTokenGuard, EducationDepartmentGuard)
export class ScheduleUploadController {
    constructor(
        private readonly scheduleUploadService: ScheduleUploadService,
    ) {}

    @Get()
    listUploads() {
        return this.scheduleUploadService.listUploads();
    }

    @Post('upload')
    @UseInterceptors(FileInterceptor('file', {
        storage: memoryStorage(),
        limits: { fileSize: 20 * 1024 * 1024 },
    }))
    uploadSchedule(
        @Req() req: AuthenticatedRequest,
        @UploadedFile() file: Express.Multer.File | undefined,
    ) {
        return this.scheduleUploadService.uploadSchedule(
            req.user.sub,
            req.body?.scheduleType,
            req.body?.groupName,
            req.body?.facultyName,
            file,
        );
    }

    @Delete(':id')
    deleteUpload(@Param('id', ParseIntPipe) id: number) {
        return this.scheduleUploadService.deleteUpload(id);
    }
}
