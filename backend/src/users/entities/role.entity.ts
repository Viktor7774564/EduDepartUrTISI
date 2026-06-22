import { Column, Entity, OneToMany, PrimaryGeneratedColumn } from 'typeorm';
import { User } from './user.entity';

export enum RoleCode {
    ADMIN = 'admin',
    STUDENT = 'student',
    TEACHER = 'teacher',
    EDUCATION_DEPARTMENT = 'education_department',
}

@Entity('roles')
export class Role {
    @PrimaryGeneratedColumn()
    id!: number;

    @Column({ type: 'enum', enum: RoleCode, unique: true })
    code!: RoleCode;

    @Column()
    name!: string;

    @OneToMany(() => User, (user) => user.role)
    users!: User[];
}