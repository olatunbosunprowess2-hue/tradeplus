import { Module } from '@nestjs/common';
import { CommunityPostsController } from './community-posts.controller';
import { CommunityPostsService } from './community-posts.service';
import { PrismaModule } from '../prisma/prisma.module';
import { NotificationsModule } from '../notifications/notifications.module';

@Module({
    imports: [PrismaModule, NotificationsModule],
    controllers: [CommunityPostsController],
    providers: [CommunityPostsService],
    exports: [CommunityPostsService],
})
export class CommunityPostsModule { }
