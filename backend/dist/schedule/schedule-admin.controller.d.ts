import { CreateScheduleItemDto, ScheduleTransferRecommendationDto, ScheduleTransferRecommendationQueryDto, UpdateScheduleItemDto } from './dto/schedule-item.dto';
import { ScheduleAdminService } from './schedule-admin.service';
import { ScheduleDisplayLesson } from './schedule-display.service';
export declare class ScheduleAdminController {
    private readonly scheduleAdminService;
    constructor(scheduleAdminService: ScheduleAdminService);
    createItem(dto: CreateScheduleItemDto): Promise<ScheduleDisplayLesson>;
    getTransferRecommendations(id: number, query: ScheduleTransferRecommendationQueryDto): Promise<ScheduleTransferRecommendationDto[]>;
    updateItem(id: number, dto: UpdateScheduleItemDto): Promise<ScheduleDisplayLesson>;
    disableItem(id: number): Promise<void>;
    deleteItem(id: number): Promise<void>;
}
