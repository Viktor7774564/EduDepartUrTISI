import { Column, Entity, OneToMany, PrimaryGeneratedColumn } from 'typeorm';
import { ScheduleItem } from './schedule-item.entity';

@Entity('rooms')
export class Room {
    @PrimaryGeneratedColumn()
    id!: number;

    @Column({ type: 'varchar', nullable: true })
    building!: string | null;

    @Column()
    number!: string;

    @Column({ type: 'varchar', nullable: true })
    name!: string | null;

    @Column({ default: false })
    isOnline!: boolean;

    @Column({ default: false })
    isSharedMultiHall!: boolean;

    @OneToMany(() => ScheduleItem, (item) => item.room)
    scheduleItems!: ScheduleItem[];
}