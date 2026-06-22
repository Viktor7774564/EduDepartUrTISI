import { Column, Entity, JoinColumn, ManyToOne, OneToMany, PrimaryGeneratedColumn } from 'typeorm';
import { Direction } from './direction.entity';
import { Subgroup } from './subgroup.entity';
import { StudentProfile } from '../../users/entities/student-profile.entity';
import { Schedule } from '../../schedule/entities/schedule.entity';

export enum EducationForm {
    FULL_TIME = 'full_time',
    PART_TIME = 'part_time',
    DISTANCE = 'distance',
}

@Entity('groups')
export class Group {
    @PrimaryGeneratedColumn()
    id!: number;

    @Column()
    name!: string;

    @Column()
    directionId!: number;

    @ManyToOne(() => Direction, (direction) => direction.groups, { nullable: false })
    @JoinColumn({ name: 'directionId' })
    direction!: Direction;

    @Column({ type: 'smallint' })
    course!: number;

    @Column({ type: 'enum', enum: EducationForm })
    educationForm!: EducationForm;

    @OneToMany(() => Subgroup, (subgroup) => subgroup.group)
    subgroups!: Subgroup[];

    @OneToMany(() => StudentProfile, (profile) => profile.group)
    studentProfiles!: StudentProfile[];

    @OneToMany(() => Schedule, (schedule) => schedule.group)
    schedules!: Schedule[];
}