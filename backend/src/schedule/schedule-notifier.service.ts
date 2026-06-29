import { Injectable } from '@nestjs/common'

import { ScheduleGateway } from './schedule.gateway'
import type { ScheduleChangedPayload } from './schedule.gateway'

@Injectable()
export class ScheduleNotifierService {
    constructor(
        private readonly scheduleGateway: ScheduleGateway,
    ) {}

    notifyScheduleChanged(reason: ScheduleChangedPayload['reason']): void {
        this.scheduleGateway.broadcastScheduleChanged({ reason })
    }

    notifyPreholidayDaysUpdated(preholidayDays: string[]): void {
        this.scheduleGateway.broadcastPreholidayDaysUpdated(preholidayDays)
        this.notifyScheduleChanged('preholiday-updated')
    }
}