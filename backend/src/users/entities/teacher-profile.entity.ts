import { Column, Entity, JoinColumn, ManyToOne, OneToOne, PrimaryGeneratedColumn, Unique } from 'typeorm';
import { User } from './user.entity';
import { Department } from '../../academic/entities/department.entity';

@Entity('teacher_profiles')
@Unique(['userId'])
export class TeacherProfile {
    @PrimaryGeneratedColumn()
    id!: number;

    @Column()
    userId!: number;

    @OneToOne(() => User, (user) => user.teacherProfile, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'userId' })
    user!: User;

    @Column()
    departmentId!: number;

    @ManyToOne(() => Department, (department) => department.teacherProfiles, { nullable: false })
    @JoinColumn({ name: 'departmentId' })
    department!: Department;

    @Column()
    position!: string;

    @Column({ type: 'varchar', nullable: true })
    cabinet!: string | null;
}