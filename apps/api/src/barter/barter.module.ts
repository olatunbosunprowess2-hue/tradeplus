import { Module } from '@nestjs/common';
import { BarterService } from './barter.service';
import { BarterController } from './barter.controller';
import { NotificationsModule } from '../notifications/notifications.module';

@Module({
    imports: [NotificationsModule],
    controllers: [BarterController],
    providers: [BarterService],
    exports: [BarterService],
})
export class BarterModule { }
