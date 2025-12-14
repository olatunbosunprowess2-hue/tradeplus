import { Module } from '@nestjs/common';
import { AdminService } from './admin.service';
import { AdminController } from './admin.controller';
import { NotificationsModule } from '../notifications/notifications.module';
import { EmailModule } from '../email/email.module';

@Module({
    imports: [NotificationsModule, EmailModule],
    controllers: [AdminController],
    providers: [AdminService],
})
export class AdminModule { }
