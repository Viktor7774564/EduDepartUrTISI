import { Column, Entity, JoinColumn, ManyToOne, OneToMany, PrimaryGeneratedColumn, Unique } from 'typeorm';
import { Group } from './group.entity';
import { StudentProfile } from '../../users/entities/student-profile.entity';
import { ScheduleItem } from '../../schedule/entities/schedule-item.entity';

@Entity('subgroups')
@Unique(['groupId', 'number'])
export class Subgroup {
    @PrimaryGeneratedColumn()
    id!: number;

    @Column()
    groupId!: number;

    @ManyToOne(() => Group, (group) => group.subgroups, { nullable: false, onDelete: 'CASCADE' })
    @JoinColumn({ name: 'groupId' })
    group!: Group;

    @Column({ type: 'smallint' })
    number!: 1 | 2;

    @OneToMany(() => StudentProfile, (profile) => profile.subgroup)
    studentProfiles!: StudentProfile[];

    @OneToMany(() => ScheduleItem, (item) => item.subgroup)
    scheduleItems!: ScheduleItem[];
}