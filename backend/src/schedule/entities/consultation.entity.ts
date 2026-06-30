import {
    Column,
    CreateDateColumn,
    Entity,
    JoinColumn,
    ManyToOne,
    PrimaryGeneratedColumn,
    UpdateDateColumn,
} from 'typeorm';

import { Department } from '../../academic/entities/department.entity';
import { User } from '../../users/entities/user.entity';

@Entity('consultations')
export class Consultation {
    @PrimaryGeneratedColumn()
    id!: number;

    @Column()
    departmentId!: number;

    @ManyToOne(() => Department, { nullable: false })
    @JoinColumn({ name: 'departmentId' })
    department!: Department;

    @Column()
    teacherId!: number;

    @ManyToOne(() => User, { nullable: false })
    @JoinColumn({ name: 'teacherId' })
    teacher!: User;

    @Column()
    subject!: string;

    @Column()
    consultationType!: string;

    @Column({ type: 'smallint' })
    dayOfWeek!: number;

    @Column({ type: 'time' })
    startTime!: string;

    @Column({ type: 'time' })
    endTime!: string;

    @Column({ type: 'date' })
    weekStart!: string;

    @Column({ type: 'varchar', nullable: true })
    room!: string | null;

    @Column({ type: 'text', nullable: true })
    comment!: string | null;

    @CreateDateColumn()
    createdAt!: Date;

    @UpdateDateColumn()
    updatedAt!: Date;
}
