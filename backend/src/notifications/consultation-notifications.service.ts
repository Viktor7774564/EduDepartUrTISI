import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';

import { Consultation } from '../schedule/entities/consultation.entity';
import { formatTeacherName } from '../schedule/schedule-item.mapper';
import { RoleCode } from '../users/entities/role.entity';
import { User } from '../users/entities/user.entity';
import { ConsultationNotificationPreferencesService } from './consultation-notification-preferences.service';
import { Notification, NotificationType } from './notification.entity';
import { NotificationsGateway } from './notifications.gateway';
import { PushNotificationsService } from './push-notifications.service';

type ConsultationNotificationAction = 'created' | 'updated' | 'deleted';

type MessageAudience = 'student' | 'teacher' | 'other';

export type ConsultationNotificationSnapshot = {
    id: number;
    departmentId: number;
    teacherId: number;
    teacherName: string;
    subject: string;
    consultationType: string;
    dayOfWeek: number;
    startTime: string;
    endTime: string;
    weekStart: string;
    room: string | null;
    comment: string | null;
};

const CONSULTATION_DAY_LABELS: Record<number, string> = {
    1: 'понедельник',
    2: 'вторник',
    3: 'среда',
    4: 'четверг',
    5: 'пятница',
    6: 'суббота',
    7: 'воскресенье',
};

@Injectable()
export class ConsultationNotificationsService {
    private readonly logger = new Logger(ConsultationNotificationsService.name);

    constructor(
        @InjectRepository(Notification)
        private readonly notificationsRepository: Repository<Notification>,
        @InjectRepository(User)
        private readonly usersRepository: Repository<User>,
        private readonly notificationsGateway: NotificationsGateway,
        private readonly pushNotificationsService: PushNotificationsService,
        private readonly consultationNotificationPreferencesService: ConsultationNotificationPreferencesService,
    ) {}

    createConsultationSnapshot(consultation: Consultation): ConsultationNotificationSnapshot {
        return {
            id: consultation.id,
            departmentId: consultation.departmentId,
            teacherId: consultation.teacherId,
            teacherName: consultation.teacher
                ? formatTeacherName(consultation.teacher)
                : '',
            subject: consultation.subject,
            consultationType: consultation.consultationType,
            dayOfWeek: consultation.dayOfWeek,
            startTime: this.formatTime(consultation.startTime),
            endTime: this.formatTime(consultation.endTime),
            weekStart: String(consultation.weekStart),
            room: consultation.room,
            comment: consultation.comment,
        };
    }

    async notifyConsultationChanged(
        action: ConsultationNotificationAction,
        consultation: Consultation,
        previousItem?: ConsultationNotificationSnapshot,
    ): Promise<void> {
        const currentItem = this.createConsultationSnapshot(consultation);

        if (
            action === 'updated'
            && previousItem
            && !this.hasConsultationChanges(previousItem, currentItem)
        ) {
            return;
        }

        const recipients = await this.resolveConsultationRecipients(
            currentItem.teacherId,
            previousItem?.teacherId,
        );

        if (recipients.length === 0) {
            this.logger.warn(
                `Consultation notification has no recipients: consultationId=${currentItem.id}, teacherId=${currentItem.teacherId}`,
            );
            return;
        }

        const title = this.getConsultationTitle(action);
        const notifications = await this.notificationsRepository.save(
            recipients.map((user) => {
                const audience = this.getMessageAudience(user);

                return this.notificationsRepository.create({
                    userId: user.id,
                    type: NotificationType.CONSULTATION,
                    title,
                    message: this.buildConsultationMessage(
                        action,
                        currentItem,
                        previousItem,
                        audience,
                    ),
                    payload: {
                        action,
                        consultationId: consultation.id,
                        departmentId: currentItem.departmentId,
                        teacherId: currentItem.teacherId,
                        weekStart: currentItem.weekStart,
                        dayOfWeek: currentItem.dayOfWeek,
                        startTime: currentItem.startTime,
                        endTime: currentItem.endTime,
                        changes: previousItem
                            ? this.getConsultationChanges(previousItem, currentItem, audience)
                            : [],
                    },
                });
            }),
        );

        for (const notification of notifications) {
            this.notificationsGateway.sendToUser(notification.userId, notification);
            void this.pushNotificationsService.sendToUser(notification.userId, notification);
        }
    }

