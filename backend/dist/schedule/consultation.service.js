"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ConsultationService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const departments_service_1 = require("../academic/departments.service");
const consultation_entity_1 = require("./entities/consultation.entity");
const schedule_slot_utils_1 = require("./parser/schedule-slot.utils");
const DAY_LABELS = {
    1: 'ПН',
    2: 'ВТ',
    3: 'СР',
    4: 'ЧТ',
    5: 'ПТ',
    6: 'СБ',
    7: 'ВС',
};
let ConsultationService = class ConsultationService {
    consultationsRepository;
    departmentsService;
    constructor(consultationsRepository, departmentsService) {
        this.consultationsRepository = consultationsRepository;
        this.departmentsService = departmentsService;
    }
    formatTeacherName(user) {
        const nameInitial = user.name?.charAt(0) ?? '';
        const patronymicInitial = user.patronymic?.charAt(0) ?? '';
        return `${user.surname} ${nameInitial}.${patronymicInitial}.`.trim();
    }
    parseWeekStart(value) {
        const dottedMatch = value.trim().match(/^(\d{2})\.(\d{2})\.(\d{4})$/);
        if (dottedMatch) {
            return new Date(Number(dottedMatch[3]), Number(dottedMatch[2]) - 1, Number(dottedMatch[1]));
        }
        const [year, month, day] = value.split('-').map(Number);
        return new Date(year, month - 1, day);
    }
    formatWeekLabel(weekStart) {
        const start = this.parseWeekStart(weekStart);
        const end = new Date(start);
        end.setDate(end.getDate() + 6);
        const pad = (part) => String(part).padStart(2, '0');
        return `${pad(start.getDate())}.${pad(start.getMonth() + 1)} - ${pad(end.getDate())}.${pad(end.getMonth() + 1)}`;
    }
    formatTime(value) {
        return value.slice(0, 5);
    }
    mapConsultation(consultation) {
        return {
            id: consultation.id,
            day: DAY_LABELS[consultation.dayOfWeek] ?? '',
            startTime: this.formatTime(consultation.startTime),
            endTime: this.formatTime(consultation.endTime),
            subject: consultation.subject,
            teacher: this.formatTeacherName(consultation.teacher),
            type: consultation.consultationType,
            room: consultation.room?.trim() ?? '',
            group: '',
            subgroup: null,
            isSameCellParallel: false,
            comment: null,
            weekStart: (0, schedule_slot_utils_1.normalizeWeekStart)(String(consultation.weekStart)),
        };
    }
    async listDepartments() {
        return this.departmentsService.listTeacherDepartments();
    }
    async getDepartmentConsultations(departmentId) {
        const department = await this.departmentsService.getTeacherDepartmentById(departmentId);
        const consultations = await this.consultationsRepository.find({
            where: { departmentId },
            relations: ['teacher'],
            order: {
                weekStart: 'ASC',
                dayOfWeek: 'ASC',
                startTime: 'ASC',
            },
        });
        const weeks = new Map();
        const weekOrder = [];
        for (const consultation of consultations) {
            const weekLabel = this.formatWeekLabel(String(consultation.weekStart));
            if (!weeks.has(weekLabel)) {
                weeks.set(weekLabel, []);
                weekOrder.push(weekLabel);
            }
            weeks.get(weekLabel)?.push(this.mapConsultation(consultation));
        }
        const orderedWeeks = {};
        for (const weekLabel of weekOrder) {
            orderedWeeks[weekLabel] = weeks.get(weekLabel) ?? [];
        }
        return {
            departmentId: department.id,
            departmentName: department.name,
            departmentLabel: department.label,
            weeks: orderedWeeks,
        };
    }
    assertTeacherInDepartment(user, departmentId) {
        const teacherDepartmentId = user.teacherProfile?.departmentId;
        if (!teacherDepartmentId || teacherDepartmentId !== departmentId) {
            throw new common_1.ForbiddenException('Можно управлять консультациями только своей кафедры');
        }
    }
    async createConsultation(user, dto) {
        this.assertTeacherInDepartment(user, dto.departmentId);
        await this.departmentsService.getTeacherDepartmentById(dto.departmentId);
        const consultation = this.consultationsRepository.create({
            departmentId: dto.departmentId,
            teacherId: user.id,
            subject: dto.subject.trim(),
            consultationType: dto.consultationType,
            dayOfWeek: dto.dayOfWeek,
            startTime: dto.startTime,
            endTime: dto.endTime,
            weekStart: dto.weekStart,
            room: dto.room?.trim() || null,
        });
        const saved = await this.consultationsRepository.save(consultation);
        const withTeacher = await this.consultationsRepository.findOne({
            where: { id: saved.id },
            relations: ['teacher'],
        });
        if (!withTeacher) {
            throw new common_1.NotFoundException('Консультация не найдена');
        }
        return this.mapConsultation(withTeacher);
    }
    async updateConsultation(user, id, dto) {
        const consultation = await this.consultationsRepository.findOne({
            where: { id },
            relations: ['teacher'],
        });
        if (!consultation) {
            throw new common_1.NotFoundException('Консультация не найдена');
        }
        this.assertTeacherInDepartment(user, consultation.departmentId);
        if (dto.subject !== undefined) {
            consultation.subject = dto.subject.trim();
        }
        if (dto.consultationType !== undefined) {
            consultation.consultationType = dto.consultationType;
        }
        if (dto.dayOfWeek !== undefined) {
            consultation.dayOfWeek = dto.dayOfWeek;
        }
        if (dto.startTime !== undefined) {
            consultation.startTime = dto.startTime;
        }
        if (dto.endTime !== undefined) {
            consultation.endTime = dto.endTime;
        }
        if (dto.weekStart !== undefined) {
            consultation.weekStart = dto.weekStart;
        }
        if (dto.room !== undefined) {
            consultation.room = dto.room.trim() || null;
        }
        const saved = await this.consultationsRepository.save(consultation);
        return this.mapConsultation(saved);
    }
    async deleteConsultation(user, id) {
        const consultation = await this.consultationsRepository.findOne({
            where: { id },
        });
        if (!consultation) {
            throw new common_1.NotFoundException('Консультация не найдена');
        }
        this.assertTeacherInDepartment(user, consultation.departmentId);
        await this.consultationsRepository.delete(id);
    }
};
exports.ConsultationService = ConsultationService;
exports.ConsultationService = ConsultationService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(consultation_entity_1.Consultation)),
    __metadata("design:paramtypes", [typeorm_2.Repository,
        departments_service_1.DepartmentsService])
], ConsultationService);
//# sourceMappingURL=consultation.service.js.map