import { Column, Entity, JoinColumn, ManyToOne, OneToMany, PrimaryGeneratedColumn } from 'typeorm';
import { Group } from '../../academic/entities/group.entity';
import { User } from '../../users/entities/user.entity';
import { ScheduleItem } from './schedule-item.entity';
import { ScheduleType } from './schedule-type.enum';
import { ScheduleUpload } from './schedule-upload.entity';

export { ScheduleType } from './schedule-type.enum';

@Entity('schedules')
export class Schedule {
    @PrimaryGeneratedColumn()
    id!: number;

    @Column({ type: 'enum', enum: ScheduleType })
    scheduleType!: ScheduleType;

    @Column({ nullable: true })
    groupId!: number | null;

    @ManyToOne(() => Group, (group) => group.schedules, { nullable: true })
    @JoinColumn({ name: 'groupId' })
    group!: Group | null;

    @Column({ nullable: true })
    teacherId!: number | null;

    @Column({ nullable: true })
    uploadId!: number | null;

    @ManyToOne(() => ScheduleUpload, {nullable: true, onDelete: `SET NULL`})
    @JoinColumn({ name: 'uploadId' })
    upload!: ScheduleUpload | null;

    @ManyToOne(() => User, { nullable: true })
    @JoinColumn({ name: 'teacherId' })
    teacher!: User | null;

    @Column({ type: 'date' })
    validFrom!: string;

    @Column({ type: 'date' })
    validTo!: string;

    @Column({ default: true })
    isActive!: boolean;

    @OneToMany(() => ScheduleItem, (item) => item.schedule)
    items!: ScheduleItem[];
}