    private async resolveConsultationRecipients(
        teacherId: number,
        previousTeacherId?: number,
    ): Promise<User[]> {
        const recipientIds = new Set<number>();

        const subscriberIds = await this.consultationNotificationPreferencesService
            .findSubscriberUserIds(teacherId);

        for (const userId of subscriberIds) {
            recipientIds.add(userId);
        }

        recipientIds.add(teacherId);

        if (previousTeacherId && previousTeacherId !== teacherId) {
            recipientIds.add(previousTeacherId);

            const previousSubscriberIds = await this.consultationNotificationPreferencesService
                .findSubscriberUserIds(previousTeacherId);

            for (const userId of previousSubscriberIds) {
                recipientIds.add(userId);
            }
        }

        if (recipientIds.size === 0) {
            return [];
        }

        return this.usersRepository.find({
            where: {
                id: In([...recipientIds]),
                isActive: true,
            },
            relations: ['role'],
        });
    }

    private hasConsultationChanges(
        previousItem: ConsultationNotificationSnapshot,
        currentItem: ConsultationNotificationSnapshot,
    ): boolean {
        return previousItem.subject !== currentItem.subject
            || previousItem.consultationType !== currentItem.consultationType
            || previousItem.teacherId !== currentItem.teacherId
            || previousItem.dayOfWeek !== currentItem.dayOfWeek
            || previousItem.startTime !== currentItem.startTime
            || previousItem.endTime !== currentItem.endTime
            || previousItem.weekStart !== currentItem.weekStart
            || (previousItem.room ?? '') !== (currentItem.room ?? '')
            || (previousItem.comment ?? '') !== (currentItem.comment ?? '');
    }

    private getConsultationTitle(action: ConsultationNotificationAction): string {
        switch (action) {
            case 'created':
                return 'Добавлена консультация';
            case 'updated':
                return 'Изменена консультация';
            case 'deleted':
                return 'Отмена консультации';
        }
    }

    private buildConsultationMessage(
        action: ConsultationNotificationAction,
        item: ConsultationNotificationSnapshot,
        previousItem?: ConsultationNotificationSnapshot,
        audience: MessageAudience = 'student',
    ): string {
        const summary = this.formatConsultationSummary(item, audience);

        if (action === 'created') {
            return summary;
        }

        if (action === 'deleted') {
            return `${summary}. Отмена консультации`;
        }

        if (action === 'updated' && previousItem) {
            const changes = this.buildUpdatedConsultationMessage(previousItem, item, audience);

            return changes || summary;
        }

        return summary;
    }

    private buildUpdatedConsultationMessage(
        previousItem: ConsultationNotificationSnapshot,
        item: ConsultationNotificationSnapshot,
        audience: MessageAudience,
    ): string {
        const messages: string[] = [];

        if (this.isConsultationPlacementChanged(previousItem, item)) {
            messages.push(this.formatConsultationTransferMessage(previousItem, item, audience));
        }

        this.addChange(messages, 'Предмет', previousItem.subject, item.subject);
        this.addChange(messages, 'Тип', previousItem.consultationType, item.consultationType);

        if (audience !== 'teacher') {
            this.addChange(messages, 'Преподаватель', previousItem.teacherName, item.teacherName);
        }

        if ((previousItem.room ?? '').trim() !== (item.room ?? '').trim()) {
            const room = item.room?.trim() || 'кабинет не указан';
            messages.push(`Кабинет: ${room}`);
        }

        this.addChange(
            messages,
            'Комментарий',
            previousItem.comment ?? '',
            item.comment ?? '',
        );

        return messages.join(' ');
    }

    private getConsultationChanges(
        previousItem: ConsultationNotificationSnapshot,
        item: ConsultationNotificationSnapshot,
        audience: MessageAudience,
    ): string[] {
        const changes: string[] = [];

        if (this.isConsultationPlacementChanged(previousItem, item)) {
            changes.push(this.formatConsultationTransferMessage(previousItem, item, audience));
        }

        this.addChange(changes, 'Предмет', previousItem.subject, item.subject);
        this.addChange(changes, 'Тип', previousItem.consultationType, item.consultationType);

        if (audience !== 'teacher') {
            this.addChange(changes, 'Преподаватель', previousItem.teacherName, item.teacherName);
        }

        this.addChange(changes, 'Кабинет', previousItem.room ?? '', item.room ?? '');
        this.addChange(changes, 'Комментарий', previousItem.comment ?? '', item.comment ?? '');

        return changes;
    }

