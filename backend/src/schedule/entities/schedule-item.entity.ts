import { Column, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';
import { Schedule } from './schedule.entity';
import { Subject } from '../../academic/entities/subject.entity';
import { Subgroup } from '../../academic/entities/subgroup.entity';
import { LessonType } from './lesson-type.entity';
import { User } from '../../users/entities/user.entity';
import { Room } from './room.entity';

export enum WeekType {
    EVEN = 'even',
    ODD = 'odd',
}

@Entity('schedule_items')
export class ScheduleItem {
    @PrimaryGeneratedColumn()
    id!: number;

    @Column()
    scheduleId!: number;

    @ManyToOne(() => Schedule, (schedule) => schedule.items, { nullable: false, onDelete: 'CASCADE' })
    @JoinColumn({ name: 'scheduleId' })
    schedule!: Schedule;

    @Column()
    subjectId!: number;

    @ManyToOne(() => Subject, (subject) => subject.scheduleItems, { nullable: false })
    @JoinColumn({ name: 'subjectId' })
    subject!: Subject;

    @Column({ nullable: true })
    subgroupId!: number | null;

    @ManyToOne(() => Subgroup, (subgroup) => subgroup.scheduleItems, { nullable: true })
    @JoinColumn({ name: 'subgroupId' })
    subgroup!: Subgroup | null;

    @Column()
    lessonTypeId!: number;

    @ManyToOne(() => LessonType, (lessonType) => lessonType.scheduleItems, { nullable: false })
    @JoinColumn({ name: 'lessonTypeId' })
    lessonType!: LessonType;

    @Column()
    teacherId!: number;

    @ManyToOne(() => User, { nullable: false })
    @JoinColumn({ name: 'teacherId' })
    teacher!: User;

    @Column({ nullable: true })
    roomId!: number | null;

    @ManyToOne(() => Room, (room) => room.scheduleItems, { nullable: true })
    @JoinColumn({ name: 'roomId' })
    room!: Room | null;

    @Column({ type: 'smallint' })
    dayOfWeek!: number; // 1–7

    @Column({ type: 'time' })
    startTime!: string;

    @Column({ type: 'time' })
    endTime!: string;

    @Column({ type: 'enum', enum: WeekType, nullable: true })
    weekType!: WeekType | null;

    @Column({ type: 'text', nullable: true })
    comment!: string | null;
}