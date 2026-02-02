import { Module, forwardRef } from '@nestjs/common';
import { MonetizationService } from './monetization.service';
import { MonetizationController } from './monetization.controller';
import { SubscriptionSchedulerService } from './subscription-scheduler.service';
import { PrismaModule } from '../prisma/prisma.module';
import { NotificationsModule } from '../notifications/notifications.module';
import { EmailModule } from '../email/email.module';

@Module({
    imports: [PrismaModule, forwardRef(() => NotificationsModule), forwardRef(() => EmailModule)],
    controllers: [MonetizationController],
    providers: [MonetizationService, SubscriptionSchedulerService],
    exports: [MonetizationService],
})
export class MonetizationModule { }
