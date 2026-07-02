import { BadRequestException, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { NotificationsService } from '../notifications/notifications.service';
import { UpdateSchedulePreholidayDayDto } from './dto/schedule-preholiday-day.dto';
import { SchedulePreholidayDay } from './entities/schedule-preholiday-day.entity';
import { ScheduleNotifierService } from './schedule-notifier.service';

@Injectable()
export class SchedulePreholidayService {
    constructor(
        @InjectRepository(SchedulePreholidayDay)
        private readonly preholidayDaysRepository: Repository<SchedulePreholidayDay>,
        private readonly scheduleNotifier: ScheduleNotifierService,
        private readonly notificationsService: NotificationsService,
    ) {}

    private normalizeDate(value: string): string {
        const trimmed = value.trim();
        const isoMatch = trimmed.match(/^(\d{4})-(\d{2})-(\d{2})$/);

        if (isoMatch) {
            return trimmed;
        }

        const dottedMatch = trimmed.match(/^(\d{2})\.(\d{2})\.(\d{4})$/);

        if (dottedMatch) {
            return `${dottedMatch[3]}-${dottedMatch[2]}-${dottedMatch[1]}`;
        }

        throw new BadRequestException('Дата должна быть в формате ДД.ММ.ГГГГ');
    }

    private formatDate(value: string | Date): string {
        if (value instanceof Date) {
            const day = String(value.getDate()).padStart(2, '0');
            const month = String(value.getMonth() + 1).padStart(2, '0');
            const year = value.getFullYear();

            return `${day}.${month}.${year}`;
        }

        const [year, month, day] = value.split('-');

        return `${day}.${month}.${year}`;
    }

    async listPreholidayDays(): Promise<string[]> {
        const days = await this.preholidayDaysRepository.find({
            order: { date: 'ASC' },
        });

        return days.map((day) => this.formatDate(day.date));
    }

    async updatePreholidayDay(dto: UpdateSchedulePreholidayDayDto): Promise<string[]> {
        const date = this.normalizeDate(dto.date);
        let shouldNotifyUsers = false;

        if (dto.isPreholiday) {
            const existing = await this.preholidayDaysRepository.findOne({
                where: { date },
            });

            if (!existing) {
                await this.preholidayDaysRepository.save(
                    this.preholidayDaysRepository.create({ date }),
                );
                shouldNotifyUsers = true;
            }
        } else {
            await this.preholidayDaysRepository.delete({ date });
        }

        const preholidayDays = await this.listPreholidayDays();

        this.scheduleNotifier.notifyPreholidayDaysUpdated(preholidayDays);

        if (shouldNotifyUsers) {
            await this.notificationsService.notifyPreholidayDayCreated(date);
        }

        return preholidayDays;
    }
}
