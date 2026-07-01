import {
    Column,
    Entity,
    JoinColumn,
    OneToOne,
    PrimaryColumn,
    UpdateDateColumn,
} from 'typeorm';

import { User } from '../users/entities/user.entity';

@Entity('consultation_notification_preferences')
export class ConsultationNotificationPreference {
    @PrimaryColumn()
    userId!: number;

    @OneToOne(() => User, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'userId' })
    user!: User;

    @Column({ default: false })
    enabled!: boolean;

    @Column({ default: true })
    allTeachers!: boolean;

    @Column({ type: 'jsonb', default: () => "'[]'" })
    teacherIds!: number[];

    @UpdateDateColumn()
    updatedAt!: Date;
}