import { IsBoolean, IsNotEmpty, IsString } from 'class-validator';

export class UpdateSchedulePreholidayDayDto {
    @IsString()
    @IsNotEmpty()
    date!: string;

    @IsBoolean()
    isPreholiday!: boolean;
}
