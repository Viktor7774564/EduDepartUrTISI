import { Repository } from 'typeorm';
import { UpdateSchedulePreholidayDayDto } from './dto/schedule-preholiday-day.dto';
import { SchedulePreholidayDay } from './entities/schedule-preholiday-day.entity';
import { ScheduleNotifierService } from "./schedule-notifier.service";
export declare class SchedulePreholidayService {
    private readonly preholidayDaysRepository;
    private readonly scheduleNotifier;
    constructor(preholidayDaysRepository: Repository<SchedulePreholidayDay>, scheduleNotifier: ScheduleNotifierService);
    private normalizeDate;
    private formatDate;
    listPreholidayDays(): Promise<string[]>;
    updatePreholidayDay(dto: UpdateSchedulePreholidayDayDto): Promise<string[]>;
}
