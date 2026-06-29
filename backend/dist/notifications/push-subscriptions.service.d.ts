import { Repository } from 'typeorm';
import { PushSubscriptionDto } from './dto/push-subscription.dto';
import { PushSubscription } from './push-subscription.entity';
export declare class PushSubscriptionsService {
    private readonly pushSubscriptionsRepository;
    constructor(pushSubscriptionsRepository: Repository<PushSubscription>);
    findByUserId(userId: number): Promise<PushSubscription[]>;
    subscribe(userId: number, dto: PushSubscriptionDto): Promise<void>;
    unsubscribe(userId: number, endpoint: string): Promise<void>;
    removeById(id: number): Promise<void>;
    removeAllForUser(userId: number): Promise<void>;
}
