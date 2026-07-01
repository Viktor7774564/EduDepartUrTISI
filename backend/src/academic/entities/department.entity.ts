import { Column, Entity, JoinColumn, ManyToOne, OneToMany, PrimaryGeneratedColumn } from 'typeorm';
import { TeacherProfile } from '../../users/entities/teacher-profile.entity';
import { StaffProfile } from '../../users/entities/staff-profile.entity';
import { User } from '../../users/entities/user.entity';

@Entity('departments')
export class Department {
    @PrimaryGeneratedColumn()
    id!: number;

    @Column()
    name!: string;

    @Column({ type: 'varchar', nullable: true })
    shortName!: string | null;

    @Column({ type: 'int', nullable: true })
    headUserId!: number | null;

    @ManyToOne(() => User, { nullable: true, onDelete: 'SET NULL' })
    @JoinColumn({ name: 'headUserId' })
    headUser?: User | null;

    @OneToMany(() => TeacherProfile, (profile) => profile.department)
    teacherProfiles!: TeacherProfile[];

    @OneToMany(() => StaffProfile, (profile) => profile.department)
    staffProfiles!: StaffProfile[];
}