import { Column, Entity, OneToMany, PrimaryGeneratedColumn } from 'typeorm';
import { ScheduleItem } from '../../schedule/entities/schedule-item.entity';

@Entity('subjects')
export class Subject {
    @PrimaryGeneratedColumn()
    id!: number;

    @Column()
    name!: string;

    @Column({ type: 'text', nullable: true })
    description!: string | null;

    @OneToMany(() => ScheduleItem, (item) => item.subject)
    scheduleItems!: ScheduleItem[];
}