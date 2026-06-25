import { Controller, Get } from '@nestjs/common';

import { DepartmentsService, TeacherDepartmentInfo } from './departments.service';

@Controller('academic/departments')
export class DepartmentsController {
    constructor(
        private readonly departmentsService: DepartmentsService,
    ) {}

    @Get('teachers')
    listTeacherDepartments(): Promise<TeacherDepartmentInfo[]> {
        return this.departmentsService.listTeacherDepartments();
    }
}
