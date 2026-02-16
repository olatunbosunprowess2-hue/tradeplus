import { Module, forwardRef } from '@nestjs/common';
import { NotificationsService } from './notifications.service';
import { NotificationsController } from './notifications.controller';
import { PrismaModule } from '../prisma/prisma.module';
import { MessagesModule } from '../messages/messages.module';


import { ActivityModule } from '../activity/activity.module';

@Module({
    imports: [PrismaModule, ActivityModule, forwardRef(() => MessagesModule)],

    controllers: [NotificationsController],
    providers: [NotificationsService],
    exports: [NotificationsService],
})
export class NotificationsModule { }
