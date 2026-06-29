import {
    Column,
    CreateDateColumn,
    Entity,
    JoinColumn,
    ManyToOne,
    PrimaryGeneratedColumn,
} from 'typeorm';

import { User } from '../users/entities/user.entity';

export enum NotificationType {
    SCHEDULE = 'schedule',
}

@Entity('notifications')
export class Notification {
    @PrimaryGeneratedColumn()
    id!: number;

    @Column()
    userId!: number;

    @ManyToOne(() => User, { nullable: false, onDelete: 'CASCADE' })
    @JoinColumn({ name: 'userId' })
    user!: User;

    @Column({ type: 'enum', enum: NotificationType })
    type!: NotificationType;

    @Column()
    title!: string;

    @Column({ type: 'text' })
    message!: string;

    @Column({ type: 'jsonb', nullable: true })
    payload!: Record<string, unknown> | null;

    @Column({ default: false })
    isRead!: boolean;

    @CreateDateColumn()
    createdAt!: Date;
}