import { Module, forwardRef } from '@nestjs/common';
import { MessagesService } from './messages.service';
import { MessagesController } from './messages.controller';
import { PrismaModule } from '../prisma/prisma.module';
import { NotificationsModule } from '../notifications/notifications.module';

import { ActivityModule } from '../activity/activity.module';

@Module({
    imports: [PrismaModule, forwardRef(() => NotificationsModule), ActivityModule],
    controllers: [MessagesController],
    providers: [MessagesService],
    exports: [MessagesService],
})
export class MessagesModule { }
