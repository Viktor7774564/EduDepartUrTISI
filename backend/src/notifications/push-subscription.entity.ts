import {
    Column,
    CreateDateColumn,
    Entity,
    JoinColumn,
    ManyToOne,
    PrimaryGeneratedColumn,
    Unique,
} from 'typeorm';

import { User } from '../users/entities/user.entity';

@Entity('push_subscriptions')
@Unique(['endpoint'])
export class PushSubscription {
    @PrimaryGeneratedColumn()
    id!: number;

    @Column()
    userId!: number;

    @ManyToOne(() => User, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'userId' })
    user!: User;

    @Column({ type: 'text' })
    endpoint!: string;

    @Column()
    p256dh!: string;

    @Column()
    auth!: string;

    @CreateDateColumn()
    createdAt!: Date;
}
