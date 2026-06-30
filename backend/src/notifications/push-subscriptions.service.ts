import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { PushSubscriptionDto } from './dto/push-subscription.dto';
import { PushSubscription } from './push-subscription.entity';

@Injectable()
export class PushSubscriptionsService {
    constructor(
        @InjectRepository(PushSubscription)
        private readonly pushSubscriptionsRepository: Repository<PushSubscription>,
    ) {}

    findByUserId(userId: number): Promise<PushSubscription[]> {
        return this.pushSubscriptionsRepository.find({
            where: { userId },
        });
    }

    findByUserAndEndpoint(userId: number, endpoint: string): Promise<PushSubscription | null> {
        return this.pushSubscriptionsRepository.findOne({
            where: { userId, endpoint },
        });
    }

    async subscribe(userId: number, dto: PushSubscriptionDto): Promise<void> {
        const existing = await this.pushSubscriptionsRepository.findOne({
            where: { endpoint: dto.endpoint },
        });

        if (existing) {
            existing.userId = userId;
            existing.p256dh = dto.p256dh;
            existing.auth = dto.auth;
            await this.pushSubscriptionsRepository.save(existing);
            return;
        }

        await this.pushSubscriptionsRepository.save(
            this.pushSubscriptionsRepository.create({
                userId,
                endpoint: dto.endpoint,
                p256dh: dto.p256dh,
                auth: dto.auth,
            }),
        );
    }

    async unsubscribe(userId: number, endpoint: string): Promise<void> {
        await this.pushSubscriptionsRepository.delete({ userId, endpoint });
    }

    async isSubscribed(userId: number, endpoint: string): Promise<boolean> {
        const subscription = await this.findByUserAndEndpoint(userId, endpoint);

        return Boolean(subscription);
    }

    async removeById(id: number): Promise<void> {
        await this.pushSubscriptionsRepository.delete({ id });
    }

    async removeAllForUser(userId: number): Promise<void> {
        await this.pushSubscriptionsRepository.delete({ userId });
    }
}
