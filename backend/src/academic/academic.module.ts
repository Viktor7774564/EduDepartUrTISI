import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { Department } from './entities/department.entity';
import { Direction } from './entities/direction.entity';
import { Group } from './entities/group.entity';
import { Subgroup } from './entities/subgroup.entity';
import { Subject } from './entities/subject.entity';

@Module({
    imports: [
        TypeOrmModule.forFeature([
            Department,
            Direction,
            Group,
            Subgroup,
            Subject,
        ]),
    ],
    exports: [TypeOrmModule],
})
export class AcademicModule {}