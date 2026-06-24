import {
    Column,
    CreateDateColumn,
    Entity,
    JoinColumn,
    ManyToOne,
    OneToMany,
    PrimaryGeneratedColumn,
} from 'typeorm';

import { User } from '../../users/entities/user.entity';
import { ParsedScheduleLesson } from './parsed-schedule-lesson.entity';
import { ScheduleType } from './schedule.entity';

export enum ScheduleParseStatus {
    SUCCESS = 'success',
    FAILED = 'failed',
}

@Entity('schedule_uploads')
export class ScheduleUpload {
    @PrimaryGeneratedColumn()
    id!: number;

    @Column({ type: 'enum', enum: ScheduleType })
    scheduleType!: ScheduleType;

    @Column()
    originalFileName!: string;

    @Column()
    storedFileName!: string;

    @Column()
    fileUrl!: string;

    @Column()
    mimeType!: string;

    @Column({ type: 'int' })
    fileSize!: number;

    @Column({ type: 'varchar', nullable: true })
    groupName!: string | null;

    @Column({ type: 'varchar', nullable: true })
    facultyName!: string | null;

    @Column({ type: 'enum', enum: ScheduleParseStatus, default: ScheduleParseStatus.SUCCESS })
    parseStatus!: ScheduleParseStatus;

    @Column({ type: 'jsonb', nullable: true })
    parseErrors!: string[] | null;

    @Column({ type: 'jsonb', nullable: true })
    parseWarnings!: string[] | null;

    @Column({ type: 'int', default: 0 })
    lessonsCount!: number;

    @Column({ type: 'varchar', nullable: true })
    periodStart!: string | null;

    @Column({ type: 'varchar', nullable: true })
    periodEnd!: string | null;

    @Column()
    uploadedById!: number;

    @ManyToOne(() => User, { nullable: false })
    @JoinColumn({ name: 'uploadedById' })
    uploadedBy!: User;

    @OneToMany(() => ParsedScheduleLesson, (lesson) => lesson.upload)
    parsedLessons!: ParsedScheduleLesson[];

    @CreateDateColumn()
    uploadedAt!: Date;
}
