import { Column, Entity, JoinColumn, ManyToOne, OneToOne, PrimaryGeneratedColumn, Unique } from 'typeorm';
import { User } from './user.entity';
import { Group, EducationForm } from '../../academic/entities/group.entity';
import { Subgroup } from '../../academic/entities/subgroup.entity';

@Entity('student_profiles')
@Unique(['userId'])
export class StudentProfile {
    @PrimaryGeneratedColumn()
    id!: number;

    @Column()
    userId!: number;

    @OneToOne(() => User, (user) => user.studentProfile, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'userId' })
    user!: User;

    @Column()
    groupId!: number;

    @ManyToOne(() => Group, (group) => group.studentProfiles, { nullable: false })
    @JoinColumn({ name: 'groupId' })
    group!: Group;

    @Column({ nullable: true })
    subgroupId!: number | null;

    @ManyToOne(() => Subgroup, (subgroup) => subgroup.studentProfiles, { nullable: true })
    @JoinColumn({ name: 'subgroupId' })
    subgroup!: Subgroup | null;

    @Column({ type: 'smallint' })
    course!: number;

    @Column({ type: 'enum', enum: EducationForm })
    educationForm!: EducationForm;
}