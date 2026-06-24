import {
    Column,
    Entity,
    JoinColumn,
    ManyToOne,
    PrimaryGeneratedColumn,
} from 'typeorm';

import { ScheduleUpload } from './schedule-upload.entity';

@Entity('parsed_schedule_lessons')
export class ParsedScheduleLesson {
    @PrimaryGeneratedColumn()
    id!: number;

    @Column()
    uploadId!: number;

    @ManyToOne(() => ScheduleUpload, (upload) => upload.parsedLessons, {
        nullable: false,
        onDelete: 'CASCADE',
    })
    @JoinColumn({ name: 'uploadId' })
    upload!: ScheduleUpload;

    @Column()
    groupName!: string;

    @Column({ type: 'smallint' })
    dayOfWeek!: number;

    @Column({ type: 'time' })
    startTime!: string;

    @Column({ type: 'time' })
    endTime!: string;

    @Column({ type: 'date' })
    weekStart!: string;

    @Column({ type: 'smallint', nullable: true })
    subgroup!: number | null;

    @Column()
    subject!: string;

    @Column()
    lessonType!: string;

    @Column({ type: 'varchar', nullable: true })
    teacherPosition!: string | null;

    @Column()
    teacherName!: string;

    @Column({ type: 'varchar', nullable: true })
    room!: string | null;

    @Column({ default: false })
    isDistance!: boolean;

    @Column({ default: false })
    isSameCellParallel!: boolean;
}
