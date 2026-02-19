import { Module } from '@nestjs/common';
import { BarterService } from './barter.service';
import { BarterController } from './barter.controller';
import { NotificationsModule } from '../notifications/notifications.module';
import { EmailModule } from '../email/email.module';

import { TradeExpirationService } from './trade-expiration.service';

@Module({
    imports: [NotificationsModule, EmailModule],
    controllers: [BarterController],
    providers: [BarterService, TradeExpirationService],
    exports: [BarterService],
})
export class BarterModule { }
