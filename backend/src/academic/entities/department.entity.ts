import { Column, Entity, OneToMany, PrimaryGeneratedColumn } from 'typeorm';
import { TeacherProfile } from '../../users/entities/teacher-profile.entity';
import { StaffProfile } from '../../users/entities/staff-profile.entity';

@Entity('departments')
export class Department {
    @PrimaryGeneratedColumn()
    id!: number;

    @Column()
    name!: string;

    @Column({ type: 'varchar', nullable: true })
    shortName!: string | null;

    @OneToMany(() => TeacherProfile, (profile) => profile.department)
    teacherProfiles!: TeacherProfile[];

    @OneToMany(() => StaffProfile, (profile) => profile.department)
    staffProfiles!: StaffProfile[];
}