    private isConsultationPlacementChanged(
        previousItem: ConsultationNotificationSnapshot,
        item: ConsultationNotificationSnapshot,
    ): boolean {
        return previousItem.weekStart !== item.weekStart
            || previousItem.dayOfWeek !== item.dayOfWeek
            || previousItem.startTime !== item.startTime
            || previousItem.endTime !== item.endTime;
    }

    private formatConsultationTransferMessage(
        previousItem: ConsultationNotificationSnapshot,
        item: ConsultationNotificationSnapshot,
        audience: MessageAudience,
    ): string {
        const consultation = this.capitalize(this.formatConsultationWithSubject(item));
        const teacher = this.formatTeacherForNotification(item.teacherName);
        const teacherPart = audience !== 'teacher' && teacher
            ? ` у преподавателя ${teacher}`
            : '';
        const previousDate = this.formatConsultationShortDate(previousItem);
        const nextDate = this.formatConsultationShortDate(item);
        const previousTime = `${previousItem.startTime}-${previousItem.endTime}`;
        const nextTime = `${item.startTime}-${item.endTime}`;

        return `${consultation}${teacherPart} перенесена с ${previousDate}, ${previousTime} на ${nextDate}, ${nextTime}.`;
    }

    private formatConsultationSummary(
        item: ConsultationNotificationSnapshot,
        audience: MessageAudience,
    ): string {
        const consultation = this.capitalize(this.formatConsultationWithSubject(item));
        const teacherPart = audience !== 'teacher' && item.teacherName.trim()
            ? ` у ${item.teacherName.trim()}`
            : '';
        const dateTime = this.formatConsultationDateTime(item);
        const room = item.room?.trim();

        if (!room) {
            return `${consultation}${teacherPart}, ${dateTime}`;
        }

        return `${consultation}${teacherPart}, ${dateTime}. Кабинет: ${room}`;
    }

    private formatConsultationWithSubject(item: ConsultationNotificationSnapshot): string {
        const type = item.consultationType.trim() || 'консультация';
        const subject = item.subject.trim();

        if (!subject || type.toLowerCase() === subject.toLowerCase()) {
            return type.toLowerCase();
        }

        return `${type.toLowerCase()} по ${subject}`;
    }

    private formatConsultationDateTime(item: ConsultationNotificationSnapshot): string {
        const day = CONSULTATION_DAY_LABELS[item.dayOfWeek] ?? 'день не указан';
        const date = this.formatConsultationDate(item);

        return `${day}${date ? `, ${date}` : ''}, ${item.startTime}-${item.endTime}`;
    }

    private formatConsultationDate(item: ConsultationNotificationSnapshot): string {
        const [year, month, day] = item.weekStart.slice(0, 10).split('-').map(Number);

        if (!year || !month || !day || !item.dayOfWeek) {
            return '';
        }

        const lessonDate = new Date(Date.UTC(year, month - 1, day + item.dayOfWeek - 1));
        const formattedDay = String(lessonDate.getUTCDate()).padStart(2, '0');
        const formattedMonth = String(lessonDate.getUTCMonth() + 1).padStart(2, '0');

        return `${formattedDay}.${formattedMonth}.${lessonDate.getUTCFullYear()}`;
    }

    private formatConsultationShortDate(item: ConsultationNotificationSnapshot): string {
        const [day, month] = this.formatConsultationDate(item).split('.');

        if (!day || !month) {
            return 'дата не указана';
        }

        return `${day}.${month}`;
    }

    private getMessageAudience(user: User): MessageAudience {
        if (user.role?.code === RoleCode.TEACHER) {
            return 'teacher';
        }

        if (user.role?.code === RoleCode.STUDENT) {
            return 'student';
        }

        return 'other';
    }

    private formatTeacherForNotification(value: string): string {
        return value.trim().replace(/[\s.]+/g, '');
    }

    private capitalize(value: string): string {
        const trimmed = value.trim();

        if (!trimmed) {
            return '';
        }

        return `${trimmed.charAt(0).toUpperCase()}${trimmed.slice(1).toLowerCase()}`;
    }

    private addChange(
        changes: string[],
        label: string,
        previousValue: string,
        nextValue: string,
    ): void {
        const previous = previousValue.trim() || 'не указано';
        const next = nextValue.trim() || 'не указано';

        if (previous !== next) {
            changes.push(`${label}: ${previous} -> ${next}`);
        }
    }

    private formatTime(value: string): string {
        return String(value).slice(0, 5);
    }
}
